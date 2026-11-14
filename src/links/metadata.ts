import { parse, type HTMLElement } from "node-html-parser";
import type { LinkType } from "./types";

export type LinkMetadata = {
  title: string | null;
  site: string | null;
  thumbnailUrl: string | null;
  type: LinkType;
  estMinutes: number | null;
};

const WORDS_PER_MINUTE = 230;
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_TITLE_CHARS = 120;
const USER_AGENT = "Mozilla/5.0 (compatible; ReadLater/1.0)";

const hostnameOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

function isYouTube(url: URL): boolean {
  return url.hostname === "youtube.com" && (url.pathname === "/watch" || url.pathname.startsWith("/shorts/"));
}

function isXPost(url: URL): boolean {
  return url.hostname === "x.com" && /^\/[^/]+\/status\/\d+/.test(url.pathname);
}

function parseIsoDuration(value: string | undefined): number | null {
  const m = value?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const [d, h, min, s] = m.slice(1).map((n) => Number(n ?? 0));
  const total = d * 86400 + h * 3600 + min * 60 + s;
  return total > 0 ? total : null;
}

function countWords(root: HTMLElement): number {
  const container = root.querySelector("article") ?? root.querySelector("main") ?? root.querySelector("body");
  if (!container) return 0;
  container.querySelectorAll("script, style, noscript, nav, header, footer").forEach((el) => el.remove());
  return container.text.split(/\s+/).filter(Boolean).length;
}

export function parseHtml(
  html: string,
  pageUrl: string,
): LinkMetadata & { durationSeconds: number | null } {
  const root = parse(html);
  const meta = (selector: string) => root.querySelector(selector)?.getAttribute("content")?.trim() || undefined;

  const title = meta('meta[property="og:title"]') ?? meta('meta[name="twitter:title"]') ?? root.querySelector("title")?.text.trim();
  const image = meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]');
  const durationSeconds = parseIsoDuration(meta('meta[itemprop="duration"]'));
  const isVideo = meta('meta[property="og:type"]')?.startsWith("video") ?? false;

  let thumbnailUrl: string | null = null;
  if (image) {
    try {
      thumbnailUrl = new URL(image, pageUrl).href;
    } catch {
      thumbnailUrl = null;
    }
  }

  const estMinutes = durationSeconds
    ? Math.ceil(durationSeconds / 60)
    : Math.max(1, Math.round(countWords(root) / WORDS_PER_MINUTE));

  return {
    title: title || null,
    site: meta('meta[property="og:site_name"]') ?? hostnameOf(pageUrl),
    thumbnailUrl,
    type: isVideo || durationSeconds ? "video" : "article",
    estMinutes,
    durationSeconds,
  };
}

async function readTextLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes));
}

async function fetchHtml(url: string, fetchImpl: typeof fetch): Promise<string | null> {
  const response = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    await response.body?.cancel().catch(() => {});
    return null;
  }
  return readTextLimited(response, MAX_HTML_BYTES);
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return (await response.json()) as T;
}

async function youTubeMetadata(url: string, fetchImpl: typeof fetch): Promise<LinkMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const [oembed, watchPage] = await Promise.all([
    fetchJson<{ title?: string; thumbnail_url?: string }>(oembedUrl, fetchImpl),
    // oEmbed has no duration; the watch page's itemprop is best-effort.
    fetchHtml(url, fetchImpl).catch(() => null),
  ]);
  const durationSeconds = watchPage ? parseHtml(watchPage, url).durationSeconds : null;
  return {
    title: oembed.title ?? null,
    site: "YouTube",
    thumbnailUrl: oembed.thumbnail_url ?? null,
    type: "video",
    estMinutes: durationSeconds ? Math.ceil(durationSeconds / 60) : null,
  };
}

async function xPostMetadata(url: string, fetchImpl: typeof fetch): Promise<LinkMetadata> {
  const oembedUrl = `https://publish.x.com/oembed?omit_script=1&url=${encodeURIComponent(url)}`;
  const oembed = await fetchJson<{ author_name?: string; html?: string }>(oembedUrl, fetchImpl);
  const text = oembed.html ? parse(oembed.html).querySelector("p")?.text.trim() : undefined;
  const title = text
    ? text.length > MAX_TITLE_CHARS
      ? `${text.slice(0, MAX_TITLE_CHARS - 1)}…`
      : text
    : oembed.author_name
      ? `Post by ${oembed.author_name}`
      : null;
  return { title, site: "X", thumbnailUrl: null, type: "thread", estMinutes: null };
}

/** Best-effort preview for a canonical URL. Never throws: failures yield nulls. */
export async function fetchMetadata(
  canonicalUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LinkMetadata> {
  const parsed = new URL(canonicalUrl);
  const empty = (type: LinkType, site: string): LinkMetadata => ({
    title: null,
    site,
    thumbnailUrl: null,
    type,
    estMinutes: null,
  });

  try {
    if (isYouTube(parsed)) return await youTubeMetadata(canonicalUrl, fetchImpl);
    if (isXPost(parsed)) return await xPostMetadata(canonicalUrl, fetchImpl);

    const html = await fetchHtml(canonicalUrl, fetchImpl);
    if (html === null) return empty("other", hostnameOf(canonicalUrl));
    const { durationSeconds: _, ...meta } = parseHtml(html, canonicalUrl);
    return meta;
  } catch {
    if (isYouTube(parsed)) return empty("video", "YouTube");
    if (isXPost(parsed)) return empty("thread", "X");
    return empty("other", hostnameOf(canonicalUrl));
  }
}

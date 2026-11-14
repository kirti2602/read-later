export class InvalidUrlError extends Error {
  constructor(input: string) {
    super(`Not a valid web link: ${input}`);
    this.name = "InvalidUrlError";
  }
}

const TRACKING_PARAMS = new Set(["fbclid", "gclid", "igshid", "si", "ref_src"]);
const X_SHARE_PARAMS = new Set(["s", "t"]);

/**
 * `url` is what the user gave (trimmed, scheme added); `canonicalUrl` is the
 * dedupe key: the same page reached via share links, tracking params, www./m.
 * or twitter.com/youtu.be aliases maps to one string.
 */
export function canonicalizeUrl(input: string): { url: string; canonicalUrl: string } {
  const trimmed = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new InvalidUrlError(input);
  }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) {
    throw new InvalidUrlError(input);
  }

  const url = parsed.href;
  const c = new URL(parsed.href);
  c.protocol = "https:";
  c.hash = "";
  c.hostname = c.hostname.replace(/^(www|m|mobile)\./, "");

  if (c.hostname === "twitter.com") c.hostname = "x.com";
  if (c.hostname === "youtu.be") {
    const videoId = c.pathname.slice(1);
    c.hostname = "youtube.com";
    c.pathname = "/watch";
    c.searchParams.set("v", videoId);
  }

  const kept = [...c.searchParams].filter(
    ([key]) =>
      !key.startsWith("utm_") &&
      !TRACKING_PARAMS.has(key) &&
      !(c.hostname === "x.com" && X_SHARE_PARAMS.has(key)),
  );
  kept.sort(([a], [b]) => a.localeCompare(b));
  c.search = new URLSearchParams(kept).toString();

  if (c.pathname.length > 1 && c.pathname.endsWith("/")) {
    c.pathname = c.pathname.replace(/\/+$/, "");
  }

  return { url, canonicalUrl: c.href };
}

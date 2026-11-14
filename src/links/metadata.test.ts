import { describe, expect, it } from "vitest";
import { fetchMetadata, parseHtml } from "./metadata";

const html = (head: string, body = "") =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

describe("parseHtml", () => {
  it("prefers og:title and og:site_name", () => {
    const meta = parseHtml(
      html(
        `<title>Fallback</title><meta property="og:title" content="Tom &amp; Jerry"><meta property="og:site_name" content="The Blog">`,
      ),
      "https://example.com/post",
    );
    expect(meta.title).toBe("Tom & Jerry");
    expect(meta.site).toBe("The Blog");
  });

  it("falls back to <title> and the hostname without www.", () => {
    const meta = parseHtml(html(`<title> Plain title </title>`), "https://www.example.com/a");
    expect(meta.title).toBe("Plain title");
    expect(meta.site).toBe("example.com");
  });

  it("resolves a relative og:image against the page URL", () => {
    const meta = parseHtml(
      html(`<meta property="og:image" content="/img/cover.png">`),
      "https://example.com/posts/1",
    );
    expect(meta.thumbnailUrl).toBe("https://example.com/img/cover.png");
  });

  it("estimates article minutes at 230 words per minute, at least 1", () => {
    expect(parseHtml(html("", `<article>${words(1150)}</article>`), "https://e.com").estMinutes).toBe(5);
    expect(parseHtml(html("", `<p>${words(20)}</p>`), "https://e.com").estMinutes).toBe(1);
    expect(parseHtml(html("", `<p>${words(20)}</p>`), "https://e.com").type).toBe("article");
  });

  it("ignores script and style text when counting words", () => {
    const body = `<script>${words(5000)}</script><style>${words(5000)}</style><p>${words(460)}</p>`;
    expect(parseHtml(html("", body), "https://e.com").estMinutes).toBe(2);
  });

  it("treats og:type video.* as a video and reads itemprop duration", () => {
    const meta = parseHtml(
      html(`<meta property="og:type" content="video.other"><meta itemprop="duration" content="PT1H2M30S">`),
      "https://e.com/v",
    );
    expect(meta.type).toBe("video");
    expect(meta.durationSeconds).toBe(3750);
    expect(meta.estMinutes).toBe(63);
  });
});

type Route = (url: string) => Response | Promise<Response>;
const stubFetch =
  (routes: Record<string, Route>): typeof fetch =>
  async (input) => {
    const url = String(input);
    const key = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return routes[key](url);
  };
const htmlResponse = (body: string) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

describe("fetchMetadata", () => {
  it("uses YouTube oEmbed plus the watch page duration", async () => {
    const fetchImpl = stubFetch({
      "https://www.youtube.com/oembed": () =>
        Response.json({ title: "A talk", author_name: "Chan", thumbnail_url: "https://i.ytimg.com/vi/x/hq.jpg" }),
      "https://youtube.com/watch": () =>
        htmlResponse(html(`<meta itemprop="duration" content="PT4M13S">`)),
    });
    expect(await fetchMetadata("https://youtube.com/watch?v=x", fetchImpl)).toEqual({
      title: "A talk",
      site: "YouTube",
      thumbnailUrl: "https://i.ytimg.com/vi/x/hq.jpg",
      type: "video",
      estMinutes: 5,
    });
  });

  it("uses X oEmbed text as the title of a thread", async () => {
    const tweet = `<blockquote><p lang="en">${"long ".repeat(40)}text</p>&mdash; Someone</blockquote>`;
    const fetchImpl = stubFetch({
      "https://publish.x.com/oembed": () => Response.json({ author_name: "Someone", html: tweet }),
    });
    const meta = await fetchMetadata("https://x.com/someone/status/1", fetchImpl);
    expect(meta.type).toBe("thread");
    expect(meta.site).toBe("X");
    expect(meta.title!.length).toBeLessThanOrEqual(120);
    expect(meta.title!.startsWith("long long")).toBe(true);
  });

  it("returns type other with no title for non-HTML responses", async () => {
    const fetchImpl = stubFetch({
      "https://example.com/file.pdf": () =>
        new Response("%PDF", { headers: { "content-type": "application/pdf" } }),
    });
    expect(await fetchMetadata("https://example.com/file.pdf", fetchImpl)).toEqual({
      title: null,
      site: "example.com",
      thumbnailUrl: null,
      type: "other",
      estMinutes: null,
    });
  });

  it("never throws when the fetch fails, keeping the type implied by the URL", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("timeout");
    };
    expect(await fetchMetadata("https://x.com/someone/status/1", fetchImpl)).toEqual({
      title: null,
      site: "X",
      thumbnailUrl: null,
      type: "thread",
      estMinutes: null,
    });
    expect((await fetchMetadata("https://example.com/a", fetchImpl)).type).toBe("other");
  });
});

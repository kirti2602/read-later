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
    expect(await fetchMetadata({ url: "https://youtube.com/watch?v=x", canonicalUrl: "https://youtube.com/watch?v=x" }, fetchImpl)).toEqual({
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
    const meta = await fetchMetadata({ url: "https://x.com/someone/status/1", canonicalUrl: "https://x.com/someone/status/1" }, fetchImpl);
    expect(meta.type).toBe("thread");
    expect(meta.site).toBe("X");
    expect(meta.title!.length).toBeLessThanOrEqual(120);
    expect(meta.title!.startsWith("long long")).toBe(true);
  });

  it("takes the X picture and title from the page served to link-preview bots", async () => {
    let pageUserAgent: string | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.startsWith("https://publish.x.com/oembed")) {
        return Response.json({ author_name: "Addy Osmani", html: `<blockquote><p lang="zxx"><a href="https://t.co/a">https://t.co/a</a></p></blockquote>` });
      }
      pageUserAgent = new Headers(init?.headers).get("user-agent");
      return htmlResponse(
        html(
          `<meta property="og:title" content="Addy Osmani on X: &quot;How the Claude Code team does code review&quot; / X">` +
            `<meta property="og:image" content="https://pbs.twimg.com/media/HV?format=webp&amp;name=large">`,
        ),
      );
    };
    const meta = await fetchMetadata(
      { url: "https://x.com/addyosmani/status/1", canonicalUrl: "https://x.com/addyosmani/status/1" },
      fetchImpl,
    );
    expect(pageUserAgent).toMatch(/Slackbot/);
    expect(meta.title).toBe("How the Claude Code team does code review");
    expect(meta.thumbnailUrl).toBe("https://pbs.twimg.com/media/HV?format=webp&name=large");
    expect(meta.type).toBe("thread");
  });

  it("retries the X preview page once when it fails", async () => {
    let pageCalls = 0;
    const fetchImpl: typeof fetch = async (input) => {
      if (String(input).startsWith("https://publish.x.com/oembed")) {
        return Response.json({ author_name: "A", html: `<blockquote><p>text</p></blockquote>` });
      }
      pageCalls += 1;
      if (pageCalls === 1) throw new TypeError("fetch failed");
      return htmlResponse(html(`<meta property="og:image" content="https://pbs.twimg.com/media/X.jpg">`));
    };
    const meta = await fetchMetadata(
      { url: "https://x.com/a/status/1", canonicalUrl: "https://x.com/a/status/1" },
      fetchImpl,
    );
    expect(pageCalls).toBe(2);
    expect(meta.thumbnailUrl).toBe("https://pbs.twimg.com/media/X.jpg");
  });

  it("drops t.co and pic links from X text, falling back to the author", async () => {
    const xMeta = (p: string) =>
      fetchMetadata(
        { url: "https://x.com/someone/status/1", canonicalUrl: "https://x.com/someone/status/1" },
        stubFetch({
          "https://publish.x.com/oembed": () =>
            Response.json({ author_name: "Addy Osmani", html: `<blockquote>${p}&mdash; Addy</blockquote>` }),
        }),
      );
    expect((await xMeta(`<p lang="zxx"><a href="https://t.co/4Hfk0dYIBI">https://t.co/4Hfk0dYIBI</a></p>`)).title).toBe(
      "Post by Addy Osmani",
    );
    expect((await xMeta(`<p lang="en">Read this https://t.co/abc pic.x.com/xyz</p>`)).title).toBe("Read this");
  });

  it("fetches ordinary pages at the original URL, not the canonical one", async () => {
    const fetchImpl = stubFetch({
      "http://www.old.example/a": () => htmlResponse(html(`<title>Old site</title>`)),
    });
    const meta = await fetchMetadata(
      { url: "http://www.old.example/a", canonicalUrl: "https://old.example/a" },
      fetchImpl,
    );
    expect(meta.title).toBe("Old site");
  });

  it("retries once when the first fetch fails on the network", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) throw new TypeError("fetch failed");
      return htmlResponse(html(`<title>Second try</title>`));
    };
    const meta = await fetchMetadata(
      { url: "https://example.com/a", canonicalUrl: "https://example.com/a" },
      fetchImpl,
    );
    expect(meta.title).toBe("Second try");
    expect(calls).toBe(2);
  });

  it("returns type other with no title for non-HTML responses", async () => {
    const fetchImpl = stubFetch({
      "https://example.com/file.pdf": () =>
        new Response("%PDF", { headers: { "content-type": "application/pdf" } }),
    });
    expect(await fetchMetadata({ url: "https://example.com/file.pdf", canonicalUrl: "https://example.com/file.pdf" }, fetchImpl)).toEqual({
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
    expect(await fetchMetadata({ url: "https://x.com/someone/status/1", canonicalUrl: "https://x.com/someone/status/1" }, fetchImpl)).toEqual({
      title: null,
      site: "X",
      thumbnailUrl: null,
      type: "thread",
      estMinutes: null,
    });
    expect((await fetchMetadata({ url: "https://example.com/a", canonicalUrl: "https://example.com/a" }, fetchImpl)).type).toBe("other");
  });
});

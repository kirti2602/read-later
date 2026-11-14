import { describe, expect, it } from "vitest";
import { renderDigestEmail, type DigestEmailInput, type EmailLink } from "./email";

const link = (id: string, overrides: Partial<EmailLink> = {}): EmailLink => ({
  id,
  title: `Title ${id}`,
  url: `https://example.com/${id}`,
  site: "example.com",
  type: "article",
  est_minutes: 7,
  ...overrides,
});

const doneUrl = (l: EmailLink) => `https://app.test/done/${l.id}`;
const appUrl = "https://read-later-alpha.vercel.app";

const render = (input: Partial<DigestEmailInput> = {}) =>
  renderDigestEmail({ appUrl, fresh: [link("a")], carried: [], doneUrl, ...input });

const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe("numbering and sections", () => {
  const input = { fresh: [link("a"), link("b"), link("c")], carried: [link("d"), link("e")] };

  it("numbers items 1..n continuously across both sections", () => {
    const { html, text } = render(input);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`>${n}</td>`);
      expect(text).toMatch(new RegExp(`^${n}\\. Title`, "m"));
    }
    expect(html).not.toContain(">6</td>");
    expect(html.indexOf("Title c")).toBeLessThan(html.indexOf("From last week"));
    expect(html.indexOf("From last week")).toBeLessThan(html.indexOf("Title d"));
    expect(text.indexOf("From last week")).toBeGreaterThan(text.indexOf("3. Title c"));
    expect(text.indexOf("From last week")).toBeLessThan(text.indexOf("4. Title d"));
  });

  it("shows From last week only when carried is non-empty", () => {
    const { html, text } = render({ fresh: [link("a"), link("b")], carried: [] });
    expect(html).not.toContain("From last week");
    expect(text).not.toContain("From last week");
    expect(render(input).html).toContain(">From last week<");
  });

  it("shows only the From last week section when nothing is fresh", () => {
    const { html, text } = render({ fresh: [], carried: [link("d"), link("e")] });
    expect(html).toContain(">From last week<");
    expect(html).toContain(">1</td>");
    expect(html).toContain("Title d");
    expect(text).toMatch(/^1\. Title d/m);
    expect(text).toContain("2 links");
  });

  it("has a heading, a hidden preheader first in the body, and the footer", () => {
    const { html, text } = render();
    expect(html).toContain("Your week&#39;s reading");
    const body = html.slice(html.indexOf("<body"));
    expect(body.indexOf("Open or tick off each one.")).toBeLessThan(body.indexOf("Your week"));
    expect(html).toMatch(/display:none[^>]*>Open or tick off each one\./);
    expect(hrefs(html)).toContain(appUrl);
    expect(html).toContain(">Open Read Later</a>");
    expect(html).toContain("every Saturday at 09:00");
    expect(text).toContain(`Open Read Later: ${appUrl}`);
    expect(text).toContain("every Saturday at 09:00");
  });
});

describe("summary and subject", () => {
  const timed = (id: string, minutes: number | null) => link(id, { est_minutes: minutes });

  it("states the total when every item has minutes", () => {
    const { subject, html, text } = render({ fresh: [timed("a", 20), timed("b", 22)], carried: [timed("c", 0 + 5)] });
    expect(subject).toBe("Your Saturday reading: 3 links, ~47 min");
    expect(html).toContain("3 links, about 47 min");
    expect(text).toContain("3 links, about 47 min");
  });

  it("says how many items the total covers when only some have minutes", () => {
    const { subject, html } = render({ fresh: [timed("a", 20), timed("b", null)], carried: [timed("c", 7)] });
    expect(subject).toBe("Your Saturday reading: 3 links");
    expect(html).toContain("3 links, about 27 min for 2 of them");
  });

  it("gives only the count when no item has minutes", () => {
    const { subject, html, text } = render({ fresh: [timed("a", null), timed("b", null)] });
    expect(subject).toBe("Your Saturday reading: 2 links");
    expect(html).toContain(">2 links<");
    expect(text).toMatch(/^2 links$/m);
  });

  it("uses the singular for one link", () => {
    const { subject, html } = render({ fresh: [timed("a", 5)] });
    expect(subject).toBe("Your Saturday reading: 1 link, ~5 min");
    expect(html).toContain("1 link, about 5 min");
    expect(render({ fresh: [timed("a", null)] }).subject).toBe("Your Saturday reading: 1 link");
  });

  it("prefixes the subject and adds a note for a test digest only", () => {
    const test = render({ isTest: true });
    expect(test.subject).toBe("[Test] Your Saturday reading: 1 link, ~7 min");
    expect(test.html).toContain("This is a test. Saturday&#39;s digest is unaffected.");
    expect(test.text).toContain("This is a test. Saturday's digest is unaffected.");
    const real = render();
    expect(real.subject).not.toContain("[Test]");
    expect(real.html).not.toContain("This is a test");
    expect(real.text).not.toContain("This is a test");
  });
});

describe("items", () => {
  it("links the title and shows the source line and minutes", () => {
    const { html, text } = render({
      fresh: [link("v", { type: "video", site: "YouTube", est_minutes: 12 }), link("n", { site: null, est_minutes: null })],
    });
    expect(html).toContain("Video on YouTube · 12 min");
    expect(html).toContain("Article from example.com<");
    expect(html).toMatch(/<a href="https:\/\/example\.com\/v"[^>]*>Title v<\/a>/);
    expect(text).toContain("Video on YouTube · 12 min");
  });

  it("falls back to the hostname when there is no title", () => {
    const { html } = render({ fresh: [link("a", { title: null, url: "https://www.example.org/x" })] });
    expect(html).toContain(">example.org</a>");
  });

  it("gives each item exactly one Done href equal to doneUrl(item)", () => {
    const fresh = [link("a"), link("b")];
    const carried = [link("c")];
    const all = hrefs(render({ fresh, carried }).html);
    for (const l of [...fresh, ...carried]) {
      expect(all.filter((h) => h === doneUrl(l))).toHaveLength(1);
    }
  });

  it("gives each http item an Open button and a linked title", () => {
    const { html } = render({ fresh: [link("a"), link("b")] });
    expect(count(html, ">Open</a>")).toBe(2);
    expect(hrefs(html).filter((h) => h === "https://example.com/a")).toHaveLength(2);
  });

  it("escapes ampersands in the Done href and keeps the plain-text URL raw", () => {
    const withQuery = (l: EmailLink) => `https://app.test/done?id=${l.id}&t=abc`;
    const { html, text } = render({ doneUrl: withQuery });
    expect(html).toContain('href="https://app.test/done?id=a&amp;t=abc"');
    expect(text).toContain("Done: https://app.test/done?id=a&t=abc");
  });
});

describe("escaping and unsafe URLs", () => {
  it("renders HTML in a title inert", () => {
    const { html } = render({ fresh: [link("a", { title: "<script>alert(1)</script>" })] });
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("cannot break out of an attribute through the title", () => {
    const { html } = render({ fresh: [link("a", { title: '"onmouseover="x' })] });
    expect(html).not.toContain('"onmouseover="');
    expect(html).toContain("&quot;onmouseover=&quot;x");
  });

  it("escapes quotes, angle brackets and ampersands in URL attributes", () => {
    const url = `https://example.com/?a=1&b="><script>x</script>'`;
    const { html } = render({ fresh: [link("a", { url })] });
    expect(html).not.toContain("<script");
    expect(html).toContain("https://example.com/?a=1&amp;b=&quot;&gt;&lt;script&gt;x&lt;/script&gt;&#39;");
  });

  it("escapes the site and the app URL", () => {
    const { html } = render({ appUrl: 'https://x.test/?q="<b>', fresh: [link("a", { site: "<b>evil</b>" })] });
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;evil&lt;/b&gt;");
  });

  it("renders a non-http URL as plain text with no Open button, keeping Done", () => {
    const bad = link("bad", { title: "Sneaky", url: "javascript:alert(1)" });
    const { html, text } = render({ fresh: [bad, link("ok")] });
    expect(hrefs(html).some((h) => h.startsWith("javascript:"))).toBe(false);
    expect(count(html, ">Open</a>")).toBe(1);
    expect(html).toContain("Sneaky");
    expect(hrefs(html)).toContain(doneUrl(bad));
    expect(text).not.toContain("Open: javascript:");
    expect(text).toContain(`Done: ${doneUrl(bad)}`);
  });

  it("survives a title-less item whose URL is not parseable", () => {
    const { html } = render({ fresh: [link("a", { title: null, site: null, url: "not a url" })] });
    expect(html).toContain("not a url");
    expect(count(html, ">Open</a>")).toBe(0);
  });
});

describe("email-safe markup", () => {
  const { html } = render({ fresh: [link("a"), link("b")], carried: [link("c")], isTest: true });

  it("has no oklch, script, image, external CSS or style block", () => {
    expect(html).not.toContain("oklch(");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("@import");
    expect(html).not.toContain("url(");
  });

  it("uses a centred 560px table layout and the system font stack", () => {
    expect(html).toContain("max-width:560px");
    expect(html).toContain("<table");
    expect(html).toContain("-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");
  });

  it("only links to the items, Done endpoints and the app", () => {
    const allowed = new Set([appUrl, ...["a", "b", "c"].flatMap((id) => [`https://example.com/${id}`, `https://app.test/done/${id}`])]);
    for (const h of hrefs(html)) expect(allowed.has(h)).toBe(true);
  });
});

describe("plain text", () => {
  it("has numbered lines with Open and Done URLs", () => {
    const { text } = render({ fresh: [link("a"), link("b")], carried: [link("c")] });
    expect(text).toMatch(/^1\. Title a$/m);
    expect(text).toContain("Open: https://example.com/a");
    expect(text).toContain("Done: https://app.test/done/a");
    expect(text).toMatch(/^3\. Title c$/m);
    expect(text).toContain("Done: https://app.test/done/c");
    expect(text).toContain("3 links, about 21 min");
    expect(text).not.toMatch(/<[a-z]/);
  });
});

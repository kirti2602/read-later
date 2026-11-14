import { describe, expect, it } from "vitest";
import { canonicalizeUrl, InvalidUrlError } from "./canonicalize";

const canon = (input: string) => canonicalizeUrl(input).canonicalUrl;

describe("canonicalizeUrl", () => {
  it("adds https:// when the scheme is missing and trims whitespace", () => {
    expect(canonicalizeUrl("  example.com/post \n")).toEqual({
      url: "https://example.com/post",
      canonicalUrl: "https://example.com/post",
    });
  });

  it("keeps the original url but upgrades the canonical one to https", () => {
    expect(canonicalizeUrl("http://example.com/a")).toEqual({
      url: "http://example.com/a",
      canonicalUrl: "https://example.com/a",
    });
  });

  it.each(["javascript:alert(1)", "ftp://example.com/file", "not a url", "hello", "", "https://"])(
    "rejects %j",
    (input) => {
      expect(() => canonicalizeUrl(input)).toThrow(InvalidUrlError);
    },
  );

  it("lowercases the host and strips www. and m.", () => {
    expect(canon("https://WWW.Example.com/Path")).toBe("https://example.com/Path");
    expect(canon("https://m.example.com/a")).toBe("https://example.com/a");
  });

  it("drops the hash and tracking params, sorts the rest", () => {
    expect(
      canon("https://example.com/a?utm_source=x&b=2&fbclid=1&a=1&gclid=2&igshid=3&ref_src=4#top"),
    ).toBe("https://example.com/a?a=1&b=2");
  });

  it("drops a trailing slash except on the root path", () => {
    expect(canon("https://example.com/post/")).toBe("https://example.com/post");
    expect(canon("https://example.com/")).toBe("https://example.com/");
  });

  it("maps twitter.com variants to x.com and drops share params there only", () => {
    expect(canon("https://mobile.twitter.com/user/status/123?s=20&t=abc")).toBe(
      "https://x.com/user/status/123",
    );
    expect(canon("https://example.com/a?s=20&t=abc")).toBe("https://example.com/a?s=20&t=abc");
  });

  it("maps youtu.be and mobile YouTube to youtube.com/watch and drops si", () => {
    expect(canon("https://youtu.be/dQw4w9WgXcQ?si=xyz")).toBe(
      "https://youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(canon("https://m.youtube.com/watch?v=dQw4w9WgXcQ&si=xyz")).toBe(
      "https://youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});

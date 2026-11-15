import { describe, expect, it } from "vitest";
import { extractSharedUrl } from "./shared-url";

describe("extractSharedUrl", () => {
  it("prefers the url field when it holds a web link", () => {
    expect(extractSharedUrl({ url: "https://example.com/a", text: "ignored https://other.com" })).toBe("https://example.com/a");
  });

  it("finds the link inside shared text, as X and YouTube send it", () => {
    expect(extractSharedUrl({ text: "Look at this https://x.com/a/status/1?s=20 🔥" })).toBe("https://x.com/a/status/1?s=20");
    expect(extractSharedUrl({ title: "A talk", text: "https://youtu.be/WHqbqzqeskw" })).toBe("https://youtu.be/WHqbqzqeskw");
  });

  it("drops trailing punctuation that isn't part of the link", () => {
    expect(extractSharedUrl({ text: "Read (https://example.com/post)." })).toBe("https://example.com/post");
    expect(extractSharedUrl({ text: "see https://example.com/a, then https://b.com" })).toBe("https://example.com/a");
  });

  it("falls back to the title when apps put the link there", () => {
    expect(extractSharedUrl({ title: "https://example.com/t" })).toBe("https://example.com/t");
  });

  it("returns null when nothing shared is a web link", () => {
    expect(extractSharedUrl({ text: "just some words", url: "ftp://files.example.com" })).toBeNull();
    expect(extractSharedUrl({})).toBeNull();
  });
});

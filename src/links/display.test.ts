import { describe, expect, it } from "vitest";
import { displayTitle, isPreviewPending } from "./display";

const savedAt = "2026-11-14T10:00:00.000Z";
const at = (seconds: number) => Date.parse(savedAt) + seconds * 1000;

describe("isPreviewPending", () => {
  it("is pending while a fresh link has no title yet", () => {
    expect(isPreviewPending({ title: null, saved_at: savedAt }, at(5))).toBe(true);
  });

  it("stops after 30 seconds so a failed preview never spins forever", () => {
    expect(isPreviewPending({ title: null, saved_at: savedAt }, at(31))).toBe(false);
  });

  it("is not pending once a title exists", () => {
    expect(isPreviewPending({ title: "Post", saved_at: savedAt }, at(1))).toBe(false);
  });
});

describe("displayTitle", () => {
  it("uses the title, else the hostname without www.", () => {
    expect(displayTitle({ title: "Post", url: "https://example.com/a" })).toBe("Post");
    expect(displayTitle({ title: null, url: "https://www.news.umich.edu/x/" })).toBe("news.umich.edu");
  });
});

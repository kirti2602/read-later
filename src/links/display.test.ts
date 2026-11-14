import { describe, expect, it } from "vitest";
import { displayTitle, formatDay, isPreviewPending, listSummary, sourceLine } from "./display";

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

describe("sourceLine", () => {
  it("names the type and where it comes from, in words", () => {
    expect(sourceLine({ type: "article", site: "udayan.co", url: "https://udayan.co/a" })).toBe("Article from udayan.co");
    expect(sourceLine({ type: "video", site: "YouTube", url: "https://youtube.com/watch?v=x" })).toBe("Video on YouTube");
    expect(sourceLine({ type: "thread", site: "X", url: "https://x.com/a/status/1" })).toBe("Post on X");
    expect(sourceLine({ type: "other", site: null, url: "https://www.example.com/f.pdf" })).toBe("example.com");
  });
});

describe("listSummary", () => {
  it("counts links and sums the minutes it knows", () => {
    expect(listSummary([{ est_minutes: 5 }, { est_minutes: 37 }, { est_minutes: null }])).toEqual({
      count: 3,
      minutes: 42,
    });
    expect(listSummary([])).toEqual({ count: 0, minutes: 0 });
  });
});

describe("formatDay", () => {
  it("formats the day in the user's timezone", () => {
    // 03:30Z is 09:00 on the 14th in Kolkata
    expect(formatDay(new Date("2026-11-14T03:30:00Z"), "Asia/Kolkata")).toBe("14 November");
    expect(formatDay(new Date("2026-11-14T03:30:00Z"), "America/Los_Angeles")).toBe("13 November");
  });
});

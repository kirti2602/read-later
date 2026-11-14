import { describe, expect, it } from "vitest";
import { displayTitle, faviconUrl, formatDay, isPreviewPending, listSummary, parseType, savedDay, sourceLine, youTubeId } from "./display";

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
      timed: 2,
    });
    expect(listSummary([])).toEqual({ count: 0, minutes: 0, timed: 0 });
  });
});

describe("formatDay", () => {
  it("formats the day in the user's timezone", () => {
    // 03:30Z is 09:00 on the 14th in Kolkata
    expect(formatDay(new Date("2026-11-14T03:30:00Z"), "Asia/Kolkata")).toBe("14 November");
    expect(formatDay(new Date("2026-11-14T03:30:00Z"), "America/Los_Angeles")).toBe("13 November");
  });
});

describe("youTubeId", () => {
  it("reads the id from watch, short, shorts and embed links", () => {
    expect(youTubeId("https://youtube.com/watch?v=WHqbqzqeskw")).toBe("WHqbqzqeskw");
    expect(youTubeId("https://www.youtube.com/watch?v=WHqbqzqeskw&list=RD1&t=42s")).toBe("WHqbqzqeskw");
    expect(youTubeId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
    expect(youTubeId("https://youtube.com/shorts/abcDEF12345")).toBe("abcDEF12345");
    expect(youTubeId("https://www.youtube.com/embed/abcDEF12345")).toBe("abcDEF12345");
  });

  it("returns null for anything that is not one video", () => {
    expect(youTubeId("https://youtube.com/@somechannel")).toBeNull();
    expect(youTubeId("https://youtube.com/playlist?list=PL123")).toBeNull();
    expect(youTubeId("https://example.com/watch?v=WHqbqzqeskw")).toBeNull();
    expect(youTubeId("https://youtube.com/watch?v=bad id")).toBeNull();
  });
});

describe("parseType", () => {
  it("accepts the three filterable types and falls back to all", () => {
    expect(parseType("video")).toBe("video");
    expect(parseType("thread")).toBe("thread");
    expect(parseType("article")).toBe("article");
    expect(parseType("other")).toBe("all");
    expect(parseType(undefined)).toBe("all");
    expect(parseType(["video"])).toBe("all");
  });
});

describe("savedDay", () => {
  const now = Date.parse("2026-11-15T12:00:00Z");
  it("says Today, Yesterday, else the date, in the user's timezone", () => {
    expect(savedDay("2026-11-15T03:00:00Z", now, "Asia/Kolkata")).toBe("Today");
    expect(savedDay("2026-11-14T10:00:00Z", now, "Asia/Kolkata")).toBe("Yesterday");
    expect(savedDay("2026-11-10T10:00:00Z", now, "Asia/Kolkata")).toBe("10 Nov");
  });
});

describe("faviconUrl", () => {
  it("asks the site itself for its icon", () => {
    expect(faviconUrl("https://www.techpowerup.com/news/123")).toBe("https://www.techpowerup.com/favicon.ico");
    expect(faviconUrl("http://example.com:8080/a")).toBe("http://example.com:8080/favicon.ico");
  });
});

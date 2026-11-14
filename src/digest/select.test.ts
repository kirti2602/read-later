import { describe, expect, it } from "vitest";
import { digestWindow, selectDigestLinks, type DigestLink } from "./select";

const india = { timeZone: "Asia/Kolkata", digestDay: 6, digestTime: "09:00" };
const newYork = { timeZone: "America/New_York", digestDay: 6, digestTime: "09:00" };

const iso = (d: Date) => d.toISOString();

describe("digestWindow", () => {
  it("covers the week that just ended at Saturday 09:00 IST", () => {
    const w = digestWindow(new Date("2026-11-21T03:30:00Z"), india);
    expect(iso(w.start)).toBe("2026-11-14T03:30:00.000Z");
    expect(iso(w.end)).toBe("2026-11-21T03:30:00.000Z");
    expect(iso(w.previousStart)).toBe("2026-11-07T03:30:00.000Z");
  });

  it("picks the same week for retries after 09:00", () => {
    const base = digestWindow(new Date("2026-11-21T03:30:00Z"), india);
    for (const at of ["2026-11-21T03:45:00Z", "2026-11-21T04:00:00Z"]) {
      const w = digestWindow(new Date(at), india);
      expect(iso(w.start)).toBe(iso(base.start));
      expect(iso(w.end)).toBe(iso(base.end));
      expect(iso(w.previousStart)).toBe(iso(base.previousStart));
    }
  });

  it("spans the right instants across the New York DST change", () => {
    // Sat 2026-11-07 09:00 EST; DST ended Sun 2026-11-01.
    const w = digestWindow(new Date("2026-11-07T14:00:00Z"), newYork);
    expect(iso(w.end)).toBe("2026-11-07T14:00:00.000Z"); // 09:00 EST
    expect(iso(w.start)).toBe("2026-10-31T13:00:00.000Z"); // 09:00 EDT
    expect(iso(w.previousStart)).toBe("2026-10-24T13:00:00.000Z"); // 09:00 EDT
    expect(w.end.getTime() - w.start.getTime()).toBe(169 * 3600_000);
  });
});

const window = digestWindow(new Date("2026-11-21T03:30:00Z"), india);

function link(id: string, saved_at: string, over: Partial<DigestLink> = {}): DigestLink {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    site: "example.com",
    type: "article",
    est_minutes: 5,
    status: "unread",
    saved_at,
    digest_count: 0,
    ...over,
  };
}

const ids = (links: DigestLink[]) => links.map((l) => l.id);

describe("selectDigestLinks", () => {
  it("treats the window as start-inclusive, end-exclusive", () => {
    const { fresh } = selectDigestLinks(
      [
        link("before", "2026-11-14T03:29:59.999Z"),
        link("at-start", "2026-11-14T03:30:00.000Z"),
        link("at-end", "2026-11-21T03:30:00.000Z"),
      ],
      window,
    );
    expect(ids(fresh)).toEqual(["at-start"]);
  });

  it("does not filter fresh links on digest_count", () => {
    const { fresh } = selectDigestLinks(
      [
        link("zero", "2026-11-15T00:00:00Z", { digest_count: 0 }),
        link("two", "2026-11-16T00:00:00Z", { digest_count: 2 }),
      ],
      window,
    );
    expect(ids(fresh)).toEqual(["two", "zero"]);
  });

  it("excludes done and deleted links from both lists", () => {
    const { fresh, carried } = selectDigestLinks(
      [
        link("done", "2026-11-15T00:00:00Z", { status: "done" }),
        link("deleted", "2026-11-16T00:00:00Z", { status: "deleted" }),
        link("old-done", "2026-11-08T00:00:00Z", { status: "done", digest_count: 1 }),
        link("old-deleted", "2026-11-09T00:00:00Z", { status: "deleted", digest_count: 1 }),
      ],
      window,
    );
    expect(fresh).toEqual([]);
    expect(carried).toEqual([]);
  });

  it("carries only unread links from the previous week shown exactly once", () => {
    const { carried } = selectDigestLinks(
      [
        link("never-shown", "2026-11-08T00:00:00Z", { digest_count: 0 }),
        link("shown-once", "2026-11-09T00:00:00Z", { digest_count: 1 }),
        link("shown-twice", "2026-11-10T00:00:00Z", { digest_count: 2 }),
        link("too-old", "2026-11-07T03:29:59.999Z", { digest_count: 1 }),
        link("at-previous-start", "2026-11-07T03:30:00.000Z", { digest_count: 1 }),
        link("at-start", "2026-11-14T03:30:00.000Z", { digest_count: 1 }),
      ],
      window,
    );
    expect(ids(carried)).toEqual(["shown-once", "at-previous-start"]);
  });

  it("orders both lists newest first without mutating the input", () => {
    const input = [
      link("f1", "2026-11-15T00:00:00Z"),
      link("f3", "2026-11-19T00:00:00Z"),
      link("f2", "2026-11-17T00:00:00Z"),
      link("c1", "2026-11-08T00:00:00Z", { digest_count: 1 }),
      link("c2", "2026-11-12T00:00:00Z", { digest_count: 1 }),
    ];
    const snapshot = ids(input);
    const { fresh, carried } = selectDigestLinks(input, window);
    expect(ids(fresh)).toEqual(["f3", "f2", "f1"]);
    expect(ids(carried)).toEqual(["c2", "c1"]);
    expect(ids(input)).toEqual(snapshot);
  });

  it("keeps extra fields on the returned rows", () => {
    const row = { ...link("x", "2026-11-15T00:00:00Z"), user_id: "u1" };
    const { fresh } = selectDigestLinks([row], window);
    expect(fresh[0].user_id).toBe("u1");
  });
});

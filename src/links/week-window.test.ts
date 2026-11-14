import { describe, expect, it } from "vitest";
import { windowStart } from "./week-window";

const india = { timeZone: "Asia/Kolkata", digestDay: 6, digestTime: "09:00" };
const newYork = { timeZone: "America/New_York", digestDay: 6, digestTime: "09:00:00" };

describe("windowStart", () => {
  it("is this Saturday 09:00 once it has passed", () => {
    // Sat 2026-11-14 10:00 IST
    expect(windowStart(new Date("2026-11-14T04:30:00Z"), india).toISOString()).toBe(
      "2026-11-14T03:30:00.000Z",
    );
  });

  it("is last Saturday 09:00 just before the boundary", () => {
    // Sat 2026-11-14 08:59 IST
    expect(windowStart(new Date("2026-11-14T03:29:00Z"), india).toISOString()).toBe(
      "2026-11-07T03:30:00.000Z",
    );
  });

  it("includes the boundary instant itself", () => {
    expect(windowStart(new Date("2026-11-14T03:30:00Z"), india).toISOString()).toBe(
      "2026-11-14T03:30:00.000Z",
    );
  });

  it("covers the rest of the week", () => {
    // Fri 2026-11-20 23:00 IST
    expect(windowStart(new Date("2026-11-20T17:30:00Z"), india).toISOString()).toBe(
      "2026-11-14T03:30:00.000Z",
    );
  });

  it("uses the offset in force on the Saturday across a DST change", () => {
    // Fri 2026-11-06 12:00 EST; window began Sat 2026-10-31 09:00 EDT
    expect(windowStart(new Date("2026-11-06T17:00:00Z"), newYork).toISOString()).toBe(
      "2026-10-31T13:00:00.000Z",
    );
    // Sat 2026-11-07 10:00 EST
    expect(windowStart(new Date("2026-11-07T15:00:00Z"), newYork).toISOString()).toBe(
      "2026-11-07T14:00:00.000Z",
    );
  });
});

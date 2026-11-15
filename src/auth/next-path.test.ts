import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps this site's own paths, with their query", () => {
    expect(safeNextPath("/share?url=https%3A%2F%2Fexample.com")).toBe("/share?url=https%3A%2F%2Fexample.com");
    expect(safeNextPath("/?view=done")).toBe("/?view=done");
  });

  it("refuses anything that could leave the site", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com/path")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
  });

  it("falls back to the list for empty or odd values", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("share")).toBe("/");
    expect(safeNextPath("/login")).toBe("/");
  });
});

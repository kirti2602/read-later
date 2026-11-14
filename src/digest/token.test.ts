import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signDoneToken, verifyDoneToken } from "./token";

const secret = "test-secret";
const payload = {
  linkId: "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b",
  userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
};
const now = new Date("2026-11-21T03:30:00Z");
const DAY = 24 * 60 * 60 * 1000;

const b64url = (value: string) => Buffer.from(value).toString("base64url");
function forge(body: object, key = secret) {
  const first = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", key).update(first).digest("base64url");
  return `${first}.${sig}`;
}

describe("done token", () => {
  it("round-trips", () => {
    const token = signDoneToken(payload, secret, now);
    expect(verifyDoneToken(token, secret, now)).toEqual(payload);
  });

  it("is URL-safe", () => {
    expect(signDoneToken(payload, secret, now)).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("rejects a tampered payload", () => {
    const [, sig] = signDoneToken(payload, secret, now).split(".");
    const other = b64url(
      JSON.stringify({ l: payload.userId, u: payload.userId, e: now.getTime() + DAY }),
    );
    expect(verifyDoneToken(`${other}.${sig}`, secret, now)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const [first, sig] = signDoneToken(payload, secret, now).split(".");
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(verifyDoneToken(`${first}.${flipped}`, secret, now)).toBeNull();
    expect(verifyDoneToken(`${first}.${sig.slice(0, -2)}`, secret, now)).toBeNull();
    expect(verifyDoneToken(`${first}.${sig}AA`, secret, now)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = signDoneToken(payload, "other-secret", now);
    expect(verifyDoneToken(token, secret, now)).toBeNull();
  });

  it("expires after 30 days by default", () => {
    const token = signDoneToken(payload, secret, now);
    expect(verifyDoneToken(token, secret, new Date(now.getTime() + 30 * DAY - 1))).toEqual(
      payload,
    );
    expect(verifyDoneToken(token, secret, new Date(now.getTime() + 30 * DAY))).toBeNull();
  });

  it("honours a custom ttl", () => {
    const token = signDoneToken(payload, secret, now, 1000);
    expect(verifyDoneToken(token, secret, new Date(now.getTime() + 999))).toEqual(payload);
    expect(verifyDoneToken(token, secret, new Date(now.getTime() + 1000))).toBeNull();
  });

  it("returns null for garbage without throwing", () => {
    for (const bad of ["", "a.b", "...", "not base64!!", "a.b.c", ".", "%%%.%%%"]) {
      expect(verifyDoneToken(bad, secret, now)).toBeNull();
    }
  });

  it("returns null for validly signed but malformed bodies", () => {
    const e = now.getTime() + DAY;
    expect(verifyDoneToken(forge({ l: payload.linkId, u: payload.userId }), secret, now)).toBeNull();
    expect(verifyDoneToken(forge({ l: payload.linkId, u: payload.userId, e: "x" }), secret, now)).toBeNull();
    expect(verifyDoneToken(forge({ l: 1, u: 2, e }), secret, now)).toBeNull();
    expect(verifyDoneToken(forge(null as unknown as object), secret, now)).toBeNull();
    const first = b64url("not json");
    const sig = createHmac("sha256", secret).update(first).digest("base64url");
    expect(verifyDoneToken(`${first}.${sig}`, secret, now)).toBeNull();
  });

  it("rejects ids that are not UUIDs even when correctly signed", () => {
    const e = now.getTime() + DAY;
    expect(verifyDoneToken(forge({ l: "link-1", u: payload.userId, e }), secret, now)).toBeNull();
    expect(verifyDoneToken(forge({ l: payload.linkId, u: "'; drop table", e }), secret, now)).toBeNull();
    expect(verifyDoneToken(forge({ l: payload.linkId, u: payload.userId, e }), secret, now)).toEqual(
      payload,
    );
  });

  it("refuses to sign with an empty secret and never verifies with one", () => {
    expect(() => signDoneToken(payload, "", now)).toThrow();
    const token = forge({ l: payload.linkId, u: payload.userId, e: now.getTime() + DAY }, "");
    expect(verifyDoneToken(token, "", now)).toBeNull();
  });
});

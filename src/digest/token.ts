import { createHmac, timingSafeEqual } from "node:crypto";

export type DoneTokenPayload = { linkId: string; userId: string };

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

/**
 * Stateless token for the email's Done link: `base64url({l,u,e}).base64url(HMAC)`,
 * where `e` is expiry in epoch ms. Throws on an empty secret (misconfiguration).
 */
export function signDoneToken(
  payload: DoneTokenPayload,
  secret: string,
  now: Date = new Date(),
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  if (!secret) throw new Error("signDoneToken: secret must not be empty");
  const body = Buffer.from(
    JSON.stringify({ l: payload.linkId, u: payload.userId, e: now.getTime() + ttlMs }),
  ).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/** Returns the payload for a genuine, unexpired token, otherwise null. Never throws. */
export function verifyDoneToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): DoneTokenPayload | null {
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims !== "object" || claims === null) return null;

  const { l, u, e } = claims as Record<string, unknown>;
  if (typeof l !== "string" || typeof u !== "string" || typeof e !== "number") return null;
  if (now.getTime() >= e) return null;
  if (!UUID.test(l) || !UUID.test(u)) return null;

  return { linkId: l, userId: u };
}

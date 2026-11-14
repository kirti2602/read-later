import "server-only";

/** Digest settings read from the environment; each throws a clear message when missing. */
export function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("Missing APP_URL (e.g. https://read-later-alpha.vercel.app)");
  return url.replace(/\/+$/, "");
}

export function doneSecret(): string {
  const secret = process.env.DIGEST_SECRET;
  if (!secret) throw new Error("Missing DIGEST_SECRET; generate one with `openssl rand -base64 32`");
  return secret;
}

export function cronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("Missing CRON_SECRET; generate one with `openssl rand -base64 32`");
  return secret;
}

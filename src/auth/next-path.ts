/**
 * Where to go after signing in. Only this site's own paths are allowed, so a crafted
 * `?next=` can never send someone to another site (`//evil.com` and `/\evil.com` are
 * both read by browsers as other hosts).
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value === "/login" || value.startsWith("/login?")) return "/";
  return value;
}

import { displayTitle, listSummary, sourceLine } from "@/links/display";
import type { LinkType } from "@/links/types";

export type EmailLink = {
  id: string;
  title: string | null;
  url: string;
  site: string | null;
  type: LinkType;
  est_minutes: number | null;
};

export type DigestEmailInput = {
  appUrl: string;
  /** This week's unread links, already ordered. */
  fresh: EmailLink[];
  /** "From last week" leftovers, already ordered. */
  carried: EmailLink[];
  /** One-tap Done link for an item. */
  doneUrl: (link: EmailLink) => string;
  /** A test send: marked as such, and says it does not use up Saturday's digest. */
  isTest?: boolean;
};

/** Hex of the Hum tokens (src/app/tokens.css, light values); email clients do not parse oklch(). */
const COLORS = {
  paper: "#f7f5ec",
  card: "#fcfbf6",
  ink: "#12161c",
  ink2: "#272c32",
  muted: "#565b63",
  rule: "#d7d4c9",
  link: "#0064be",
  mint: "#70e093",
  mintDeep: "#4aa969",
  accent: "#f7d21a",
} as const;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const TEST_NOTE = "This is a test. Saturday's digest is unaffected.";
const SCHEDULE_NOTE = "This digest arrives every Saturday at 09:00.";
const PREHEADER = "Open or tick off each one.";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** The string itself when it is an http(s) URL, else null: other schemes never become an href. */
function safeUrl(value: string): string | null {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function hasHostname(url: string): boolean {
  try {
    return new URL(url).hostname !== "";
  } catch {
    return false;
  }
}

/** displayTitle and sourceLine parse the URL for a hostname; a saved "link" can be anything. */
function describe(link: EmailLink) {
  const safe = hasHostname(link.url) ? link : { ...link, title: link.title ?? link.url, site: link.site ?? link.url };
  const meta = [sourceLine(safe), link.est_minutes ? `${link.est_minutes} min` : null].filter(Boolean).join(" · ");
  return { title: displayTitle(safe), meta };
}

function summaryLine(links: EmailLink[]): string {
  const { count, minutes, timed } = listSummary(links);
  const total = `${count} ${count === 1 ? "link" : "links"}`;
  if (timed === 0) return total;
  return timed === count ? `${total}, about ${minutes} min` : `${total}, about ${minutes} min for ${timed} of them`;
}

function subjectFor(links: EmailLink[], isTest: boolean): string {
  const { count, minutes, timed } = listSummary(links);
  const total = `${count} ${count === 1 ? "link" : "links"}`;
  const body = timed > 0 && timed === count ? `${total}, ~${minutes} min` : total;
  return `${isTest ? "[Test] " : ""}Your Saturday reading: ${body}`;
}

const textStyle = (size: number, color: string, extra = "") =>
  `margin:0;font-family:${FONT};font-size:${size}px;line-height:1.45;color:${color};${extra}`;

function button(label: string, href: string, kind: "open" | "done", ariaLabel: string): string {
  const done = kind === "done";
  const bg = done ? COLORS.mint : COLORS.card;
  const border = done ? `1px solid ${COLORS.mintDeep}` : `1px solid ${COLORS.rule}`;
  return `<td bgcolor="${bg}" style="background-color:${bg};border:${border};border-radius:12px;padding:0;">
<a href="${esc(href)}" aria-label="${esc(ariaLabel)}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1.2;color:${COLORS.ink};text-decoration:none;">${label}</a></td>`;
}

function itemHtml(link: EmailLink, number: number, doneUrl: string): string {
  const { title, meta } = describe(link);
  const url = safeUrl(link.url);
  const done = safeUrl(doneUrl);
  const titleHtml = url
    ? `<a href="${esc(url)}" style="color:${COLORS.ink};text-decoration:none;">${esc(title)}</a>`
    : esc(title);
  const buttons = [
    url ? button("Open", url, "open", `Open ${title}`) : null,
    done ? button("Done", done, "done", `Mark done: ${title}`) : null,
  ].filter((b): b is string => b !== null);
  const buttonRow = buttons.length
    ? `<tr><td colspan="2" style="padding:14px 0 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${buttons.join('<td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>')}</tr></table></td></tr>`
    : "";
  return `<tr><td style="padding:0 0 12px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.card}" style="background-color:${COLORS.card};border:1px solid ${COLORS.rule};border-radius:20px;">
<tr><td style="padding:18px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="36" valign="top" style="width:36px;padding:0 14px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="32" height="32" align="center" bgcolor="${COLORS.accent}" style="width:32px;height:32px;background-color:${COLORS.accent};border-radius:16px;font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.ink};text-align:center;line-height:32px;">${number}</td></tr></table></td>
<td valign="top" style="${textStyle(17, COLORS.ink, "font-weight:600;")}">${titleHtml}<div style="${textStyle(14, COLORS.muted, "padding-top:4px;")}">${esc(meta)}</div></td>
</tr>
${buttonRow}
</table>
</td></tr>
</table>
</td></tr>`;
}

function sectionHeading(label: string): string {
  return `<tr><td style="padding:12px 0 12px 0;"><h2 style="${textStyle(18, COLORS.ink, "font-weight:700;")}">${esc(label)}</h2></td></tr>`;
}

function itemText(link: EmailLink, number: number, doneUrl: string): string {
  const { title, meta } = describe(link);
  const url = safeUrl(link.url);
  return [`${number}. ${title}`, `   ${meta}`, url ? `   Open: ${url}` : null, `   Done: ${doneUrl}`].filter((l) => l !== null).join("\n");
}

export function renderDigestEmail({ appUrl, fresh, carried, doneUrl, isTest = false }: DigestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const all = [...fresh, ...carried];
  const subject = subjectFor(all, isTest);
  const summary = summaryLine(all);
  const sections = [
    { heading: null, links: fresh },
    { heading: "From last week", links: carried },
  ].filter((section) => section.links.length > 0);

  let number = 0;
  const rows = sections.map(({ heading, links }) => {
    const items = links.map((link) => itemHtml(link, ++number, doneUrl(link))).join("\n");
    return heading ? `${sectionHeading(heading)}\n${items}` : items;
  });

  const appHref = safeUrl(appUrl);
  const openApp = appHref
    ? `<a href="${esc(appHref)}" style="color:${COLORS.link};font-weight:600;">Open Read Later</a>`
    : "Open Read Later";
  const testNote = isTest
    ? `<tr><td style="padding:0 0 16px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.card}" style="background-color:${COLORS.card};border:1px solid ${COLORS.rule};border-radius:12px;"><tr><td style="padding:10px 14px;${textStyle(13, COLORS.ink2)}">${esc(TEST_NOTE)}</td></tr></table></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLORS.paper};mso-hide:all;">${esc(PREHEADER)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.paper}" style="background-color:${COLORS.paper};">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
${testNote}
<tr><td style="padding:0 0 4px 0;"><h1 style="${textStyle(26, COLORS.ink, "font-weight:700;")}">Your week&#39;s reading</h1></td></tr>
<tr><td style="padding:0 0 20px 0;${textStyle(15, COLORS.muted)}">${esc(summary)}</td></tr>
${rows.join("\n")}
<tr><td style="padding:12px 0 0 0;border-top:1px solid ${COLORS.rule};${textStyle(13, COLORS.muted)}">${openApp}<br>${esc(SCHEDULE_NOTE)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  number = 0;
  const textParts = [
    isTest ? TEST_NOTE : null,
    "Your week's reading",
    summary,
    ...sections.map(({ heading, links }) => {
      const items = links.map((link) => itemText(link, ++number, doneUrl(link))).join("\n\n");
      return heading ? `${heading}\n\n${items}` : items;
    }),
    `Open Read Later: ${appUrl}\n${SCHEDULE_NOTE}`,
  ].filter((part) => part !== null);

  return { subject, html, text: textParts.join("\n\n") + "\n" };
}

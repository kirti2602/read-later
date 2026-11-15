// Stops at whitespace and at characters that commonly wrap a link in prose: <>"' and ).,;!? at the end.
const WEB_LINK = /https?:\/\/[^\s<>"']+/i;
const TRAILING_PUNCTUATION = /[).,;:!?\]]+$/;

const isWebLink = (value: string) => /^https?:\/\//i.test(value);

function firstLinkIn(text: string | null | undefined): string | null {
  const match = text?.match(WEB_LINK)?.[0];
  return match ? match.replace(TRAILING_PUNCTUATION, "") : null;
}

/**
 * The link from a share: the `url` field when it is a web link, else the first link inside the
 * shared text (X and YouTube put it there), else in the title. Null when nothing is a web link.
 */
export function extractSharedUrl(shared: { url?: string | null; text?: string | null; title?: string | null }): string | null {
  const url = shared.url?.trim();
  if (url && isWebLink(url)) return url;
  return firstLinkIn(shared.text) ?? firstLinkIn(shared.title);
}

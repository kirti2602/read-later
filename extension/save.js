import { APP_URL } from "./config.js";

const NETWORK_MESSAGE = "Couldn't reach Read Later.";

export function isSavableUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const messageOf = (body, fallback) =>
  typeof body?.error === "string" && body.error.trim() ? body.error : fallback;

const titleOf = (body) =>
  typeof body?.link?.title === "string" && body.link.title.trim() ? body.link.title : null;

/**
 * Maps the API response to what the UI shows. Pure: no I/O.
 * @returns {{ kind: "saved" | "already" | "already_done" | "login" | "invalid" | "error", title?: string | null, message?: string }}
 */
export function interpret(status, body) {
  switch (status) {
    case 201:
      return { kind: "saved", title: titleOf(body) };
    case 200:
      return {
        kind: body?.link?.status === "done" ? "already_done" : "already",
        title: titleOf(body),
      };
    case 401:
      return { kind: "login" };
    case 400:
      return { kind: "invalid", message: messageOf(body, "That link can't be saved.") };
    case 503:
      return { kind: "error", message: messageOf(body, "Read Later is unavailable right now.") };
    default:
      return { kind: "error", message: messageOf(body, "Something went wrong saving this page.") };
  }
}

export async function saveUrl(url) {
  let response;
  try {
    response = await fetch(`${APP_URL}/api/links`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, source: "extension" }),
    });
  } catch {
    return { kind: "error", message: NETWORK_MESSAGE };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body (e.g. an HTML error page): interpret by status alone
  }
  return interpret(response.status, body);
}

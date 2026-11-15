import { APP_URL } from "./config.js";
import { isSavableUrl, saveUrl } from "./save.js";

const ICONS = {
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v6"/><path d="M12 17h.01"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 11v6"/><path d="M12 7h.01"/></svg>',
};

const status = document.getElementById("status");

document.getElementById("open-app").addEventListener("click", () => openTab(APP_URL));

function openTab(url) {
  chrome.tabs.create({ url });
  window.close();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render({ icon, tone, heading, detail, host, action }) {
  const iconEl = el("span", `icon ${tone}`);
  iconEl.innerHTML = ICONS[icon]; // static strings above, never page data

  const text = el("div", "text");
  text.append(el("p", "heading", heading));
  if (detail) text.append(el("p", "detail", detail));
  if (host) text.append(el("p", "host", host));

  const row = el("div", "row");
  row.append(iconEl, text);

  const children = [row];
  if (action) {
    const button = el("button", "primary", action.label);
    button.type = "button";
    button.addEventListener("click", action.run);
    children.push(button);
  }
  status.replaceChildren(...children);
  status.querySelector(".primary")?.focus();
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function run() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !isSavableUrl(tab.url)) {
    render({
      icon: "info",
      tone: "neutral",
      heading: "This page can't be saved",
      detail: "Read Later can only save web pages (http or https).",
    });
    return;
  }

  render({ icon: "info", tone: "neutral", heading: "Saving…" });

  const result = await saveUrl(tab.url);
  const title = result.title || tab.title || tab.url;
  const host = hostnameOf(tab.url);
  const retry = { label: "Try again", run };

  switch (result.kind) {
    case "saved":
      render({ icon: "check", tone: "ok", heading: "Saved", detail: title, host });
      break;
    case "already":
      render({ icon: "check", tone: "ok", heading: "Already in this week's list", detail: title, host });
      break;
    case "already_done":
      render({ icon: "check", tone: "ok", heading: "Already read this week", detail: title, host });
      break;
    case "login":
      render({
        icon: "alert",
        tone: "alert",
        heading: "Log in to Read Later",
        detail: "Log in once in this browser, then save again.",
        action: { label: "Log in", run: () => openTab(`${APP_URL}/login?next=/`) },
      });
      break;
    case "invalid":
      render({ icon: "alert", tone: "alert", heading: "Can't save this link", detail: result.message, action: retry });
      break;
    default:
      render({ icon: "alert", tone: "alert", heading: "Couldn't save", detail: result.message, action: retry });
  }
}

run();

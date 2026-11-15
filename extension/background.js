import { APP_URL } from "./config.js";
import { isSavableUrl, saveUrl } from "./save.js";

const MENU_LINK = "save-link";
const MENU_PAGE = "save-page";
const BADGE_MS = 3000;
const MINT_DEEP = "#4aa969";
const CORAL = "#f36b5e";
const INK = "#12161c";

const badgeTimers = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_LINK, title: "Save link to Read Later", contexts: ["link"] });
    chrome.contextMenus.create({ id: MENU_PAGE, title: "Save page to Read Later", contexts: ["page"] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id;
  if (tabId === undefined) return;

  const target = info.menuItemId === MENU_LINK ? info.linkUrl : (tab.url ?? info.pageUrl);
  if (!isSavableUrl(target)) {
    flashBadge(tabId, "!", CORAL);
    return;
  }

  const result = await saveUrl(target);
  if (result.kind === "saved" || result.kind === "already" || result.kind === "already_done") {
    flashBadge(tabId, "✓", MINT_DEEP);
    return;
  }
  flashBadge(tabId, "!", CORAL);
  if (result.kind === "login") chrome.tabs.create({ url: `${APP_URL}/login?next=/` });
});

function flashBadge(tabId, text, color) {
  clearTimeout(badgeTimers.get(tabId));
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeTextColor?.({ tabId, color: INK });
  chrome.action.setBadgeText({ tabId, text });
  badgeTimers.set(
    tabId,
    setTimeout(() => {
      badgeTimers.delete(tabId);
      chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {
        // tab closed before the badge expired
      });
    }, BADGE_MS),
  );
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * Browser-only UI state shared by components that don't share a parent: the Cards/List layout
 * (remembered in localStorage) and the list's search text (this visit only).
 */

export type Layout = "cards" | "list";

const LAYOUT_KEY = "layout";
const LAYOUT_EVENT = "layoutchange";
const QUERY_EVENT = "listquerychange";
let listQuery = "";

function readLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}

const subscribeTo = (event: string) => (onChange: () => void) => {
  window.addEventListener(event, onChange);
  return () => window.removeEventListener(event, onChange);
};
const subscribeLayout = subscribeTo(LAYOUT_EVENT);
const subscribeQuery = subscribeTo(QUERY_EVENT);

export function setLayout(layout: Layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Storage can be blocked; the layout still switches for this visit.
  }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
}

export function useLayout(): Layout {
  return useSyncExternalStore(subscribeLayout, readLayout, () => "cards");
}

export function setListQuery(query: string) {
  listQuery = query;
  window.dispatchEvent(new Event(QUERY_EVENT));
}

export function useListQuery(): string {
  return useSyncExternalStore(subscribeQuery, () => listQuery, () => "");
}

"use client";

import { useEffect } from "react";

/** Puts this week's unread count in the browser tab, e.g. "(7) Read Later". */
export function TitleCount({ count }: { count: number }) {
  useEffect(() => {
    document.title = count > 0 ? `(${count}) Read Later` : "Read Later";
  }, [count]);
  return null;
}

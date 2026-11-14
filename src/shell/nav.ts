import { CalendarDays, CircleCheck, Inbox, type LucideIcon } from "lucide-react";
import type { TypeFilter } from "@/links/display";
import type { View } from "@/links/queries";

export const NAV: { view: View; label: string; short: string; Icon: LucideIcon }[] = [
  { view: "week", label: "This week", short: "Week", Icon: CalendarDays },
  { view: "older", label: "Older unread", short: "Older", Icon: Inbox },
  { view: "done", label: "Done", short: "Done", Icon: CircleCheck },
];

/** The list URL for a view and type filter; both live in the URL so links and back/forward keep them. */
export function listHref(view: View, type: TypeFilter = "all"): string {
  const params = new URLSearchParams();
  if (view !== "week") params.set("view", view);
  if (type !== "all") params.set("type", type);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

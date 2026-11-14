import { BookOpen, Link2, MessageSquare, PlayCircle, type LucideIcon } from "lucide-react";
import type { LinkType } from "../types";

/** Per-type label, icon, open verb and the tint class its badge and placeholder use. */
export const TYPE_META: Record<LinkType, { label: string; verb: string; Icon: LucideIcon; tint: string }> = {
  article: { label: "Article", verb: "Read", Icon: BookOpen, tint: "bg-tint-article" },
  video: { label: "Video", verb: "Watch", Icon: PlayCircle, tint: "bg-tint-video" },
  thread: { label: "Post", verb: "View post", Icon: MessageSquare, tint: "bg-tint-post" },
  other: { label: "Link", verb: "Open", Icon: Link2, tint: "bg-paper-3" },
};

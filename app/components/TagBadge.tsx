import type { Tag } from "@/lib/types";

export function TagBadge({ tag }: { tag: Tag }) {
  return <span className={`tag tag-${tag.toLowerCase()}`}>{tag}</span>;
}

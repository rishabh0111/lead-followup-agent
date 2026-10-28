import type { Tag } from "./types";

export const REPS = ["Amit Verma", "Neha Kapoor", "Rahul Mehta", "Sana Sheikh", "Vikram Rao"] as const;
export const SOURCES = ["IndiaMART", "Trade show", "Website form", "Referral", "Cold call", "WhatsApp"] as const;
export const DATA_DATE = "2026-10-28";
export const MODEL = "gemini-3.5-flash-lite";
export const TAG_RANK: Record<Tag, number> = { Hot: 0, Warm: 1, Cold: 2 };

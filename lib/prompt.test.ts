import { expect, test } from "vitest";
import { buildPrompt } from "./prompt";
import { makeLead, msg } from "./test-helpers";

test("buildPrompt marks an empty chat and still gives today and days since contact", () => {
  const p = buildPrompt(makeLead({ lastContactDate: "2026-10-20", source: "IndiaMART" }), [], "2026-10-28");
  expect(p).toContain("(no chat yet)");
  expect(p).toContain("8 days");
  expect(p).toContain("IndiaMART");
  expect(p).not.toContain("REP:");
});

test("buildPrompt carries today, days since contact and REP/BUYER lines", () => {
  const lead = makeLead({ lastContactDate: "2026-10-23" });
  const chat = [
    msg("rep", "Sir, quote bhej diya hai.", "2026-10-23T04:30:00Z"),
    msg("buyer", "Thanks, will check.", "2026-10-23T05:00:00Z"),
  ];
  const p = buildPrompt(lead, chat, "2026-10-28");
  expect(p).toContain("2026-10-28");
  expect(p).toContain("5 days");
  expect(p).toContain("REP: Sir, quote bhej diya hai.");
  expect(p).toContain("BUYER: Thanks, will check.");
  expect(p).toContain("2026-10-23 10:00");
});

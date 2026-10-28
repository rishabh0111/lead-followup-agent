import { expect, test } from "vitest";
import { shiftSeed } from "./seed-shift";
import { makeLead } from "./test-helpers";
import type { SeedFile } from "./types";

function baseSeed(): SeedFile {
  return {
    dataDate: "2026-10-28",
    leads: [makeLead({ lastContactDate: "2026-10-26", followUpDate: "2026-10-27", requestedDate: "2026-11-03", assessedAt: "2026-10-26T12:00:00+05:30" }),
            makeLead({ id: "L002", requestedDate: null })],
    messages: [{ leadId: "L001", sentAt: "2026-10-26T10:14:00+05:30", sender: "rep", senderName: "Amit", text: "hi" }],
  };
}

test("shiftSeed moves every date by the same number of days", () => {
  const s = shiftSeed(baseSeed(), 3);
  expect(s.dataDate).toBe("2026-10-31");
  expect(s.leads[0]).toMatchObject({ lastContactDate: "2026-10-29", followUpDate: "2026-10-30", requestedDate: "2026-11-06", assessedAt: "2026-10-29T12:00:00+05:30" });
  expect(s.leads[1].requestedDate).toBeNull();
  expect(s.messages[0].sentAt).toBe("2026-10-29T10:14:00+05:30");
});

test("shiftSeed keeps the Z suffix of a toISOString timestamp", () => {
  const seed = baseSeed();
  seed.leads[0].assessedAt = "2026-10-28T06:30:00.000Z";
  expect(shiftSeed(seed, 3).leads[0].assessedAt).toBe("2026-10-31T06:30:00.000Z");
});

test("shiftSeed shifts a non-null draftSentAt and keeps null", () => {
  const seed = baseSeed();
  seed.leads[0].draftSentAt = "2026-10-27T09:00:00+05:30";
  const s = shiftSeed(seed, -2);
  expect(s.leads[0].draftSentAt).toBe("2026-10-25T09:00:00+05:30");
  expect(s.leads[1].draftSentAt).toBeNull();
});

test("shiftSeed does not mutate its input", () => {
  const seed = baseSeed();
  const copy = structuredClone(seed);
  shiftSeed(seed, 5);
  expect(seed).toEqual(copy);
});

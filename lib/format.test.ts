import { expect, test } from "vitest";
import { firstName, formatDay, messageDay, messageTime, overdueLabel, urgencyLabel } from "./format";

test("formatDay reads a YYYY-MM-DD date as that calendar day", () => {
  expect(formatDay("2026-10-28")).toBe("Wed 28 Oct");
  expect(formatDay("2026-11-03")).toBe("Tue 3 Nov");
});

test("overdueLabel is singular for one day", () => {
  expect(overdueLabel(1)).toBe("1 day overdue");
  expect(overdueLabel(9)).toBe("9 days overdue");
});

test("urgencyLabel covers overdue, due today and later", () => {
  expect(urgencyLabel("2026-10-26", "2026-10-28")).toBe("2 days overdue");
  expect(urgencyLabel("2026-10-28", "2026-10-28")).toBe("Due today");
  expect(urgencyLabel("2026-10-30", "2026-10-28")).toBe("Fri 30 Oct");
});

test("message time and day are in India time", () => {
  expect(messageTime("2026-10-28T19:05:00.000Z")).toBe("00:35");
  expect(messageDay("2026-10-28T19:05:00.000Z")).toBe("2026-10-29");
  expect(messageTime("2026-10-24T10:14:00+05:30")).toBe("10:14");
  expect(messageDay("2026-10-24T10:14:00+05:30")).toBe("2026-10-24");
});

test("firstName takes the first word", () => {
  expect(firstName("Amit Verma")).toBe("Amit");
});

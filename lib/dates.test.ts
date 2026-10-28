import { expect, test } from "vitest";
import { addDays, daysBetween, isoDate, todayIST } from "./dates";

test("todayIST uses India time, not UTC", () => {
  expect(todayIST(new Date("2026-10-28T19:00:00Z"))).toBe("2026-10-29");
  expect(todayIST(new Date("2026-10-28T18:00:00Z"))).toBe("2026-10-28");
});
test("addDays crosses month ends", () => {
  expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  expect(addDays("2026-11-02", -3)).toBe("2026-10-30");
});
test("daysBetween counts whole days, negative when to is earlier", () => {
  expect(daysBetween("2026-10-25", "2026-10-28")).toBe(3);
  expect(daysBetween("2026-10-28", "2026-10-25")).toBe(-3);
});
test("isoDate accepts real calendar dates only", () => {
  expect(isoDate("2026-10-28")).toBe(true);
  expect(isoDate("2026-02-30")).toBe(false);
  expect(isoDate("28/10/2026")).toBe(false);
});

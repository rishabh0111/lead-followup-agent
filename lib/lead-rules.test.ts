import { test, expect } from "vitest";
import { schedule, classify, order } from "./lead-rules";
import { makeLead } from "./test-helpers";

const T = "2026-10-28";
test("schedule uses the requested date when there is one", () => {
  expect(schedule("Cold", "2026-11-05", T)).toBe("2026-11-05");
});
test("schedule offsets by tag", () => {
  expect(schedule("Hot", null, T)).toBe("2026-10-28");
  expect(schedule("Warm", null, T)).toBe("2026-10-31");
  expect(schedule("Cold", null, T)).toBe("2026-11-07");
});
test("schedule never returns a date before today", () => {
  expect(schedule("Warm", "2026-10-20", T)).toBe(T);
});
test("classify splits at today", () => {
  expect(classify({ followUpDate: "2026-10-27" }, T)).toBe("overdue");
  expect(classify({ followUpDate: T }, T)).toBe("today");
  expect(classify({ followUpDate: "2026-10-29" }, T)).toBe("later");
});
test("order puts overdue first, by tag then most days overdue", () => {
  const coldLate = makeLead({ id: "A", tag: "Cold", followUpDate: "2026-10-19" });
  const hotLate = makeLead({ id: "B", tag: "Hot", followUpDate: "2026-10-27" });
  const hotLater = makeLead({ id: "C", tag: "Hot", followUpDate: "2026-10-24" });
  const dueWarm = makeLead({ id: "D", tag: "Warm", followUpDate: T });
  expect(order([dueWarm, coldLate, hotLate, hotLater], T).today.map(l => l.id)).toEqual(["C", "B", "A", "D"]);
});
test("due today orders by tag then oldest last contact", () => {
  const a = makeLead({ id: "A", tag: "Warm", followUpDate: T, lastContactDate: "2026-10-20" });
  const b = makeLead({ id: "B", tag: "Warm", followUpDate: T, lastContactDate: "2026-10-10" });
  const c = makeLead({ id: "C", tag: "Hot", followUpDate: T, lastContactDate: "2026-10-27" });
  expect(order([a, b, c], T).today.map(l => l.id)).toEqual(["C", "B", "A"]);
});
test("later list is ordered by follow-up date", () => {
  const a = makeLead({ id: "A", followUpDate: "2026-11-05" });
  const b = makeLead({ id: "B", followUpDate: "2026-10-30" });
  const r = order([a, b], T);
  expect(r.today).toEqual([]);
  expect(r.later.map(l => l.id)).toEqual(["B", "A"]);
});

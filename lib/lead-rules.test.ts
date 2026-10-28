import { test, expect } from "vitest";
import { schedule, classify, order, markSent, rulesAssessment, checkAgentResponse, resolveAssessment } from "./lead-rules";
import { makeLead, msg } from "./test-helpers";

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

const NOW = new Date("2026-10-28T06:00:00Z"); // 11:30 IST
test("markSent appends the draft as a rep message and moves the date", () => {
  const r = markSent(makeLead({ tag: "Hot", followUpDate: "2026-10-26", draft: "old" }), "  Sending the PI now.  ", NOW)!;
  expect(r.message).toMatchObject({ sender: "rep", text: "Sending the PI now.", leadId: "L001" });
  expect(r.lead).toMatchObject({ lastContactDate: "2026-10-28", followUpDate: "2026-10-29", draft: null });
  expect(classify(r.lead, "2026-10-28")).toBe("later");
});
test("markSent offsets Warm +3 and Cold +10", () => {
  expect(markSent(makeLead({ tag: "Warm" }), "x", NOW)!.lead.followUpDate).toBe("2026-10-31");
  expect(markSent(makeLead({ tag: "Cold" }), "x", NOW)!.lead.followUpDate).toBe("2026-11-07");
});
test("markSent refuses a blank draft", () => {
  expect(markSent(makeLead(), "   ", NOW)).toBeNull();
});
test("rules: buyer price question is Hot", () => {
  const chat = [msg("rep", "Sharing brochure"), msg("buyer", "Bhai rate kya hai 2 machines ka?")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28")).toMatchObject({ tag: "Hot", requestedDate: null });
});
test("rules: two unanswered rep messages is Cold even after a price question", () => {
  const chat = [msg("buyer", "Send quote"), msg("rep", "Sent"), msg("rep", "Any update?")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28").tag).toBe("Cold");
});
test("rules: buyer silent 14 days is Cold", () => {
  const chat = [msg("buyer", "Will check", "2026-10-14T05:00:00Z"), msg("rep", "Ok")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28").reason).toBe("Rules: buyer silent for 14 days");
});
test("rules: no chat goes by source and age", () => {
  expect(rulesAssessment(makeLead({ source: "Referral", lastContactDate: "2026-10-25" }), [], "2026-10-28").tag).toBe("Warm");
  expect(rulesAssessment(makeLead({ source: "IndiaMART", lastContactDate: "2026-10-18" }), [], "2026-10-28").tag).toBe("Cold");
  expect(rulesAssessment(makeLead({ source: "Referral", lastContactDate: "2026-10-01" }), [], "2026-10-28").tag).toBe("Cold");
});
test("rules reasons start with 'Rules: ' and the draft is signed by the rep", () => {
  const a = rulesAssessment(makeLead({ name: "Priya Nair", rep: "Amit Verma", productInterest: "carton sealer" }), [], "2026-10-28");
  expect(a.reason.startsWith("Rules: ")).toBe(true);
  expect(a.draft).toBe("Hi Priya, following up on the carton sealer we discussed. Is there a good time to talk this week?\n- Amit");
});
test("rules: buyer naming a date is Hot, requestedDate stays null", () => {
  for (const text of ["We decide by 5 Nov", "after 3rd November", "Nov 5 works", "meet on 05/11"]) {
    expect(rulesAssessment(makeLead(), [msg("buyer", text)], "2026-10-28"))
      .toMatchObject({ tag: "Hot", reason: "Rules: buyer gave a date", requestedDate: null });
  }
});
test("rules: price row wins over the date row", () => {
  const a = rulesAssessment(makeLead(), [msg("buyer", "price by 5 Nov?")], "2026-10-28");
  expect(a.reason).toBe("Rules: buyer asked about price, delivery or payment");
});
test("rules: a chat with no buyer message falls through to Warm", () => {
  const a = rulesAssessment(makeLead(), [msg("rep", "Hello")], "2026-10-28");
  expect(a).toMatchObject({ tag: "Warm", reason: "Rules: buyer engaged, no buying signal yet" });
});
test("checkAgentResponse accepts a valid answer", () => {
  expect(checkAgentResponse({ tag: "Hot", reason: "Asked for PI", requested_date: null, draft: "Hi" }))
    .toEqual({ tag: "Hot", reason: "Asked for PI", requestedDate: null, draft: "Hi" });
});
test("checkAgentResponse rejects bad tags, dates and missing fields", () => {
  expect(checkAgentResponse({ tag: "Hot!", reason: "r", requested_date: null, draft: "d" })).toBeNull();
  expect(checkAgentResponse({ tag: "Hot", reason: "r", requested_date: "next Monday", draft: "d" })).toBeNull();
  expect(checkAgentResponse({ tag: "Hot", reason: "r", requested_date: null })).toBeNull();
  expect(checkAgentResponse("not json")).toBeNull();
});
test("resolveAssessment schedules an agent result, clamping a past requested date", () => {
  const l = resolveAssessment(makeLead(), { tag: "Warm", reason: "r", requestedDate: "2026-10-01", draft: "d" }, null, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ followUpDate: "2026-10-28", assessedBy: "agent", agentUnavailable: false });
});
test("resolveAssessment keeps the previous result when the agent fails", () => {
  const prev = makeLead({ tag: "Hot", reason: "Asked for PI", draft: "d", followUpDate: "2026-10-28", lastContactDate: "2026-10-20" });
  const l = resolveAssessment({ ...prev, lastContactDate: "2026-10-28" }, null, prev, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ tag: "Hot", reason: "Asked for PI", lastContactDate: "2026-10-28", agentUnavailable: true });
});
test("resolveAssessment falls back to rules for a new lead when the agent fails", () => {
  const l = resolveAssessment(makeLead({ source: "Referral" }), null, null, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ assessedBy: "rules", agentUnavailable: true, tag: "Warm" });
  expect(l.followUpDate).toBe("2026-10-31");
});
test("resolveAssessment does not carry stale state from a full Lead passed as fields", () => {
  const stale = makeLead({ tag: "Cold", draft: "old", draftSentAt: "2026-10-27T05:00:00Z" });
  const agent = { tag: "Hot" as const, reason: "r", requestedDate: null, draft: "new" };
  expect(resolveAssessment(stale, agent, null, [], "2026-10-28", NOW))
    .toMatchObject({ tag: "Hot", draft: "new", draftSentAt: null });
  const rules = resolveAssessment(stale, null, null, [], "2026-10-28", NOW);
  expect(rules.draftSentAt).toBeNull();
  expect(rules.draft).not.toBe("old");
});

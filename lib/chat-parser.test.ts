import { test, expect } from "vitest";
import { parseChat } from "./chat-parser";

const text = [
  "[12/10/26, 10:14] Rep (Amit): Hi Priya, sharing the quote for the 2 carton sealers.",
  "[12/10/26, 11:02] Priya Nair: Thanks. Delivery Diwali se pehle ho jayegi?",
  "Aur payment terms bhi bata dena",
  "",
].join("\n");

test("joins continuation lines onto the previous message", () => {
  expect(parseChat("L001", text)[1].text).toBe("Thanks. Delivery Diwali se pehle ho jayegi?\nAur payment terms bhi bata dena");
});

test("throws on a malformed timestamped line", () => {
  expect(() => parseChat("L002", "[12-10-26 10:14] Amit: hi")).toThrow("Bad chat line 1 in L002");
});

test("throws when a continuation line comes before any message", () => {
  expect(() => parseChat("L003", "stray text\n[12/10/26, 10:14] Rep (Amit): hi")).toThrow("Bad chat line 1 in L003: stray text");
});

test("strips CRLF line endings", () => {
  const [a, b] = parseChat("L004", "[12/10/26, 10:14] Rep (Amit): hi\r\nmore\r\n[12/10/26, 11:00] Priya Nair: ok\r\n");
  expect(a.text).toBe("hi\nmore");
  expect(b.text).toBe("ok");
});

test("parses rep and buyer lines with IST timestamps", () => {
  const [a, b] = parseChat("L001", text);
  expect(a).toEqual({ leadId: "L001", sentAt: "2026-10-12T10:14:00+05:30", sender: "rep", senderName: "Amit", text: "Hi Priya, sharing the quote for the 2 carton sealers." });
  expect(b).toMatchObject({ sender: "buyer", senderName: "Priya Nair" });
});

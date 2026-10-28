import { MODEL } from "./constants";
import { checkAgentResponse } from "./lead-rules";
import { buildPrompt } from "./prompt";
import type { Assessment, LeadFields, Message } from "./types";

const TIMEOUT_MS = 20_000;
const RETRY_WAIT_MS = 2_000;
const URL = "https://api.groq.com/openai/v1/chat/completions";

// Strict mode needs every key required and additionalProperties false.
const responseSchema = {
  type: "object",
  properties: {
    tag: { type: "string", enum: ["Hot", "Warm", "Cold"] },
    reason: { type: "string" },
    requested_date: { type: ["string", "null"] },
    draft: { type: "string" },
  },
  required: ["tag", "reason", "requested_date", "draft"],
  additionalProperties: false,
};

/** Asks the model on Groq to assess one lead. Never throws: returns null and logs the reason on any failure. */
export async function assessWithAgent(
  lead: LeadFields,
  chat: Message[],
  today: string,
): Promise<Assessment | null> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("agent: GROQ_API_KEY is not set");
      return null;
    }
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(lead, chat, today) }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "assessment", strict: true, schema: responseSchema },
      },
      temperature: 0.3,
      reasoning_effort: "medium",
    });
    const call = () => fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let res = await call();
    // Rate limits and overloads are usually brief, so try once more.
    if (res.status === 429 || res.status >= 500) {
      console.error(`agent: retrying after ${res.status}`);
      await new Promise((r) => setTimeout(r, RETRY_WAIT_MS));
      res = await call();
    }
    if (!res.ok) {
      console.error(`agent: call failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const json = await res.json();
    const text: unknown = json?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text) {
      console.error("agent: empty response from model");
      return null;
    }
    const checked = checkAgentResponse(JSON.parse(text));
    if (!checked) {
      console.error("agent: response failed the answer check");
      return null;
    }
    return checked;
  } catch (err) {
    console.error("agent: call failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

import { GoogleGenAI } from "@google/genai";
import { MODEL } from "./constants";
import { checkAgentResponse } from "./lead-rules";
import { buildPrompt } from "./prompt";
import type { Assessment, LeadFields, Message } from "./types";

const TIMEOUT_MS = 20_000;

const responseSchema = {
  type: "object",
  properties: {
    tag: { type: "string", enum: ["Hot", "Warm", "Cold"] },
    reason: { type: "string" },
    requested_date: { type: ["string", "null"] },
    draft: { type: "string" },
  },
  required: ["tag", "reason", "requested_date", "draft"],
};

/** Asks Gemini to assess one lead. Never throws: returns null and logs the reason on any failure. */
export async function assessWithAgent(
  lead: LeadFields,
  chat: Message[],
  today: string,
): Promise<Assessment | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("agent: GEMINI_API_KEY is not set");
      return null;
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(lead, chat, today),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        temperature: 0.3,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const text = response.text;
    if (!text) {
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

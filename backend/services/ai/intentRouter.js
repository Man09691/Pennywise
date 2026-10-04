// services/ai/intentRouter.js
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

export const INTENT = Object.freeze({ GENERAL: "GENERAL", PENNYWISE: "PENNYWISE" });

const SYSTEM_PROMPT = `You sort chat messages for a personal expense tracker app called Pennywise.
Answer PENNYWISE if the message asks about the user's OWN money data in the app: their spending, income, balance, transactions, categories or budgets.
Answer GENERAL for everything else, including general knowledge, coding, explanations and general money advice.

Examples:
"How much did I pay for rent last month?" -> PENNYWISE
"List my latest expenses" -> PENNYWISE
"Am I close to my shopping limit?" -> PENNYWISE
"Who wrote Hamlet?" -> GENERAL
"What does inflation mean?" -> GENERAL
"Write a function that reverses a string" -> GENERAL`;

// The model may only answer with one of these two words.
const INTENT_SCHEMA = {
  type: "object",
  properties: { intent: { type: "string", enum: [INTENT.GENERAL, INTENT.PENNYWISE] } },
  required: ["intent"],
};

export async function decideIntent(message, { timeoutMs = 30000 } = {}) {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Classify this message: ${JSON.stringify(message)}` },
        ],
        stream: false,
        format: INTENT_SCHEMA,
        options: { temperature: 0, num_predict: 40 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

    const data = await res.json();
    const intent = JSON.parse(data.message?.content ?? "{}").intent;
    if (intent === INTENT.GENERAL || intent === INTENT.PENNYWISE) {
      return { intent, fallback: false };
    }
    throw new Error("Unexpected router output");
  } catch (err) {
    // Safe default: let the tools path run. Its guards (classifier, validator) still apply.
    return { intent: INTENT.PENNYWISE, fallback: true, error: err.message };
  }
}
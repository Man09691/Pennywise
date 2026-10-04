// test/intentRouter.check.js
import { decideIntent } from "../services/ai/intentRouter.js";

const REQUIRED = [
  ["What is the capital of France?", "GENERAL"],
  ["What is Newton's first law?", "GENERAL"],
  ["Explain machine learning", "GENERAL"],
  ["How much did I spend this month?", "PENNYWISE"],
  ["Where did I spend the most?", "PENNYWISE"],
  ["Show my transactions", "PENNYWISE"],
  ["What categories do I have?", "PENNYWISE"],
  ["Am I over my budget?", "PENNYWISE"],
];

// Harder cases. Informational: they show where the router is weak.
const TRICKY = [
  ["What does compound interest mean?", "GENERAL"],
  ["How can I save more money?", "GENERAL"],
  ["Write a Python program to sort an array", "GENERAL"],
  ["Am I spending too much?", "PENNYWISE"],
  ["How much have I spent on food?", "PENNYWISE"],
  ["What did I buy recently?", "PENNYWISE"],
];

async function run(title, cases) {
  console.log(`\n=== ${title} ===`);
  let passed = 0;
  for (const [question, expected] of cases) {
    const t0 = Date.now();
    const r = await decideIntent(question);
    const ok = r.intent === expected && !r.fallback;
    if (ok) passed++;
    const note = r.fallback ? `  [FALLBACK: ${r.error}]` : "";
    console.log(`${ok ? "PASS" : "FAIL"}  got ${r.intent.padEnd(9)} want ${expected.padEnd(9)} ${String(Date.now() - t0).padStart(5)}ms  ${question}${note}`);
  }
  console.log(`${passed}/${cases.length} passed`);
  return passed === cases.length;
}

const requiredOk = await run("REQUIRED", REQUIRED);
await run("TRICKY (informational)", TRICKY);
process.exit(requiredOk ? 0 : 1);
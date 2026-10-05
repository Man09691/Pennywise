import { runAgent } from "../services/ai/agent.js";

const result = await runAgent(
    "What is my total income, total expenses, balance, and expenses by category for October 2026?"
);

console.log("\n==============================");
console.log("FINAL ANSWER");
console.log("==============================");

console.log(result.answer);

console.log("\nTOOLS USED");
console.log("==============================");

console.log(result.toolsUsed);
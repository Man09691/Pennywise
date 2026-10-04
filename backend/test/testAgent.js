import { runAgent } from "../services/ai/agent.js";

const result = await runAgent(
    "what is the capital of the india?"
);

console.log("\n==============================");
console.log("FINAL ANSWER");
console.log("==============================");

console.log(result.answer);

console.log("\nTOOLS USED");
console.log("==============================");

console.log(result.toolsUsed);
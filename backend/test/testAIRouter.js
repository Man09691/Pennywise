import { detectPennywiseTool } from "../services/ai/aiRouter.js";

const questions = [
    "How much did I spend this month?",
    "Where did I spend the most?",
    "Show my transactions",
    "What categories do I have?",
    "Am I over my budget?",
    "What is Newton's first law?",
    "Explain machine learning",
];

for (const question of questions) {
    const result = detectPennywiseTool(question);

    console.log("\nQuestion:", question);
    console.log("Decision:", result);
}
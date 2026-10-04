import { decideTool } from "../services/ai/aiService.js";

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
    console.log("\n====================================");
    console.log("Question:", question);

    try {
        const decision = await decideTool(question);

        console.log("AI Decision:");
        console.log(JSON.stringify(decision, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}
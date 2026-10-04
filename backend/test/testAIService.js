import { initializeAI } from "../services/ai/aiService.js";

try {
    await initializeAI();
} catch (error) {
    console.error("AI initialization failed:");
    console.error(error);
}
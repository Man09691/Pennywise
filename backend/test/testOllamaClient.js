import { askOllama } from "../services/llm/ollamaClient.js";

try {
    const answer = await askOllama(
        "Explain what a personal expense tracker is in one simple sentence."
    );

    console.log("\nOllama answer:\n");
    console.log(answer);
} catch (error) {
    console.error("Ollama test failed:");
    console.error(error);
}
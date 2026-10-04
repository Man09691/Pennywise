import { chat } from "../services/llm/ollamaClient.js";

const tools = [
    {
        type: "function",
        function: {
            name: "get_monthly_summary",
            description:
                "Get the user's income, expenses, and balance for a month.",
            parameters: {
                type: "object",
                properties: {
                    month: {
                        type: "string",
                        description:
                            "Month in YYYY-MM format, for example 2026-10.",
                    },
                },
                required: ["month"],
            },
        },
    },
];

const messages = [
    {
        role: "user",
        content: "How much did I spend this month?",
    },
];

try {
    const result = await chat({
        messages,
        tools,
        temperature: 0,
    });

    console.log("\nOllama native tool-calling result:\n");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error("Test failed:");
    console.error(error);
}
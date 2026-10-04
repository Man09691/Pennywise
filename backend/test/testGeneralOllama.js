import { chat } from "../services/llm/ollamaClient.js";
import {
    connectMcp,
    listMcpTools,
} from "../services/mcp/mcpClient.js";
import {
    convertMcpToolsToOllama,
} from "../services/ai/toolAdapter.js";

await connectMcp();

const mcpTools = await listMcpTools();
const ollamaTools = convertMcpToolsToOllama(mcpTools);

const response = await chat({
    messages: [
        {
            role: "system",
            content: `
You are Pennywise AI.

Answer the user's question directly and normally.
Do not output JSON.
Do not invent tools.
            `,
        },
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
    temperature: 0,
});

console.log("\nRAW OLLAMA RESPONSE:");
console.log(JSON.stringify(response, null, 2));
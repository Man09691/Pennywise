import { askOllama } from "../services/llm/ollamaClient.js";
import {
    connectMcp,
    listMcpTools,
} from "../services/mcp/mcpClient.js";
import {
    convertMcpToolsToOllama,
} from "../services/ai/toolAdapter.js";

await connectMcp();

const mcpTools = await listMcpTools();

const ollamaTools =
    convertMcpToolsToOllama(mcpTools);

const response = await askOllama({
    messages: [
        {
            role: "user",
            content: "How much did I spend this month?",
        },
    ],
    tools: ollamaTools,
    temperature: 0,
});

console.log("\nOllama response:");
console.log(
    JSON.stringify(response, null, 2)
);
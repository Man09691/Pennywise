import {
    connectMcp,
    listMcpTools,
} from "../services/mcp/mcpClient.js";

import {
    convertMcpToolsToOllama,
} from "../services/ai/toolAdapter.js";

await connectMcp();

const mcpTools = await listMcpTools();

console.log("\nMCP tools:");
console.log(
    JSON.stringify(mcpTools, null, 2)
);

const ollamaTools =
    convertMcpToolsToOllama(mcpTools);

console.log("\nOllama tools:");
console.log(
    JSON.stringify(ollamaTools, null, 2)
);
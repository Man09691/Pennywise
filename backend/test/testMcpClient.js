import {
    connectMcp,
    listMcpTools,
    callMcpTool,
} from "../services/mcp/mcpClient.js";

try {
    await connectMcp();

    console.log("\nAvailable MCP tools:");

    const tools = await listMcpTools();

    for (const tool of tools) {
        console.log("-", tool.name);
    }

    console.log("\nCalling get_spending_by_category...\n");

    const result = await callMcpTool(
        "get_spending_by_category",
        {
            month: "2026-10",
        }
    );

    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error("MCP test failed:");
    console.error(error);
}
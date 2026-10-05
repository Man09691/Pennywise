import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MCP_SERVER_PATH = "Q:\\Pennywise\\mcp-server\\src\\index.js";

let client = null;
let transport = null;

/**
 * Connect the Pennywise backend to our MCP server.
 */
export async function connectMcp() {
    if (client) {
        return client;
    }

    transport = new StdioClientTransport({
        command: "node",
        args: [MCP_SERVER_PATH],
        cwd: "Q:\\Pennywise\\mcp-server",
    });

    client = new Client({
        name: "pennywise-backend",
        version: "1.0.0",
    });

    await client.connect(transport);

    console.log("MCP client connected to Pennywise MCP server");

    return client;
}

/**
 * Get the tools currently exposed by the MCP server.
 */
export async function listMcpTools() {
    const mcp = await connectMcp();

    const result = await mcp.listTools();

    return result.tools;
}

/**
 * Call one MCP tool.
 */
export async function callMcpTool(
    name,
    arguments_ = {},
    context = {}
) {
    const mcp = await connectMcp();

    return await mcp.callTool({
        name,
        arguments: arguments_,
        _meta: {
            userId: context.userId,
            token: context.token,
        },
    });
}
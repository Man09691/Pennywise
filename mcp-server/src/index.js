import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerTools } from "./tools.js";

function createServer() {
    const server = new McpServer({
        name: "pennywise",
        version: "0.1.0",
    });

    registerTools(server);
    return server;
}

void serveStdio(createServer);
console.error("Pennywise MCP server running on stdio");

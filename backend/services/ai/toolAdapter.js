export function convertMcpToolsToOllama(mcpTools) {
    return mcpTools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.inputSchema || {
                type: "object",
                properties: {},
            },
        },
    }));
}
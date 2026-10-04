import Ajv2020 from "ajv/dist/2020.js";


/**
 * Validate an Ollama native tool call against
 * the tools exposed by our MCP server.
 */
export function validateToolCall(toolCall, mcpTools) {

    /*
     * ---------------------------------------------
     * 1. Basic tool-call structure
     * ---------------------------------------------
     */
    if (!toolCall || typeof toolCall !== "object") {
        return {
            valid: false,
            error: "Invalid tool call."
        };
    }


    const functionData = toolCall.function;

    if (
        !functionData ||
        typeof functionData !== "object"
    ) {
        return {
            valid: false,
            error: "Tool call is missing function information."
        };
    }


    const toolName = functionData.name;


    /*
     * ---------------------------------------------
     * 2. Check whether the requested tool exists
     * in our MCP server.
     * ---------------------------------------------
     */
    const mcpTool = mcpTools.find(
        (tool) => tool.name === toolName
    );


    if (!mcpTool) {
        return {
            valid: false,
            error: `Unknown Pennywise tool: ${toolName}`
        };
    }


    /*
     * ---------------------------------------------
     * 3. Get the arguments.
     *
     * Ollama normally gives us an object, but we
     * also protect against malformed responses.
     * ---------------------------------------------
     */
    let arguments_ =
        functionData.arguments ?? {};


    if (
        typeof arguments_ !== "object" ||
        Array.isArray(arguments_) ||
        arguments_ === null
    ) {
        return {
            valid: false,
            error: `Invalid arguments for tool: ${toolName}`
        };
    }


    /*
     * ---------------------------------------------
     * 4. Validate the arguments against the JSON
     * schema supplied by MCP.
     * ---------------------------------------------
     */
    const ajv = new Ajv2020({
        allErrors: true,
        strict: false,
        coerceTypes: true,
    });


    const schema = mcpTool.inputSchema || {
        type: "object",
        properties: {},
    };


    const validate = ajv.compile(schema);

    const valid = validate(arguments_);


    if (!valid) {
        return {
            valid: false,
            error: `Invalid arguments for tool: ${toolName}`,
            details: validate.errors,
        };
    }


    /*
     * ---------------------------------------------
     * 5. Everything is valid.
     * ---------------------------------------------
     */
    return {
        valid: true,
        toolName,
        arguments: arguments_,
    };
}
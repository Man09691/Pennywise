import { validateToolCall } from "../services/ai/validator.js";


/*
 * These represent the tools currently exposed
 * by our Pennywise MCP server.
 */
const mcpTools = [
    {
        name: "get_monthly_summary",
        inputSchema: {
            type: "object",
            properties: {
                month: {
                    type: "string",
                },
            },
            required: ["month"],
        },
    },

    {
        name: "get_transactions",
        inputSchema: {
            type: "object",
            properties: {
                from: {
                    type: "string",
                },
                to: {
                    type: "string",
                },
                category: {
                    type: "string",
                },
                type: {
                    type: "string",
                    enum: ["income", "expense"],
                },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: 100,
                },
            },
        },
    },
];


/*
 * --------------------------------------------------
 * TEST 1
 * Valid monthly summary tool call
 * --------------------------------------------------
 */

console.log(
    "\n========== TEST 1: VALID TOOL CALL =========="
);

const test1 = {
    function: {
        name: "get_monthly_summary",

        arguments: {
            month: "2026-10",
        },
    },
};

console.log(
    validateToolCall(test1, mcpTools)
);


/*
 * --------------------------------------------------
 * TEST 2
 * Unknown tool
 * --------------------------------------------------
 */

console.log(
    "\n========== TEST 2: UNKNOWN TOOL =========="
);

const test2 = {
    function: {
        name: "wikipedia",

        arguments: {},
    },
};

console.log(
    validateToolCall(test2, mcpTools)
);


/*
 * --------------------------------------------------
 * TEST 3
 * Invalid argument type
 * --------------------------------------------------
 */

console.log(
    "\n========== TEST 3: INVALID ARGUMENT =========="
);

const test3 = {
    function: {
        name: "get_monthly_summary",

        arguments: {
            month: 123,
        },
    },
};

console.log(
    validateToolCall(test3, mcpTools)
);


/*
 * --------------------------------------------------
 * TEST 4
 * Valid transactions tool call
 * --------------------------------------------------
 */

console.log(
    "\n========== TEST 4: VALID TRANSACTIONS CALL =========="
);

const test4 = {
    function: {
        name: "get_transactions",

        arguments: {
            type: "expense",
            limit: 10,
        },
    },
};

console.log(
    validateToolCall(test4, mcpTools)
);
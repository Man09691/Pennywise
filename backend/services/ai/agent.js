import { chat } from "../llm/ollamaClient.js";

import {
    connectMcp,
    listMcpTools,
    callMcpTool,
} from "../mcp/mcpClient.js";

import {
    convertMcpToolsToOllama,
} from "./toolAdapter.js";

import {
    classifyReply,
} from "./replyClassifier.js";

import {
    validateToolCall,
} from "./validator.js";

import {
    decideIntent,
    INTENT,
} from "./intentRouter.js";


export async function runAgent(userMessage) {

    console.log("\nInitializing Pennywise AI agent...");

    const intentResult = await decideIntent(userMessage);

    console.log(
        `Intent Router: ${intentResult.intent}${intentResult.fallback ? " (fallback)" : ""
        }`
    );

    const isPennywise =
        intentResult.intent === INTENT.PENNYWISE;
    let mcpTools = [];
    let ollamaTools = undefined;

    if (isPennywise) {

        /*
         * --------------------------------------------------
         * Connect to MCP only for Pennywise questions
         * --------------------------------------------------
         */
        await connectMcp();

        /*
         * --------------------------------------------------
         * Get the tools currently exposed by MCP
         * --------------------------------------------------
         */
        mcpTools =
            await listMcpTools();

        /*
         * --------------------------------------------------
         * Convert MCP tools into Ollama tool format
         * --------------------------------------------------
         */
        ollamaTools =
            convertMcpToolsToOllama(mcpTools);
    }

    /*
     * --------------------------------------------------
     * 4. Current date and month
     * --------------------------------------------------
     */
    const currentDate =
        new Date().toISOString().slice(0, 10);

    const currentMonth =
        currentDate.slice(0, 7);


    /*
     * --------------------------------------------------
     * 5. Conversation messages
     * --------------------------------------------------
     */
    const messages = [

        {
            role: "system",

            content: `
You are Pennywise AI, a helpful personal expense assistant.

Today is ${currentDate}.
The current month is ${currentMonth}.

Users can ask general questions or questions about their Pennywise financial data.

For Pennywise financial questions:
- Use the appropriate Pennywise tool.
- Never guess or invent financial numbers, categories, transactions, income sources, or other financial data.
- If the user does not specify a month, use the current month.
- Clearly say when you are referring to the current month.
- Use get_monthly_summary for total income, total expense, and balance.
- Use get_spending_by_category for expense totals grouped by category.
- If the user asks for both monthly totals and an expense-category breakdown, use both tools.
- Only report financial information that was returned by Pennywise tools.
- If a requested type of financial breakdown is not available from the tools, clearly say that the available data does not provide that breakdown.
- For get_transactions, the limit must never exceed 100.
- Do not invent a transaction limit of 1000 or any other value above the tool's allowed limit.
- When get_monthly_summary returns totalIncome, totalExpense, and balance, use the returned balance exactly as the net profit/loss figure.
- Never calculate, recalculate, estimate, or modify the balance yourself.
- Never perform arithmetic on financial values when the Pennywise tool already provides the calculated result.
- CRITICAL balance rule — the balance is already (totalIncome - totalExpense). Do NOT subtract totalExpense from balance again.
  WRONG (never do this): balance(725004) - totalExpense(59995) = 665009
  CORRECT: Net profit = balance = 725004 (use the number directly, do not modify it)

For general questions:
- Answer normally using your own knowledge.
- Do not use Pennywise tools.
- Do not invent tools, APIs, functions, JSON tool requests, or external tool calls.
- Only use a tool when you return a native tool call for one of the provided Pennywise tools.

When deciding whether another Pennywise tool is needed:
- If more information is required, make another native tool call.
- Never write a tool call, tool name, parameters, or JSON representation of a tool call as normal text.
- Never say that you "need to use" a tool. Actually call the tool using the native tool-calling mechanism.
- If the user asks for a detailed expense breakdown, use get_spending_by_category in addition to get_monthly_summary.
- If multiple Pennywise tools are needed, call them before giving the final answer.

After all required tools have returned:
- Answer the user in plain language.
- Use only information returned by the tools.
- Use ₹ for money.
- Do not show raw JSON.
- Do not mention internal MCP implementation unless the user asks.
- Never invent financial numbers, categories, income sources, transactions, or other financial data.
- If the available tools do not provide a requested breakdown, clearly say that the breakdown is not available.
            `,
        },

        {
            role: "user",
            content: userMessage,
        },

    ];


    /*
     * --------------------------------------------------
     * 6. Keep track of tools used
     * --------------------------------------------------
     */
    const toolsUsed = [];

    /*
     * Cache MCP results so the same tool with the same
     * arguments is not executed more than once.
     */
    const toolResultCache = new Map();


    /*
     * --------------------------------------------------
     * 7. Maximum number of AI/tool steps
     *
     * Prevents infinite tool-calling loops.
     * --------------------------------------------------
     */
    for (let step = 0; step < 6; step++) {

        console.log(
            `\nAI step ${step + 1}`
        );


        /*
         * --------------------------------------------------
         * Ask Ollama
         * --------------------------------------------------
         */
        const response = await chat({
            messages,
            tools: ollamaTools,
            temperature: 0,
        });


        console.log(
            "Ollama response:",
            JSON.stringify(response, null, 2)
        );


        /*
         * Add Ollama's response to the conversation.
         */
        messages.push(response);


        /*
         * --------------------------------------------------
         * Classify the Ollama response
         * --------------------------------------------------
         */
        const reply =
            classifyReply(response);


        console.log(
            "Reply classification:",
            reply.type
        );


        /*
         * --------------------------------------------------
         * CASE 1
         *
         * Normal answer.
         *
         * Example:
         * "The capital of France is Paris."
         * --------------------------------------------------
         */
        if (reply.type === "NORMAL_ANSWER") {

            /*
             * --------------------------------------------------
             * Grounding guard: category breakdown required?
             *
             * If the user's message contains keywords that
             * indicate they want an expense-category breakdown,
             * and get_spending_by_category has NOT yet been
             * executed, do NOT accept this answer.
             *
             * Instead, push a reminder into the conversation
             * so that Ollama is forced to make the real native
             * tool call before giving a final answer.
             *
             * This prevents Ollama from hallucinating category
             * data (e.g. "Entertainment ₹2000") when the only
             * tool that was actually called was get_monthly_summary.
             * --------------------------------------------------
             */
            const categoryKeywords = [
                "categor",      // category / categories
                "breakdown",
                "spending by",
                "by category",
                "expense detail",
                "expense break",
            ];

            const userWantsCategoryBreakdown =
                isPennywise &&
                categoryKeywords.some((kw) =>
                    userMessage.toLowerCase().includes(kw)
                );

            const categoryToolExecuted =
                toolsUsed.includes("get_spending_by_category");

            if (userWantsCategoryBreakdown && !categoryToolExecuted) {

                console.log(
                    "\nGrounding guard: user requested category breakdown " +
                    "but get_spending_by_category has not been called yet. " +
                    "Continuing tool-calling loop."
                );

                /*
                 * Remove the premature "I will call..." assistant
                 * message that was just pushed to `messages`.
                 *
                 * Leaving it in context anchors Ollama into more
                 * text-only replies instead of a native tool call.
                 * Removing it means the next Ollama turn sees:
                 *   assistant: get_monthly_summary result
                 *   tool:      grounding reminder
                 * ...which reliably produces a native tool call.
                 */
                messages.pop();

                /*
                 * Push a system reminder so Ollama understands
                 * it still needs to call get_spending_by_category
                 * using a native tool call before answering.
                 */
                messages.push({
                    role: "tool",
                    tool_name: "pennywise_agent",
                    content: JSON.stringify({
                        reminder:
                            "The user requested an expense-category breakdown. " +
                            "You have not yet called get_spending_by_category. " +
                            "You MUST make a native get_spending_by_category tool call " +
                            "before providing your final answer. " +
                            "Do NOT invent or guess any category names or amounts.",
                    }),
                });

                /*
                 * Continue the loop — do NOT return yet.
                 */
                continue;
            }

            return {
                answer: reply.content,
                toolsUsed,
            };

        }


        /*
         * --------------------------------------------------
         * CASE 2
         *
         * Fake tool JSON.
         *
         * Example:
         *
         * {
         *   "name": "wikipedia",
         *   "parameters": {}
         * }
         *
         * This is NOT a native tool call.
         * --------------------------------------------------
         */
        if (reply.type === "FAKE_TOOL_JSON") {

            throw new Error(
                "Ollama returned a fake tool request instead of a native tool call."
            );

        }


        /*
         * --------------------------------------------------
         * CASE 3
         *
         * Invalid Ollama response.
         * --------------------------------------------------
         */
        if (reply.type === "INVALID_RESPONSE") {

            throw new Error(
                reply.reason
            );

        }


        /*
         * --------------------------------------------------
         * CASE 4
         *
         * We expect a real native tool call here.
         * --------------------------------------------------
         */
        if (reply.type !== "NATIVE_TOOL_CALL") {

            throw new Error(
                `Unknown Ollama reply type: ${reply.type}`
            );

        }


        /*
         * --------------------------------------------------
         * 8. Process every native tool call
         * --------------------------------------------------
         */
        for (const toolCall of reply.toolCalls) {


            /*
             * --------------------------------------------------
             * Validate the tool call BEFORE MCP execution.
             * --------------------------------------------------
             */
            const validation =
                validateToolCall(
                    toolCall,
                    mcpTools
                );


            /*
             * --------------------------------------------------
             * Invalid tool call
             *
             * DO NOT call MCP.
             * Send the error back to Ollama.
             * --------------------------------------------------
             */
            if (!validation.valid) {

                console.log(
                    "\nTool validation failed:"
                );

                console.log(
                    validation.error
                );


                messages.push({

                    role: "tool",

                    tool_name:
                        toolCall.function?.name ||
                        "unknown",

                    content: JSON.stringify({

                        success: false,

                        error:
                            validation.error,

                        details:
                            validation.details || [],

                    }),

                });


                /*
                 * Continue to the next AI step.
                 *
                 * Ollama will receive the validation
                 * error and can try again.
                 */
                continue;
            }


            /*
             * --------------------------------------------------
             * Valid tool call
             * --------------------------------------------------
             */
            const toolName =
                validation.toolName;


            const arguments_ =
                validation.arguments;


            console.log(
                "\nCalling MCP tool:"
            );

            console.log(
                toolName
            );


            console.log(
                "Arguments:",
                JSON.stringify(
                    arguments_,
                    null,
                    2
                )
            );


            /*
             * --------------------------------------------------
             * Execute the validated MCP tool
             * --------------------------------------------------
             */
            /*
 * --------------------------------------------------
 * Create a unique key for this tool call.
 *
 * The same tool with the same arguments will produce
 * the same key.
 * --------------------------------------------------
 */
            const toolCallKey =
                `${toolName}:${JSON.stringify(arguments_)}`;


            /*
             * --------------------------------------------------
             * Check whether this exact tool call was already
             * executed.
             * --------------------------------------------------
             */
            let result;

            if (toolResultCache.has(toolCallKey)) {

                console.log(
                    "\nUsing cached MCP result:"
                );

                console.log(
                    toolName
                );

                result =
                    toolResultCache.get(toolCallKey);

            } else {

                /*
                 * --------------------------------------------------
                 * Execute the validated MCP tool.
                 * --------------------------------------------------
                 */
                result =
                    await callMcpTool(
                        toolName,
                        arguments_
                    );

                /*
                 * Store the result so an identical future
                 * request does not call MCP again.
                 */
                toolResultCache.set(
                    toolCallKey,
                    result
                );

                /*
                 * Record the tool only when it was actually
                 * executed.
                 */
                toolsUsed.push(
                    toolName
                );
            }


            /*
             * --------------------------------------------------
             * Give the MCP result back to Ollama.
             * --------------------------------------------------
             */
            messages.push({

                role: "tool",

                tool_name:
                    toolName,

                content:
                    JSON.stringify(result),

            });

        }

    }


    /*
     * --------------------------------------------------
     * Maximum step limit reached.
     * --------------------------------------------------
     */
    throw new Error(
        "Pennywise AI exceeded the maximum number of tool steps."
    );
}

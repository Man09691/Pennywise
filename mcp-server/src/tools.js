import * as z from "zod/v4";
import {
    getTransactions,
    getMonthlySummary,
    getSpendingByCategory,
    getCategories,
    getBudgetStatus,
} from "./pennywiseApi.js";

function result(data) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}

function errorResult(error) {
    return {
        isError: true,
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                }, null, 2),
            },
        ],
    };
}

export function registerTools(server) {
    server.registerTool(
        "get_transactions",
        {
            description:
                "Read the logged-in Pennywise user's transactions. Optional filters can limit the date range, category, transaction type, and number of results.",
            inputSchema: z.object({
                from: z.string().optional().describe("Start date, YYYY-MM-DD"),
                to: z.string().optional().describe("End date, YYYY-MM-DD"),
                category: z.string().optional().describe("Category ID or category name"),
                type: z.enum(["income", "expense"]).optional(),
                limit: z.number().int().min(1).max(100).optional(),
            }),
        },
        async (args) => {
            try {
                return result(await getTransactions(args));
            } catch (error) {
                return errorResult(error);
            }
        }
    );

    server.registerTool(
        "get_monthly_summary",
        {
            description:
                "Get the logged-in user's income, expense, and balance summary for a month.",
            inputSchema: z.object({
                month: z.string().describe("Month in YYYY-MM format, for example 2026-09"),
            }),
        },
        async ({ month }) => {
            try {
                return result(await getMonthlySummary(month));
            } catch (error) {
                return errorResult(error);
            }
        }
    );

    server.registerTool(
        "get_spending_by_category",
        {
            description:
                "Get the logged-in user's expense totals grouped by category for a month.",
            inputSchema: z.object({
                month: z.string().describe("Month in YYYY-MM format, for example 2026-09"),
            }),
        },
        async ({ month }) => {
            try {
                return result(await getSpendingByCategory(month));
            } catch (error) {
                return errorResult(error);
            }
        }
    );

    server.registerTool(
        "get_categories",
        {
            description:
                "Get the logged-in user's available Pennywise categories, including default categories.",
            inputSchema: z.object({}),
        },
        async () => {
            try {
                return result(await getCategories());
            } catch (error) {
                return errorResult(error);
            }
        }
    );

    server.registerTool(
        "get_budget_status",
        {
            description:
                "Get the logged-in user's budget status for a month, including budget amount, spent, remaining, percentage, and exceeded status.",
            inputSchema: z.object({
                month: z.string().describe("Month in YYYY-MM format, for example 2026-09"),
            }),
        },
        async ({ month }) => {
            try {
                return result(await getBudgetStatus(month));
            } catch (error) {
                return errorResult(error);
            }
        }
    );
}

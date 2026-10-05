import "dotenv/config";


const API_URL = (process.env.PENNYWISE_API_URL || "http://localhost:5000").replace(/\/$/, "");


async function request(path, token, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: token,
            ...(options.headers || {}),
        },
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = { success: false, message: `HTTP ${response.status}` };
    }

    if (!response.ok || data?.success === false) {
        throw new Error(data?.message || `Pennywise API returned HTTP ${response.status}`);
    }

    return data;
}

function queryString(params) {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            search.set(key, String(value));
        }
    }

    const text = search.toString();
    return text ? `?${text}` : "";
}

function parseMonth(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        throw new Error("month must use YYYY-MM format, for example 2026-09");
    }

    const [year, monthNumber] = month.split("-").map(Number);
    return { year, month: monthNumber };
}

export async function getTransactions({ from, to, category, type, limit }, token) {
    let categoryId = category;

    // The Express transaction endpoint filters category by ID.
    // Allow the MCP tool to accept a friendly category name too.
    if (category && !/^[a-f\d]{24}$/i.test(category)) {
        const categoryData = await request("/api/categories", token);
        const found = (categoryData.categories || []).find(
            (item) => item.name?.toLowerCase() === category.toLowerCase()
        );

        if (!found) {
            return {
                success: true,
                transactions: [],
                note: `No category named "${category}" was found.`,
            };
        }

        categoryId = found._id;
    }

    return request(
        `/api/transactions${queryString({
            from,
            to,
            category: categoryId,
            type,
            limit,
        })}`,
        token
    );
}

export async function getMonthlySummary(month, token) {
    const { year, month: monthNumber } = parseMonth(month);

    return request(
        `/api/dashboard/monthly${queryString({
            month: monthNumber,
            year,
        })}`,
        token
    );
}

export async function getSpendingByCategory(month,token) {
    const { year, month: monthNumber } = parseMonth(month);

    return request(
        `/api/dashboard/categories${queryString({
            month: monthNumber,
            year,
        })}`,token
    );
}

export async function getCategories(token) {
    return request("/api/categories", token);
}

export async function getBudgetStatus(month, token) {
    const { year, month: monthNumber } = parseMonth(month);

    return request(
        `/api/budgets/summary${queryString({
            month: monthNumber,
            year,
        })}`,
        token
    );
}

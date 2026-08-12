const API_URL = "http://localhost:5000/api";

export async function getDashboardSummary(token) {
    const response = await fetch(`${API_URL}/dashboard/summary`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch dashboard summary");
    }

    return data;
}
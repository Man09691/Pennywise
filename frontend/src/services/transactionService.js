const API_URL = "http://localhost:5000/api";

export async function getTransactions(token) {
    const response = await fetch(`${API_URL}/transactions`,{
        method: "GET",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to fetch transactions"
        );
    }
    return data;    
}
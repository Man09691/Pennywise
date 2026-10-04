const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2:3b";

export async function chat({
    messages,
    tools = undefined,
    temperature = 0,
}) {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            tools,
            stream: false,
            options: {
                temperature,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Ollama request failed: ${response.status}`
        );
    }

    const data = await response.json();

    return data.message;
}
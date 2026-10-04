import { classifyReply } from "../services/ai/replyClassifier.js";

console.log("\n========== TEST 1: NATIVE TOOL CALL ==========");

const nativeToolResponse = {
    role: "assistant",
    content: "",
    tool_calls: [
        {
            id: "call_123",
            function: {
                name: "get_monthly_summary",
                arguments: {
                    month: "2026-10",
                },
            },
        },
    ],
};

console.log(
    classifyReply(nativeToolResponse)
);


console.log("\n========== TEST 2: NORMAL ANSWER ==========");

const normalAnswer = {
    role: "assistant",
    content: "The capital of France is Paris.",
};

console.log(
    classifyReply(normalAnswer)
);


console.log("\n========== TEST 3: FAKE TOOL JSON ==========");

const fakeToolJson = {
    role: "assistant",
    content: JSON.stringify({
        name: "wikipedia",
        parameters: {},
    }),
};

console.log(
    classifyReply(fakeToolJson)
);


console.log("\n========== TEST 4: INVALID RESPONSE ==========");

const invalidResponse = {
    role: "assistant",
    content: "",
};

console.log(
    classifyReply(invalidResponse)
);
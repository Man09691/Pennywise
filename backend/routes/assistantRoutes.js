import express from "express";
import { generateText } from "../services/llm/ollamaProvider.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const prompt = `
You are the Pennywise personal finance assistant.

Answer the user's question clearly and simply.
Do not invent transaction data, balances, budgets, or financial facts.
If you do not have the required data, say that you need to access the user's Pennywise data.

User question:
${message.trim()}
        `;

        const answer = await generateText(prompt);

        return res.json({
            success: true,
            answer,
        });
    } catch (error) {
        console.error("Assistant error:", error);

        return res.status(500).json({
            success: false,
            message: "AI assistant failed",
        });
    }
});

export default router;
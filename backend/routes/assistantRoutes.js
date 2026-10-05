import express from "express";
import { runAgent } from "../services/ai/agent.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const result = await runAgent(message.trim(), {
            userId: req.userId,
            token: req.headers.authorization,
        });

        return res.json({
            success: true,
            answer: result.answer,
            toolsUsed: result.toolsUsed,
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
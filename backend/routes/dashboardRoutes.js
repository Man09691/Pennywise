import express from "express";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.userId,
            isDeleted: false,
        });

        let totalIncome = 0;
        let totalExpense = 0;

        for (const transaction of transactions) {
            if (transaction.type === "income") {
                totalIncome += transaction.amount;
            }

            if (transaction.type === "expense") {
                totalExpense += transaction.amount;
            }
        }

        const balance = totalIncome - totalExpense;

        res.status(200).json({
            success: true,
            summary: {
                totalIncome,
                totalExpense,
                balance,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
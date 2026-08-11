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

router.get("/monthly", protect, async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and year are required",
            });
        }

        const monthNumber = Number(month);
        const yearNumber = Number(year);

        if (
            monthNumber < 1 ||
            monthNumber > 12 ||
            yearNumber < 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid month or year",
            });
        }

        const startDate = new Date(
            Date.UTC(yearNumber, monthNumber - 1, 1)
        );

        const endDate = new Date(
            Date.UTC(yearNumber, monthNumber, 1)
        );

        const transactions = await Transaction.find({
            user: req.userId,
            isDeleted: false,
            date: {
                $gte: startDate,
                $lt: endDate,
            },
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
            month: monthNumber,
            year: yearNumber,
            summary: {
                totalIncome,
                totalExpense,
                balance,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.get("/categories", protect, async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and Year are required"
            });
        }

        const monthNumber = Number(month);
        const yearNumber = Number(year);

        if (
            monthNumber < 1 ||
            monthNumber > 12 ||
            yearNumber < 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid month or year",
            });
        }

        const startDate = new Date(
            Date.UTC(yearNumber, monthNumber - 1, 1)
        );

        const endDate = new Date(
            Date.UTC(yearNumber, monthNumber, 1)
        );

        const transactions = await Transaction.find({
            user: req.userId,
            type: "expense",
            isDeleted: false,
            date: {
                $gte: startDate,
                $lt: endDate,
            },
        }).populate("category"  , "name");

        const categoryTotals = {};

         for (const transaction of transactions) {
            const categoryName = transaction.category.name;

            if (!categoryTotals[categoryName]) {
                categoryTotals[categoryName] = 0;
            }

            categoryTotals[categoryName] += transaction.amount;
        }
        const categories = Object.entries(categoryTotals).map(
            ([category, amount]) => ({
                category,
                amount,
            })
        );

        res.status(200).json({
            success: true,
            month: monthNumber,
            year: yearNumber,
            categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.get("/recent", protect, async(req,res)=>{
    try{
        const transactions = await Transaction.find({
            user: req.userId,
            isDeleted: false,
        }).sort({ date: -1 })
            .limit(7)
            .populate("category", "name type");
        res.status(200).json({
            success: true,
            transactions,
        });

    }
    catch(error){
         res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
import express from "express";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
    try {
        const {
            category,
            amount,
            month,
            year,
        } = req.body;

        if (!category || !amount || !month || !year) {
            return res.status(400).json({
                success: false,
                message: "Category, amount, month and year are required",
            });
        }
        const selectedCategory = await Category.findOne({
            _id: category,
            isDeleted: false,
            $or: [
                { isDefault: true },
                { user: req.userId },
            ],
        });
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (selectedCategory.type !== "expense") {
            return res.status(400).json({
                success: false,
                message: "Budget can only be created for expense categories",
            });
        }
        const existingBudget = await Budget.findOne({
            user: req.userId,
            category,
            month,
            year,
            isDeleted: false,
        });

        if (existingBudget) {
            return res.status(400).json({
                success: false,
                message: "Budget already exists for this category and month",
            });
        }
        const budget = await Budget.create({
            user: req.userId,
            category,
            amount,
            month,
            year,
        });
        return res.status(201).json({
            success: true,
            message: "Budget created successfully",
            budget,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


router.get("/", protect, async (req, res) => {
    try {
        const budgets = await Budget.find({
            user: req.userId,
            isDeleted: false,
        })
            .populate("category", "name type")
            .sort({ year: -1, month: -1 });

        return res.status(200).json({
            success: true,
            budgets,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.get("/summary", protect, async (req, res) => {
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

        const budgets = await Budget.find({
            user: req.userId,
            month: monthNumber,
            year: yearNumber,
            isDeleted: false,
        }).populate("category", "name type");

        const summary = [];

        for (const budget of budgets) {

            const startDate = new Date(
                Date.UTC(yearNumber, monthNumber - 1, 1)
            );

            const endDate = new Date(
                Date.UTC(yearNumber, monthNumber, 1)
            );

            const result = await Transaction.aggregate([
                {
                    $match: {
                        user: budget.user,
                        category: budget.category._id,
                        type: "expense",
                        isDeleted: false,
                        date: {
                            $gte: startDate,
                            $lt: endDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSpent: {
                            $sum: "$amount",
                        },
                    },
                },
            ]);

            const spent = result.length > 0
                ? result[0].totalSpent
                : 0;

            const remaining = budget.amount - spent;

            const percentage = budget.amount > 0
                ? (spent / budget.amount) * 100
                : 0;

            summary.push({
                budgetId: budget._id,
                category: budget.category,
                budgetAmount: budget.amount,
                spent,
                remaining,
                percentage: Number(percentage.toFixed(2)),
                exceeded: spent > budget.amount,
            });
        }

        return res.status(200).json({
            success: true,
            month: monthNumber,
            year: yearNumber,
            summary,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


router.get("/:id", protect, async (req, res) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false,
        }).populate("category", "name type");

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        return res.status(200).json({
            success: true,
            budget,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.put("/:id", protect, async (req, res) => {
    try {
        const {
            category,
            amount,
            month,
            year,
        } = req.body;

        const budget = await Budget.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false,
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        if (!category || !amount || !month || !year) {
            return res.status(400).json({
                success: false,
                message: "Category, amount, month and year are required",
            });
        }

        const selectedCategory = await Category.findOne({
            _id: category,
            isDeleted: false,
            $or: [
                { isDefault: true },
                { user: req.userId },
            ],
        });

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (selectedCategory.type !== "expense") {
            return res.status(400).json({
                success: false,
                message: "Budget can only be created for expense categories",
            });
        }

        const existingBudget = await Budget.findOne({
            _id: { $ne: req.params.id },
            user: req.userId,
            category,
            month,
            year,
            isDeleted: false,
        });

        if (existingBudget) {
            return res.status(400).json({
                success: false,
                message: "Another budget already exists for this category and month",
            });
        }

        budget.category = category;
        budget.amount = amount;
        budget.month = month;
        budget.year = year;

        await budget.save();

        return res.status(200).json({
            success: true,
            message: "Budget updated successfully",
            budget,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false,
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        budget.isDeleted = true;
        budget.deletedAt = new Date();

        await budget.save();

        return res.status(200).json({
            success: true,
            message: "Budget deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
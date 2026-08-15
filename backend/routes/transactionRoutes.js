import express from "express";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";
import Category from "../models/Category.js";

const router = express.Router();


// ======================================================
// CREATE TRANSACTION
// POST /api/transactions
// ======================================================
router.post("/", protect, async (req, res) => {
    try {
        const {
            title,
            amount,
            type,
            category,
            paymentMethod,
            date,
            note,
        } = req.body;

        // Required fields
        if (
            !title ||
            !amount ||
            !type ||
            !category ||
            !paymentMethod
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }

        // Find category:
        // 1. Shared default category
        // OR
        // 2. Category owned by logged-in user
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

        // Category type must match transaction type
        if (selectedCategory.type !== type) {
            return res.status(400).json({
                success: false,
                message: "Category type does not match transaction type",
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            user: req.userId,
            category: category,
            title: title.trim(),
            amount: Number(amount),
            type,
            paymentMethod,
            date,
            note: note ? note.trim() : "",
        });

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// ======================================================
// GET TRANSACTIONS
// GET /api/transactions
// ======================================================
router.get("/", protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.userId,
            isDeleted: false,
        })
            .populate("category", "name type")
            .sort({ date: -1 });

        return res.status(200).json({
            success: true,
            transactions,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// ======================================================
// UPDATE TRANSACTION
// PUT /api/transactions/:id
// ======================================================
router.put("/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        const {
            title,
            amount,
            type,
            category,
            paymentMethod,
            date,
            note,
        } = req.body;

        // Find category:
        // Default category OR user's own category
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

        // Category type must match transaction type
        if (selectedCategory.type !== type) {
            return res.status(400).json({
                success: false,
                message: "Category type does not match transaction type",
            });
        }

        transaction.title = title.trim();
        transaction.amount = Number(amount);
        transaction.type = type;
        transaction.category = category;
        transaction.paymentMethod = paymentMethod;
        transaction.date = date || transaction.date;
        transaction.note = note ? note.trim() : "";

        await transaction.save();

        return res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            transaction,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// ======================================================
// DELETE TRANSACTION - SOFT DELETE
// DELETE /api/transactions/:id
// ======================================================
router.delete("/:id", protect, async (req, res) => {
    try {
        // Find transaction belonging to logged-in user
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        // Soft delete
        transaction.isDeleted = true;
        transaction.deletedAt = new Date();

        await transaction.save();

        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


export default router;
import express from "express";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";
import Category from "../models/Category.js";

const router = express.Router();

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

        const selectedCategory = await Category.findOne({
            _id: category,
            user: req.userId,
            isDeleted: false,
        });
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        if (selectedCategory.type !== type) {
            return res.status(400).json({
                success: false,
                message: "Category type does not match transaction type",
            });
        }
        // Create a new transaction
        const transaction = await Transaction.create({
            user: req.userId,
            category,
            title: title.trim(),
            amount,
            type,
            paymentMethod,
            date,
            note: note ? note.trim() : "",
        });

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
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
        const transactions = await Transaction.find({
            user: req.userId,
            isDeleted: false,
        })
            .populate("category", "name type")
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            transactions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

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

        const selectedCategory = await Category.findOne({
            _id: category,
            user: req.userId,
            isDeleted: false,
        });
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        if (selectedCategory.type !== type) {
            return res.status(400).json({
                success: false,
                message: "Category type does not match transaction type",
            });
        }

        transaction.title = title.trim();
        transaction.amount = amount;
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

router.delete("/:id", protect, async (req, res) => {
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
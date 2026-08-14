import express from "express";
import protect from "../middleware/authMiddleware.js";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.get("/test", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Category routes are working!",
        userId: req.userId,
    });
});

router.post("/", protect, async (req, res) => {
    try {
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: "Category name and type are required",
            });
        }

        const trimmedName = name.trim();

        // A Regular Expression (Regex) is a way to search text using patterns.
        const existingCategory = await Category.findOne({
            isDeleted: false,
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
            type,
            $or: [
                { isDefault: true },
                { user: req.userId },
            ],
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const category = await Category.create({
            user: req.userId,
            name: trimmedName,
            type,
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
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
        const categories = await Category.find({
            isDeleted: false,
            $or: [
                { isDefault: true },
                { user: req.userId },
            ],
        }).sort({ name: 1 });
        return res.status(200).json({
            success: true,
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

router.put("/:id", protect, async (req, res) => {
    try {
        const { name, type } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (category.isDefault) {
            return res.status(403).json({
                success: false,
                message: "Default categories cannot be edited",
            });
        }

        if (category.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to edit this category",
            });
        }

        if (name) {
            const trimmedName = name.trim();

            const duplicate = await Category.findOne({
                _id: { $ne: category._id },
                isDeleted: false,
                name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
                $or: [
                    { isDefault: true },
                    { user: req.userId },
                ],
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Category already exists",
                });
            }

            category.name = trimmedName;
        }

        if (type && type !== category.type) {
            const inUse = await Transaction.findOne({
                category: category._id,
                isDeleted: false,
            });

            if (inUse) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot change type: this category is used by existing transactions",
                });
            }

            category.type = type;
        }

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || category.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (category.isDefault) {
            return res.status(403).json({
                success: false,
                message: "Default categories cannot be deleted",
            });
        }

        if (category.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this category",
            });
        }

        const inUse = await Transaction.findOne({
            category: category._id,
            isDeleted: false,
        });

        if (inUse) {
            return res.status(400).json({
                success: false,
                message: "This category is used by existing transactions and cannot be deleted",
            });
        }

        category.isDeleted = true;
        category.deletedAt = new Date();
        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});



export default router;


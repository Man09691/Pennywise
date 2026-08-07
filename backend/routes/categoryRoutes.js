import express from "express";
import protect from "../middleware/authMiddleware.js";
import Category from "../models/Category.js";

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
            user: req.userId,
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
            isDeleted: false,
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



export default router;


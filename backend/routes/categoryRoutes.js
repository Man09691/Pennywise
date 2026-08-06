import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/test", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Category routes are working!",
        userId: req.userId,
    });
});

export default router;


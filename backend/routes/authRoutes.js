import express from "express";
import bycrt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const passwordHash = await bycrt.hash(password, 10);

        const user = await User.create({ name, email, passwordHash });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    }

    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and Password are Required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Email or Password" });
        }

        const isMatch = await bycrt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid Email or Password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        })

        res.status(200).json({
            success: true,
            user: { _id: user._id, name: user.name, email: user.email },
            token,
        });
    }

    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/me", protect, async (req, res) => {
    res.status(200).json({ success: true, message: "You are authorized.", userId: req.userId });
});

router.put("/change-password", protect, async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        // Temporary response
        // We'll replace this with the actual password-changing logic
        // in the next step.
        // Find the logged-in user using the ID from the JWT
        const user = await User.findById(req.userId);

        // Check whether the user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Compare the current password with the stored password hash
        const isMatch = await bycrt.compare(
            currentPassword,
            user.passwordHash
        );

        // If the current password is incorrect
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const newPasswordHash = await bycrt.hash(newPassword, 10);

        user.passwordHash = newPasswordHash;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
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
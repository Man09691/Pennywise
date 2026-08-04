import express from "express";
import bycrt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
            user: { _id: user._id, name: user.name, email: user.email },
            token,
        });
    }

    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.post('/login', async (req,res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({success: false, message: "Email and Password are Required"});
        }
         
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({success: false, message: "Invalid Email or Password"});
        }

        const isMatch = await bycrt.compare(password, user.passwordHash);
        if(!isMatch){
            return res.status(400).json({success: false, message: "Invalid Email or Password"});
        }

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {
            expiresIn: "7d",
        })

        res.status(200).json({
            success: true,
            user: { _id: user._id, name: user.name, email: user.email },
            token,
        });
    }

    catch(error){
        res.status(500).json({success: false, message: error.message});
    }
});


export default router;
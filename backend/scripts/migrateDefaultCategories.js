import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI); // match the var name used in your config/db.js
    console.log("Connected to MongoDB");

    const result = await Category.updateMany(
        { isDefault: true },
        { $set: { user: null } }
    );

    console.log(`Updated ${result.modifiedCount} default categories to user: null`);
    await mongoose.disconnect();
}

migrate();
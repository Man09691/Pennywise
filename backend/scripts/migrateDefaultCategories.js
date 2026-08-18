import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

        // --------------------------------------------
        // Get all default categories
        // --------------------------------------------

        const defaultCategories = await Category.find({
            isDefault: true,
        }).sort({ createdAt: 1 });

        console.log(
            `Found ${defaultCategories.length} default category documents`
        );

        const seen = new Set();

        let deletedCount = 0;
        let updatedCount = 0;

        // --------------------------------------------
        // Keep only ONE copy of each
        // name + type combination
        // --------------------------------------------

        for (const category of defaultCategories) {
            const key = `${category.name.trim().toLowerCase()}|${category.type}`;

            if (seen.has(key)) {
                await Category.deleteOne({
                    _id: category._id,
                });

                deletedCount++;

                console.log(
                    `Deleted duplicate: ${category.name} (${category.type})`
                );

                continue;
            }

            seen.add(key);

            // Make sure the remaining default
            // category is truly global.
            if (
                category.user !== null ||
                category.isDeleted !== false
            ) {
                category.user = null;
                category.isDeleted = false;
                category.deletedAt = null;

                await category.save();

                updatedCount++;
            }
        }

        console.log("--------------------------------");
        console.log(`Duplicates deleted: ${deletedCount}`);
        console.log(`Categories updated: ${updatedCount}`);
        console.log("--------------------------------");

        // --------------------------------------------
        // Show final categories
        // --------------------------------------------

        const finalCategories = await Category.find({
            isDefault: true,
            isDeleted: false,
        }).sort({
            name: 1,
        });

        console.log(
            "Final default categories:"
        );

        finalCategories.forEach((category) => {
            console.log(
                `${category.name} | ${category.type} | user: ${category.user}`
            );
        });

        await mongoose.disconnect();

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);

        await mongoose.disconnect();

        process.exit(1);
    }
}

migrate();
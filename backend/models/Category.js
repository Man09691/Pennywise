import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        // The owner of this category
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Category name (Food, Gym, Salary, etc.)
        name: {
            type: String,
            required: true,
            trim: true,
        },

        // Expense or Income
        type: {
            type: String,
            enum: ["expense", "income"],
            required: true,
        },

        // Whether this is a built-in category
        isDefault: {
            type: Boolean,
            default: false,
        },

        // Soft delete (future feature)
        isDeleted: {
            type: Boolean,
            default: false,
        },

        // Stores deletion date if soft deleted
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
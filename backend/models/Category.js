import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: ["expense", "income"],
            required: true,
        },

        isDefault: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate default categories
categorySchema.index(
    {
        name: 1,
        type: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            isDefault: true,
        },
    }
);

const Category = mongoose.model(
    "Category",
    categorySchema
);

export default Category;


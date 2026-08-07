import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        user: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
             type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },
         paymentMethod: {
            type: String,
            enum: [
                "Cash",
                "UPI",
                "Debit Card",
                "Credit Card",
                "Bank Transfer",
                "Cheque",
                "Other",
            ],
            required: true,
        },
         date: {
            type: Date,
            default: Date.now,
        },

        // Optional note
        note: {
            type: String,
            trim: true,
            default: "",
        },// Soft delete
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
)

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
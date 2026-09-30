import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";
import Category from "../models/Category.js";

const router = express.Router();


// ======================================================
// HELPER FUNCTIONS
// ======================================================

const normalize = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase();
};


const normalizeAmount = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return null;
    }

    return Math.abs(amount);
};


const makeFingerprint = (transaction) => {
    return [
        normalize(transaction.date),
        normalize(transaction.type),
        normalizeAmount(transaction.amount),
        normalize(transaction.category),
        normalize(transaction.paymentMethod || "Bank"),
        normalize(transaction.title || "Imported Transaction"),
        normalize(transaction.note || ""),
    ].join("|");
};


const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};


// ======================================================
// CREATE TRANSACTION
// POST /api/transactions
// ======================================================

router.post("/", protect, async (req, res) => {
    try {
        const {
            title,
            amount,
            type,
            category,
            paymentMethod,
            date,
            note,
        } = req.body;


        // Required fields
        if (
            !title ||
            amount === undefined ||
            amount === null ||
            !type ||
            !category ||
            !paymentMethod
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }


        // Find category
        // 1. Shared default category
        // 2. Category owned by logged-in user

        const selectedCategory = await Category.findOne({
            _id: category,
            isDeleted: false,

            $or: [
                {
                    isDefault: true,
                },
                {
                    user: req.userId,
                },
            ],
        });


        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }


        // Category type must match transaction type

        if (selectedCategory.type !== type) {
            return res.status(400).json({
                success: false,
                message:
                    "Category type does not match transaction type",
            });
        }


        // Create transaction

        const transaction = await Transaction.create({
            user: req.userId,
            category: category,
            title: title.trim(),
            amount: Number(amount),
            type,
            paymentMethod,
            date,
            note: note ? note.trim() : "",
        });


        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
        });

    } catch (error) {
        console.error("Create transaction error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// ======================================================
// CHECK IMPORT DUPLICATES
// POST /api/transactions/import/check-duplicates
// ======================================================
//
// Checks imported CSV transactions against:
//
// 1. Existing Pennywise database transactions
// 2. Duplicate transactions inside the uploaded CSV
//
// Duplicate requires ALL fingerprint fields to match,
// INCLUDING AMOUNT.
//
// Same transaction but different amount = NOT duplicate.
//
// ======================================================

router.post(
    "/import/check-duplicates",
    protect,
    async (req, res) => {
        try {
            const { transactions } = req.body;


            if (
                !Array.isArray(transactions) ||
                transactions.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "No transactions were provided for duplicate checking.",
                });
            }


            // Get user's existing transactions

            const existingTransactions =
                await Transaction.find({
                    user: req.userId,
                    isDeleted: false,
                })
                    .select(
                        "date type amount category paymentMethod title note"
                    )
                    .lean();


            // Existing database fingerprints

            const existingFingerprints =
                new Set(
                    existingTransactions.map(
                        makeFingerprint
                    )
                );


            // Keep track of duplicates inside CSV

            const seenImportFingerprints =
                new Set();


            const checkedTransactions =
                transactions.map(
                    (transaction, index) => {

                        const fingerprint =
                            makeFingerprint(
                                transaction
                            );


                        const existsInDatabase =
                            existingFingerprints.has(
                                fingerprint
                            );


                        const duplicateInFile =
                            seenImportFingerprints.has(
                                fingerprint
                            );


                        seenImportFingerprints.add(
                            fingerprint
                        );


                        return {
                            ...transaction,

                            importIndex:
                                transaction.importIndex ??
                                index,

                            isDuplicate:
                                existsInDatabase ||
                                duplicateInFile,

                            duplicateReason:
                                existsInDatabase
                                    ? "Already exists in Pennywise"
                                    : duplicateInFile
                                    ? "Duplicate transaction in uploaded file"
                                    : null,
                        };
                    }
                );


            const duplicates =
                checkedTransactions.filter(
                    (transaction) =>
                        transaction.isDuplicate
                );


            const newTransactions =
                checkedTransactions.filter(
                    (transaction) =>
                        !transaction.isDuplicate
                );


            return res.status(200).json({
                success: true,

                total:
                    checkedTransactions.length,

                duplicateCount:
                    duplicates.length,

                newCount:
                    newTransactions.length,

                transactions:
                    checkedTransactions,
            });

        } catch (error) {

            console.error(
                "Import duplicate check error:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Unable to check imported transactions for duplicates.",
            });
        }
    }
);


// ======================================================
// FINAL IMPORT
// POST /api/transactions/import
// ======================================================
//
// This is the actual database import.
//
// The server checks duplicates AGAIN before inserting.
//
// This protects the database even if the frontend already
// performed duplicate checking.
//
// Duplicate transactions are skipped.
//
// New transactions are inserted.
//
// ======================================================

router.post(
    "/import",
    protect,
    async (req, res) => {
        try {

            const { transactions } = req.body;


            if (
                !Array.isArray(transactions) ||
                transactions.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "No transactions were provided for import.",
                });
            }


            // ==================================================
            // GET EXISTING DATABASE TRANSACTIONS
            // ==================================================

            const existingTransactions =
                await Transaction.find({
                    user: req.userId,
                    isDeleted: false,
                })
                    .select(
                        "date type amount category paymentMethod title note"
                    )
                    .lean();


            const existingFingerprints =
                new Set(
                    existingTransactions.map(
                        makeFingerprint
                    )
                );


            const seenImportFingerprints =
                new Set();


            const documents = [];

            const skippedTransactions = [];


            // ==================================================
            // PROCESS EACH TRANSACTION
            // ==================================================

            for (
                let index = 0;
                index < transactions.length;
                index++
            ) {

                const item =
                    transactions[index];


                // ----------------------------------------------
                // NORMALIZE VALUES
                // ----------------------------------------------

                const date =
                    String(
                        item.date ?? ""
                    ).trim();


                const type =
                    normalize(
                        item.type
                    );


                const amount =
                    normalizeAmount(
                        item.amount
                    );


                const category =
                    String(
                        item.category ?? ""
                    ).trim();


                const paymentMethod =
                    String(
                        item.paymentMethod ||
                        "Bank"
                    ).trim();


                const title =
                    String(
                        item.title ||
                        "Imported Transaction"
                    ).trim();


                const note =
                    String(
                        item.note || ""
                    ).trim();


                // ----------------------------------------------
                // REQUIRED DATA VALIDATION
                // ----------------------------------------------

                if (
                    !date ||
                    !type ||
                    amount === null ||
                    !category
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            `Transaction ${
                                index + 1
                            } contains invalid required data. Import cancelled; no transactions were added.`,
                    });
                }


                // ----------------------------------------------
                // TYPE VALIDATION
                // ----------------------------------------------

                if (
                    ![
                        "income",
                        "expense",
                    ].includes(type)
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            `Transaction ${
                                index + 1
                            } has an invalid transaction type. Import cancelled; no transactions were added.`,
                    });
                }


                // ----------------------------------------------
                // CATEGORY ID VALIDATION
                // ----------------------------------------------

                if (
                    !isValidObjectId(
                        category
                    )
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            `Transaction ${
                                index + 1
                            } contains an invalid category. Import cancelled; no transactions were added.`,
                    });
                }


                // ----------------------------------------------
                // FIND CATEGORY
                // ----------------------------------------------
                //
                // Allowed categories:
                //
                // 1. Shared default category
                // 2. User's own custom category
                //
                // ----------------------------------------------

                const selectedCategory =
                    await Category.findOne({
                        _id: category,

                        isDeleted: false,

                        $or: [
                            {
                                isDefault: true,
                            },
                            {
                                user: req.userId,
                            },
                        ],
                    });


                if (!selectedCategory) {
                    return res.status(404).json({
                        success: false,

                        message:
                            `Category for transaction ${
                                index + 1
                            } was not found or is not available to this user.`,
                    });
                }


                // ----------------------------------------------
                // CATEGORY TYPE CHECK
                // ----------------------------------------------

                if (
                    selectedCategory.type !==
                    type
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            `Category type does not match transaction type for transaction ${
                                index + 1
                            }.`,
                    });
                }


                // ----------------------------------------------
                // NORMALIZED TRANSACTION
                // ----------------------------------------------

                const normalizedTransaction = {
                    date,
                    type,
                    amount,
                    category,
                    paymentMethod,
                    title,
                    note,
                };


                // ----------------------------------------------
                // CREATE FINGERPRINT
                // ----------------------------------------------

                const fingerprint =
                    makeFingerprint(
                        normalizedTransaction
                    );


                // ----------------------------------------------
                // CHECK DATABASE DUPLICATE
                // ----------------------------------------------

                if (
                    existingFingerprints.has(
                        fingerprint
                    )
                ) {

                    skippedTransactions.push({
                        importIndex:
                            index,

                        reason:
                            "Already exists in Pennywise",
                    });

                    continue;
                }


                // ----------------------------------------------
                // CHECK CSV DUPLICATE
                // ----------------------------------------------

                if (
                    seenImportFingerprints.has(
                        fingerprint
                    )
                ) {

                    skippedTransactions.push({
                        importIndex:
                            index,

                        reason:
                            "Duplicate transaction in uploaded file",
                    });

                    continue;
                }


                // Mark fingerprint as seen

                seenImportFingerprints.add(
                    fingerprint
                );


                // ----------------------------------------------
                // PREPARE MONGOOSE DOCUMENT
                // ----------------------------------------------

                documents.push({
                    user: req.userId,

                    title,

                    amount,

                    type,

                    category,

                    paymentMethod,

                    date,

                    note,

                    isDeleted: false,

                    deletedAt: null,
                });
            }


            // ==================================================
            // INSERT NEW TRANSACTIONS
            // ==================================================

            const insertedTransactions =
                documents.length > 0
                    ? await Transaction.insertMany(
                        documents
                    )
                    : [];


            // ==================================================
            // RESPONSE
            // ==================================================

            return res.status(201).json({

                success: true,

                message:
                    insertedTransactions.length > 0
                        ? `${insertedTransactions.length} transaction${
                            insertedTransactions.length !== 1
                                ? "s"
                                : ""
                        } imported successfully.`
                        : "No new transactions were imported because all submitted transactions were duplicates.",

                count:
                    insertedTransactions.length,

                insertedCount:
                    insertedTransactions.length,

                skippedCount:
                    skippedTransactions.length,

                skippedTransactions,

                transactions:
                    insertedTransactions,
            });

        } catch (error) {

            console.error(
                "Transaction import error:",
                error
            );


            return res.status(500).json({
                success: false,

                message:
                    error.message ||
                    "Unable to import transactions.",
            });
        }
    }
);


// ======================================================
// GET TRANSACTIONS
// GET /api/transactions
// ======================================================

router.get(
    "/",
    protect,
    async (req, res) => {
        try {
            const {
                from,
                to,
                category,
                type,
                limit,
            } = req.query;

            const query = {
                user: req.userId,
                isDeleted: false,
            };

            // Date range filtering
            if (from || to) {
                query.date = {};

                if (from) {
                    query.date.$gte = new Date(from);
                }

                if (to) {
                    query.date.$lte = new Date(to);
                }
            }

            // Category filtering
            if (category) {
                query.category = category;
            }

            // Income / expense filtering
            if (type) {
                if (!["income", "expense"].includes(type)) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid transaction type. Use income or expense.",
                    });
                }

                query.type = type;
            }

            let transactionQuery = Transaction.find(query)
                .populate("category", "name type")
                .sort({
                    date: -1,
                });

            // Optional result limit
            if (limit) {
                const parsedLimit = Number(limit);

                if (
                    !Number.isInteger(parsedLimit) ||
                    parsedLimit < 1 ||
                    parsedLimit > 100
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Limit must be an integer between 1 and 100.",
                    });
                }

                transactionQuery = transactionQuery.limit(
                    parsedLimit
                );
            }

            const transactions =
                await transactionQuery;

            return res.status(200).json({
                success: true,
                transactions,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);


// ======================================================
// UPDATE TRANSACTION
// PUT /api/transactions/:id
// ======================================================

router.put(
    "/:id",
    protect,
    async (req, res) => {
        try {

            const transaction =
                await Transaction.findOne({
                    _id: req.params.id,
                    user: req.userId,
                    isDeleted: false,
                });


            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Transaction not found",
                });
            }


            const {
                title,
                amount,
                type,
                category,
                paymentMethod,
                date,
                note,
            } = req.body;


            // Find category

            const selectedCategory =
                await Category.findOne({
                    _id: category,
                    isDeleted: false,

                    $or: [
                        {
                            isDefault: true,
                        },
                        {
                            user: req.userId,
                        },
                    ],
                });


            if (!selectedCategory) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Category not found",
                });
            }


            // Category type validation

            if (
                selectedCategory.type !==
                type
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category type does not match transaction type",
                });
            }


            // Update transaction

            transaction.title =
                title.trim();

            transaction.amount =
                Number(amount);

            transaction.type =
                type;

            transaction.category =
                category;

            transaction.paymentMethod =
                paymentMethod;

            transaction.date =
                date ||
                transaction.date;

            transaction.note =
                note
                    ? note.trim()
                    : "";


            await transaction.save();


            return res.status(200).json({
                success: true,

                message:
                    "Transaction updated successfully",

                transaction,
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);


// ======================================================
// DELETE TRANSACTION - SOFT DELETE
// DELETE /api/transactions/:id
// ======================================================

router.delete(
    "/:id",
    protect,
    async (req, res) => {
        try {

            const transaction =
                await Transaction.findOne({
                    _id: req.params.id,
                    user: req.userId,
                    isDeleted: false,
                });


            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Transaction not found",
                });
            }


            // Soft delete

            transaction.isDeleted =
                true;

            transaction.deletedAt =
                new Date();


            await transaction.save();


            return res.status(200).json({
                success: true,

                message:
                    "Transaction deleted successfully",
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);


export default router;
/*
=========================================================
PENNYWISE — BANK CSV FORMAT CONFIGURATION
=========================================================

Purpose:
- Store known bank CSV formats in one place.
- Allow BankImport.jsx to automatically identify columns.
- Keep bank-specific logic OUT of the UI component.
- Make it easy to add more banks later.

IMPORTANT:
The column names below are examples/patterns that the
mapper can recognize. We can expand them as we test
real CSV files from each bank.
=========================================================
*/


/*
=========================================================
HELPER
=========================================================
*/

export function normalizeHeader(header) {
    return String(header ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
}


/*
=========================================================
BANK CSV PROFILES
=========================================================

Each Pennywise field contains possible CSV column names.

The mapper will compare the actual CSV headers against
these aliases.

We are intentionally keeping this configuration separate
from BankImport.jsx.
=========================================================
*/

export const BANK_CSV_FORMATS = {
    hdfc: {
        id: "hdfc",
        name: "HDFC Bank",

        fields: {
            date: [
                "date",
                "transaction date",
                "txn date",
                "value date",
            ],

            title: [
                "description",
                "narration",
                "transaction description",
                "transaction details",
                "remarks",
            ],

            amount: [
                "amount",
                "transaction amount",
            ],

            type: [
                "type",
                "transaction type",
                "dr cr",
                "debit credit",
            ],

            category: [
                "category",
            ],

            paymentMethod: [
                "payment method",
                "mode",
                "transaction mode",
            ],

            note: [
                "notes",
                "remarks",
            ],

            debit: [
                "debit",
                "debit amount",
                "withdrawal",
                "withdrawal amt",
                "withdrawal amt.",
            ],

            credit: [
                "credit",
                "credit amount",
                "deposit",
                "deposit amt",
                "deposit amt.",
            ],

            balance: [
                "balance",
                "closing balance",
                "closing bal",
            ],
        },
    },


    /*
    =====================================================
    ICICI BANK
    =====================================================
    */

    icici: {
        id: "icici",
        name: "ICICI Bank",

        fields: {
            date: [
                "date",
                "transaction date",
                "txn date",
                "value date",
            ],

            title: [
                "description",
                "narration",
                "transaction details",
                "remarks",
            ],

            amount: [
                "amount",
                "transaction amount",
            ],

            type: [
                "type",
                "transaction type",
                "dr cr",
                "debit credit",
            ],

            category: [
                "category",
            ],

            paymentMethod: [
                "payment method",
                "mode",
                "transaction mode",
            ],

            note: [
                "notes",
                "remarks",
            ],

            debit: [
                "debit",
                "debit amount",
                "withdrawal",
            ],

            credit: [
                "credit",
                "credit amount",
                "deposit",
            ],

            balance: [
                "balance",
                "closing balance",
            ],
        },
    },


    /*
    =====================================================
    SBI
    =====================================================
    */

    sbi: {
        id: "sbi",
        name: "State Bank of India",

        fields: {
            date: [
                "date",
                "transaction date",
                "txn date",
                "value date",
            ],

            title: [
                "description",
                "narration",
                "transaction details",
                "remarks",
            ],

            amount: [
                "amount",
                "transaction amount",
            ],

            type: [
                "type",
                "transaction type",
                "dr cr",
                "debit credit",
            ],

            category: [
                "category",
            ],

            paymentMethod: [
                "payment method",
                "mode",
                "transaction mode",
            ],

            note: [
                "notes",
                "remarks",
            ],

            debit: [
                "debit",
                "debit amount",
                "withdrawal",
                "withdrawal amount",
            ],

            credit: [
                "credit",
                "credit amount",
                "deposit",
                "deposit amount",
            ],

            balance: [
                "balance",
                "closing balance",
            ],
        },
    },


    /*
    =====================================================
    AXIS BANK
    =====================================================
    */

    axis: {
        id: "axis",
        name: "Axis Bank",

        fields: {
            date: [
                "date",
                "transaction date",
                "txn date",
                "value date",
            ],

            title: [
                "description",
                "narration",
                "transaction details",
                "remarks",
            ],

            amount: [
                "amount",
                "transaction amount",
            ],

            type: [
                "type",
                "transaction type",
                "dr cr",
                "debit credit",
            ],

            category: [
                "category",
            ],

            paymentMethod: [
                "payment method",
                "mode",
                "transaction mode",
            ],

            note: [
                "notes",
                "remarks",
            ],

            debit: [
                "debit",
                "debit amount",
                "withdrawal",
                "withdrawal amount",
            ],

            credit: [
                "credit",
                "credit amount",
                "deposit",
                "deposit amount",
            ],

            balance: [
                "balance",
                "closing balance",
            ],
        },
    },


    /*
    =====================================================
    KOTAK MAHINDRA BANK
    =====================================================
    */

    kotak: {
        id: "kotak",
        name: "Kotak Mahindra Bank",

        fields: {
            date: [
                "date",
                "transaction date",
                "txn date",
                "value date",
            ],

            title: [
                "description",
                "narration",
                "transaction details",
                "remarks",
            ],

            amount: [
                "amount",
                "transaction amount",
            ],

            type: [
                "type",
                "transaction type",
                "dr cr",
                "debit credit",
            ],

            category: [
                "category",
            ],

            paymentMethod: [
                "payment method",
                "mode",
                "transaction mode",
            ],

            note: [
                "notes",
                "remarks",
            ],

            debit: [
                "debit",
                "debit amount",
                "withdrawal",
                "withdrawal amount",
            ],

            credit: [
                "credit",
                "credit amount",
                "deposit",
                "deposit amount",
            ],

            balance: [
                "balance",
                "closing balance",
            ],
        },
    },
};


/*
=========================================================
BANK LIST FOR UI
=========================================================

BankImport.jsx can use this to render the bank selector.

We keep "other" separate because it doesn't have a known
bank-specific format.
=========================================================
*/

export const BANK_OPTIONS = [
    {
        id: "hdfc",
        name: "HDFC Bank",
    },

    {
        id: "icici",
        name: "ICICI Bank",
    },

    {
        id: "sbi",
        name: "State Bank of India",
    },

    {
        id: "axis",
        name: "Axis Bank",
    },

    {
        id: "kotak",
        name: "Kotak Mahindra Bank",
    },

    {
        id: "other",
        name: "Other / My bank is not listed",
    },
];


/*
=========================================================
GET BANK PROFILE
=========================================================
*/

export function getBankProfile(bankId) {
    return BANK_CSV_FORMATS[bankId] || null;
}


/*
=========================================================
GET BANK FIELD ALIASES
=========================================================
*/

export function getBankFieldAliases(bankId, field) {
    const profile = getBankProfile(bankId);

    if (!profile) {
        return [];
    }

    return profile.fields[field] || [];
}


/*
=========================================================
CHECK WHETHER HEADER MATCHES ALIAS
=========================================================
*/

export function headerMatchesAlias(header, alias) {
    return (
        normalizeHeader(header) ===
        normalizeHeader(alias)
    );
}


/*
=========================================================
FIND MATCHING CSV COLUMN
=========================================================

Returns:

{
    column: "Date",
    confidence: "high"
}

or null if no match exists.
=========================================================
*/

export function findMatchingColumn(
    headers,
    aliases,
) {
    if (!Array.isArray(headers)) {
        return null;
    }

    if (!Array.isArray(aliases)) {
        return null;
    }

    for (const alias of aliases) {
        const match = headers.find((header) =>
            headerMatchesAlias(
                header,
                alias,
            ),
        );

        if (match) {
            return {
                column: match,
                confidence: "high",
            };
        }
    }

    return null;
}


/*
=========================================================
AUTOMATIC BANK MAPPING
=========================================================

This is the main function BankImport.jsx will call.

Example result:

{
    date: {
        column: "Date",
        confidence: "high"
    },

    title: {
        column: "Description",
        confidence: "high"
    },

    amount: {
        column: "Amount",
        confidence: "high"
    }
}
=========================================================
*/

export function autoMapBankColumns(
    bankId,
    headers,
) {
    const profile = getBankProfile(bankId);

    if (!profile) {
        return {};
    }

    const mapping = {};

    Object.entries(profile.fields).forEach(
        ([field, aliases]) => {
            const match =
                findMatchingColumn(
                    headers,
                    aliases,
                );

            if (match) {
                mapping[field] = match;
            }
        },
    );

    return mapping;
}


/*
=========================================================
KNOWN PENNYWISE REQUIRED FIELDS
=========================================================

These are the fields that must eventually be available
before a transaction can be imported.
=========================================================
*/

export const REQUIRED_PENNYWISE_FIELDS = [
    "date",
    "type",
    "amount",
];


/*
=========================================================
OPTIONAL PENNYWISE FIELDS
=========================================================
*/

export const OPTIONAL_PENNYWISE_FIELDS = [
    "category",
    "paymentMethod",
    "title",
    "note",
];


import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  X,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  Sparkles,
  RefreshCw,
  Plus,
} from "lucide-react";
import Papa from "papaparse";
import { apiRequest } from "../services/api";

/*
|--------------------------------------------------------------------------
| BANK CSV PROFILES
|--------------------------------------------------------------------------
|
| Pennywise asks the user which bank produced the CSV.
|
| After the bank is selected, Pennywise knows the expected CSV aliases
| and can automatically identify Pennywise transaction fields.
|
*/

const BANK_PROFILES = {
  sbi: {
    id: "sbi",
    name: "State Bank of India",
    shortName: "SBI",

    mapping: {
      date: [
        "date",
        "txn date",
        "transaction date",
        "value date",
        "transaction_date",
        "txn_date",
      ],

      type: [
        "type",
        "transaction type",
        "credit/debit",
        "debit/credit",
        "cr/dr",
        "dr/cr",
        "credit debit",
        "debit credit",
      ],

      amount: [
        "amount",
        "transaction amount",
        "txn amount",
        "value",
        "transaction value",
      ],

      paymentMethod: [
        "payment method",
        "mode",
        "transaction mode",
        "mode of payment",
        "payment mode",
        "instrument",
        "channel",
      ],

      title: [
        "description",
        "transaction description",
        "narration",
        "remarks",
        "particulars",
        "details",
        "transaction details",
      ],

      note: [
        "notes",
        "note",
        "comments",
        "remark",
        "remarks",
      ],
    },
  },

  hdfc: {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",

    mapping: {
      date: [
        "date",
        "transaction date",
        "txn date",
        "value date",
      ],

      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],

      amount: [
        "amount",
        "transaction amount",
        "txn amount",
        "value",
      ],

      paymentMethod: [
        "payment method",
        "mode",
        "transaction mode",
        "mode of payment",
        "payment mode",
      ],

      title: [
        "description",
        "transaction description",
        "narration",
        "remarks",
        "particulars",
        "details",
      ],

      note: [
        "notes",
        "note",
        "comments",
        "remark",
        "remarks",
      ],
    },
  },

  icici: {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",

    mapping: {
      date: [
        "date",
        "transaction date",
        "txn date",
        "value date",
      ],

      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],

      amount: [
        "amount",
        "transaction amount",
        "txn amount",
        "value",
      ],

      paymentMethod: [
        "payment method",
        "mode",
        "transaction mode",
        "mode of payment",
        "payment mode",
      ],

      title: [
        "description",
        "transaction description",
        "narration",
        "remarks",
        "particulars",
        "details",
      ],

      note: [
        "notes",
        "note",
        "comments",
        "remark",
        "remarks",
      ],
    },
  },

  axis: {
    id: "axis",
    name: "Axis Bank",
    shortName: "Axis",

    mapping: {
      date: [
        "date",
        "transaction date",
        "txn date",
        "value date",
      ],

      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],

      amount: [
        "amount",
        "transaction amount",
        "txn amount",
        "value",
      ],

      paymentMethod: [
        "payment method",
        "mode",
        "transaction mode",
        "mode of payment",
        "payment mode",
      ],

      title: [
        "description",
        "transaction description",
        "narration",
        "remarks",
        "particulars",
        "details",
      ],

      note: [
        "notes",
        "note",
        "comments",
        "remark",
        "remarks",
      ],
    },
  },

  other: {
    id: "other",
    name: "Other / Unknown Bank",
    shortName: "Other",

    mapping: {
      date: [
        "date",
        "transaction date",
        "txn date",
        "value date",
      ],

      type: [
        "type",
        "transaction type",
        "credit/debit",
        "debit/credit",
        "cr/dr",
        "dr/cr",
        "transaction direction",
      ],

      amount: [
        "amount",
        "transaction amount",
        "txn amount",
        "value",
        "transaction value",
      ],

      paymentMethod: [
        "payment method",
        "mode",
        "transaction mode",
        "mode of payment",
        "payment mode",
        "channel",
      ],

      title: [
        "description",
        "transaction description",
        "narration",
        "remarks",
        "particulars",
        "details",
      ],

      note: [
        "notes",
        "note",
        "comments",
        "remark",
        "remarks",
      ],
    },
  },
};

const FIELD_LABELS = {
  date: "Date",
  type: "Type",
  amount: "Amount",
  paymentMethod: "Payment Method",
  title: "Description",
  note: "Notes",
};

const REQUIRED_AUTO_FIELDS = [
  "date",
  "type",
  "amount",
];

const EMPTY_MAPPING = {
  date: "",
  type: "",
  amount: "",
  paymentMethod: "",
  title: "",
  note: "",
};

/*
|--------------------------------------------------------------------------
| HEADER NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_-]/g, " ");
}

/*
|--------------------------------------------------------------------------
| AUTOMATIC COLUMN MATCHING
|--------------------------------------------------------------------------
*/

function automaticallyMapColumns(headers, bankProfile) {
  const mapping = {
    ...EMPTY_MAPPING,
  };

  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  Object.entries(bankProfile.mapping).forEach(
    ([field, aliases]) => {
      const normalizedAliases = aliases.map(normalizeHeader);

      const match = normalizedHeaders.find((header) =>
        normalizedAliases.includes(header.normalized)
      );

      if (match) {
        mapping[field] = match.original;
      }
    }
  );

  return mapping;
}

/*
|--------------------------------------------------------------------------
| BANK IMPORT
|--------------------------------------------------------------------------
*/

function BankImport() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | STEP
  |--------------------------------------------------------------------------
  */

  const [currentStep, setCurrentStep] = useState(1);

  /*
  |--------------------------------------------------------------------------
  | BANK
  |--------------------------------------------------------------------------
  */

  const [selectedBank, setSelectedBank] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FILE
  |--------------------------------------------------------------------------
  */

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CSV
  |--------------------------------------------------------------------------
  */

  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [csvRowCount, setCsvRowCount] = useState(0);
  const [readingCsv, setReadingCsv] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC PROCESSING
  |--------------------------------------------------------------------------
  */

  const [columnMapping, setColumnMapping] =
    useState(EMPTY_MAPPING);

  const [normalizedRows, setNormalizedRows] =
    useState([]);

  const [processingError, setProcessingError] =
    useState("");

  const [processingErrors, setProcessingErrors] =
    useState([]);

  /*
  |--------------------------------------------------------------------------
  | CATEGORIES
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | DUPLICATE CHECK
  |--------------------------------------------------------------------------
  */

  const [duplicateRows, setDuplicateRows] =
    useState([]);

  const [duplicateCheckComplete, setDuplicateCheckComplete] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | GENERAL ERROR
  |--------------------------------------------------------------------------
  */

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD CATEGORIES
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This uses the same /categories endpoint used by Pennywise.
  |
  | Therefore the import page receives:
  | - shared default categories
  | - user's custom categories
  |
  */

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const response = await apiRequest("/categories");

      const loadedCategories = Array.isArray(response)
        ? response
        : response?.categories || response?.data || [];

      setCategories(loadedCategories);
    } catch (err) {
      console.error(
        "Unable to load categories:",
        err
      );

      setCategories([]);

      setError(
        "Unable to load your Pennywise categories. Please refresh and try again."
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RESET IMPORT STATE
  |--------------------------------------------------------------------------
  */

  function resetImportState() {
    setSelectedFile(null);

    setCsvHeaders([]);
    setCsvRows([]);
    setCsvRowCount(0);

    setColumnMapping({
      ...EMPTY_MAPPING,
    });

    setNormalizedRows([]);

    setProcessingError("");
    setProcessingErrors([]);

    setDuplicateRows([]);
    setDuplicateCheckComplete(false);

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | SELECT BANK
  |--------------------------------------------------------------------------
  */

  function handleBankSelect(bankId) {
    setSelectedBank(bankId);

    resetImportState();

    setCurrentStep(2);
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FILE
  |--------------------------------------------------------------------------
  */

  function validateFile(file) {
    setError("");

    if (!file) {
      return false;
    }

    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      setError("Please select a CSV file.");
      return false;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "CSV file must be smaller than 10 MB."
      );
      return false;
    }

    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | SELECT FILE
  |--------------------------------------------------------------------------
  */

  function handleFileSelect(file) {
    if (!validateFile(file)) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    setCsvHeaders([]);
    setCsvRows([]);
    setCsvRowCount(0);

    setColumnMapping({
      ...EMPTY_MAPPING,
    });

    setNormalizedRows([]);

    setProcessingError("");
    setProcessingErrors([]);

    setDuplicateRows([]);
    setDuplicateCheckComplete(false);

    setCurrentStep(2);
    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT
  |--------------------------------------------------------------------------
  */

  function handleInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleFileSelect(file);
    }

    event.target.value = "";
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG & DROP
  |--------------------------------------------------------------------------
  */

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILE PICKER
  |--------------------------------------------------------------------------
  */

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE FILE
  |--------------------------------------------------------------------------
  */

  function removeFile() {
    resetImportState();
    setCurrentStep(2);
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT FILE SIZE
  |--------------------------------------------------------------------------
  */

  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /*
  |--------------------------------------------------------------------------
  | READ CSV
  |--------------------------------------------------------------------------
  */

  function readCsvFile() {
    if (!selectedFile) {
      setError("Please select a CSV file first.");
      return;
    }

    setError("");
    setReadingCsv(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,

      complete: (results) => {
        try {
          const fields = results.meta.fields || [];
          const rows = results.data || [];

          if (!fields.length) {
            setError(
              "The CSV file does not contain a readable header row."
            );

            setReadingCsv(false);
            return;
          }

          const cleanedRows = rows.filter((row) =>
            Object.values(row).some(
              (value) =>
                String(value ?? "").trim() !== ""
            )
          );

          if (!cleanedRows.length) {
            setError(
              "The CSV file does not contain any usable transaction records."
            );

            setReadingCsv(false);
            return;
          }

          setCsvHeaders(fields);
          setCsvRows(cleanedRows.slice(0, 10));
          setCsvRowCount(cleanedRows.length);

          setCurrentStep(3);
        } catch (err) {
          console.error(
            "CSV processing error:",
            err
          );

          setError(
            "Something went wrong while reading the CSV file."
          );
        } finally {
          setReadingCsv(false);
        }
      },

      error: (parseError) => {
        console.error(
          "CSV parsing error:",
          parseError
        );

        setError(
          parseError?.message ||
            "Unable to read the CSV file."
        );

        setReadingCsv(false);
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | GET MAPPED VALUE
  |--------------------------------------------------------------------------
  */

  function getMappedValue(row, field) {
    const column = columnMapping[field];

    if (!column) {
      return "";
    }

    return String(row[column] ?? "").trim();
  }

  /*
  |--------------------------------------------------------------------------
  | DATE NORMALIZATION
  |--------------------------------------------------------------------------
  */

  function normalizeDate(value) {
    if (!value) {
      return "";
    }

    const rawValue = String(value).trim();

    if (!rawValue) {
      return "";
    }

    /*
    | YYYY-MM-DD
    */

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      return rawValue;
    }

    /*
    | DD/MM/YYYY
    */

    const ddmmyyyy = rawValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, "0");
      const month = ddmmyyyy[2].padStart(2, "0");
      const year = ddmmyyyy[3];

      return `${year}-${month}-${day}`;
    }

    /*
    | DD-MM-YYYY
    */

    const ddmmyyyyDash = rawValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );

    if (ddmmyyyyDash) {
      const day = ddmmyyyyDash[1].padStart(2, "0");
      const month = ddmmyyyyDash[2].padStart(2, "0");
      const year = ddmmyyyyDash[3];

      return `${year}-${month}-${day}`;
    }

    /*
    | Native date parser fallback
    */

    const parsedDate = new Date(rawValue);

    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();

      const month = String(
        parsedDate.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        parsedDate.getDate()
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | TYPE NORMALIZATION
  |--------------------------------------------------------------------------
  |
  | Type is NEVER manually selected by the user.
  |
  | We try:
  | 1. Credit / Debit text
  | 2. CR / DR
  | 3. Signed amount
  |
  | If Pennywise cannot safely determine it,
  | the transaction is marked as unsafe.
  |
  */

  function normalizeType(value) {
    const rawValue = String(value ?? "")
      .trim()
      .toLowerCase();

    if (
      [
        "income",
        "credit",
        "credited",
        "credit entry",
        "deposit",
        "cr",
        "cr.",
        "credit amount",
        "money received",
      ].includes(rawValue)
    ) {
      return "income";
    }

    if (
      [
        "expense",
        "debit",
        "debited",
        "debit entry",
        "withdrawal",
        "dr",
        "dr.",
        "debit amount",
        "money paid",
      ].includes(rawValue)
    ) {
      return "expense";
    }

    if (
      rawValue.includes("credit") ||
      rawValue === "cr"
    ) {
      return "income";
    }

    if (
      rawValue.includes("debit") ||
      rawValue === "dr"
    ) {
      return "expense";
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | AMOUNT NORMALIZATION
  |--------------------------------------------------------------------------
  |
  | Returns:
  | - positive number = valid amount
  | - null = invalid / unreadable amount
  |
  */

  function normalizeAmount(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const originalValue = String(value).trim();

    if (!originalValue) {
      return null;
    }

    const cleanedValue = originalValue
      .replace(/,/g, "")
      .replace(/[₹$€£]/g, "")
      .trim();

    /*
    | Parentheses can represent negative values:
    | (1000) -> -1000
    */

    const isParenthesesNegative =
      /^\(.*\)$/.test(cleanedValue);

    const withoutParentheses =
      cleanedValue
        .replace(/^\(/, "")
        .replace(/\)$/, "");

    const amount = Number(
      withoutParentheses
    );

    if (!Number.isFinite(amount)) {
      return null;
    }

    return Math.abs(amount);
  }

  /*
  |--------------------------------------------------------------------------
  | DETERMINE TYPE FROM ROW
  |--------------------------------------------------------------------------
  |
  | This is deliberately conservative.
  |
  | We do NOT guess randomly.
  |
  */

  function determineTransactionType(
    row,
    mapping
  ) {
    /*
    | First use explicit Type / Credit-Debit column.
    */

    if (mapping.type) {
      const rawType = getMappedValueFromMapping(
        row,
        mapping,
        "type"
      );

      const normalizedType =
        normalizeType(rawType);

      if (normalizedType) {
        return normalizedType;
      }
    }

    /*
    | If there is no dedicated type column,
    | inspect amount sign.
    */

    if (mapping.amount) {
      const rawAmount = String(
        row[mapping.amount] ?? ""
      ).trim();

      if (
        rawAmount.startsWith("-") ||
        /^\(.*\)$/.test(rawAmount)
      ) {
        return "expense";
      }

      if (
        rawAmount.startsWith("+")
      ) {
        return "income";
      }
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | GET VALUE USING SPECIFIC MAPPING
  |--------------------------------------------------------------------------
  */

  function getMappedValueFromMapping(
    row,
    mapping,
    field
  ) {
    const column = mapping[field];

    if (!column) {
      return "";
    }

    return String(
      row[column] ?? ""
    ).trim();
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE NORMALIZED ROW
  |--------------------------------------------------------------------------
  */

  function normalizeRow(
    row,
    index,
    mapping
  ) {
    const date = normalizeDate(
      getMappedValueFromMapping(
        row,
        mapping,
        "date"
      )
    );

    const rawAmount =
      getMappedValueFromMapping(
        row,
        mapping,
        "amount"
      );

    const amount =
      normalizeAmount(rawAmount);

    const type =
      determineTransactionType(
        row,
        mapping
      );

    const paymentMethod =
      getMappedValueFromMapping(
        row,
        mapping,
        "paymentMethod"
      );

    const title =
      getMappedValueFromMapping(
        row,
        mapping,
        "title"
      );

    const note =
      getMappedValueFromMapping(
        row,
        mapping,
        "note"
      );

    return {
      id: `import-${index}-${Date.now()}`,

      rowNumber: index + 2,

      date,

      type,

      amount,

      paymentMethod,

      title,

      note,

      /*
      | Category is intentionally empty.
      |
      | The user selects this from Pennywise categories.
      */

      category: "",

      /*
      | Preserve original CSV row for debugging.
      */

      originalRow: row,

      /*
      | Errors specific to this transaction.
      */

      errors: [],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC PROCESSING
  |--------------------------------------------------------------------------
  */

  function processCsvAutomatically() {
    setError("");
    setProcessingError("");
    setProcessingErrors([]);

    if (!selectedBank) {
      setError(
        "Please select your bank first."
      );
      return;
    }

    if (!csvHeaders.length) {
      setError(
        "Please read the CSV file first."
      );
      return;
    }

    const profile =
      BANK_PROFILES[selectedBank];

    if (!profile) {
      setError(
        "Unable to identify the selected bank."
      );
      return;
    }

    /*
    | Automatically determine which CSV columns
    | correspond to Pennywise fields.
    */

    const mapping =
      automaticallyMapColumns(
        csvHeaders,
        profile
      );

    setColumnMapping(mapping);

    /*
    |--------------------------------------------------------------------------
    | Check essential columns
    |--------------------------------------------------------------------------
    |
    | Date and amount need a CSV column.
    |
    | Type is special:
    | It can either have its own column OR be derived
    | from a signed amount.
    |
    */

    const missingColumns = [];

    if (!mapping.date) {
      missingColumns.push("Date");
    }

    if (!mapping.amount) {
      missingColumns.push("Amount");
    }

    if (missingColumns.length > 0) {
      setProcessingError(
        `Pennywise cannot safely process this CSV because ${missingColumns.join(
          " and "
        )} could not be identified.`
      );

      setProcessingErrors([
        `Missing required CSV column: ${missingColumns.join(
          ", "
        )}`,
      ]);

      setNormalizedRows([]);
      setCurrentStep(4);

      return;
    }

    /*
    | Parse the complete CSV again.
    */

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,

      complete: (results) => {
        try {
          const rows = results.data || [];

          const cleanedRows =
            rows.filter((row) =>
              Object.values(row).some(
                (value) =>
                  String(
                    value ?? ""
                  ).trim() !== ""
              )
            );

          const normalized =
            cleanedRows.map(
              (row, index) =>
                normalizeRow(
                  row,
                  index,
                  mapping
                )
            );

          /*
          |--------------------------------------------------------------------------
          | Validate every transaction
          |--------------------------------------------------------------------------
          */

          const rowsWithErrors =
            normalized
              .map((row) => {
                const errors = [];

                if (!row.date) {
                  errors.push(
                    "Date could not be determined"
                  );
                }

                if (row.amount === null) {
                  errors.push(
                    "Amount could not be determined"
                  );
                }

                if (!row.type) {
                  errors.push(
                    "Income/Expense type could not be determined"
                  );
                }

                return {
                  ...row,
                  errors,
                };
              });

          const invalidRows =
            rowsWithErrors.filter(
              (row) =>
                row.errors.length > 0
            );

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | If ANY required transaction information is unsafe,
          | we DO NOT allow the user to continue.
          |
          | We don't make the user manually edit Type/Amount/Date.
          |
          | Instead we tell them the CSV cannot be safely processed
          | and they should upload another bank CSV.
          |
          */

          if (invalidRows.length > 0) {
            setNormalizedRows(
              rowsWithErrors
            );

            setProcessingErrors(
              invalidRows
                .slice(0, 10)
                .map(
                  (row) =>
                    `Row ${row.rowNumber}: ${row.errors.join(
                      ", "
                    )}`
                )
            );

            setProcessingError(
              `${invalidRows.length} transaction${
                invalidRows.length !== 1
                  ? "s"
                  : ""
              } could not be safely understood.`
            );

            setCurrentStep(4);

            return;
          }

          /*
          | Everything required was understood.
          */

          setNormalizedRows(
            rowsWithErrors
          );

          setProcessingError("");
          setProcessingErrors([]);

          setCurrentStep(5);
        } catch (err) {
          console.error(
            "Automatic processing error:",
            err
          );

          setProcessingError(
            "Pennywise could not safely process this CSV. Please upload another CSV file."
          );

          setProcessingErrors([
            err?.message ||
              "Unknown CSV processing error.",
          ]);

          setCurrentStep(4);
        }
      },

      error: (parseError) => {
        console.error(
          "CSV processing error:",
          parseError
        );

        setProcessingError(
          "Pennywise could not read this CSV safely. Please upload another CSV file."
        );

        setProcessingErrors([
          parseError?.message ||
            "CSV parsing failed.",
        ]);

        setCurrentStep(4);
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY SELECTION
  |--------------------------------------------------------------------------
  */

  function handleCategoryChange(
    rowId,
    categoryId
  ) {
    setNormalizedRows(
      (previousRows) =>
        previousRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                category: categoryId,
              }
            : row
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY NAME
  |--------------------------------------------------------------------------
  */

  function getCategoryName(category) {
    if (!category) {
      return "";
    }

    return (
      category.name ||
      category.title ||
      ""
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY ID
  |--------------------------------------------------------------------------
  */

  function getCategoryId(category) {
    if (!category) {
      return "";
    }

    return (
      category._id ||
      category.id ||
      ""
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADD CATEGORY
  |--------------------------------------------------------------------------
  |
  | We keep the same "Add Category" route/flow concept.
  |
  | For now we navigate to Transactions with the add-category
  | flow rather than creating a second category system.
  |
  */

  function handleAddCategory() {
    navigate(
      "/transactions?addCategory=true"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY VALIDATION
  |--------------------------------------------------------------------------
  */

  const rowsWithoutCategory =
    normalizedRows.filter(
      (row) => !row.category
    );

  /*
  |--------------------------------------------------------------------------
  | VALID / INVALID ROWS
  |--------------------------------------------------------------------------
  */

  const validRows =
    normalizedRows.filter(
      (row) =>
        row.date &&
        row.type &&
        row.amount !== null
    );

  /*
  |--------------------------------------------------------------------------
  | DUPLICATE KEY
  |--------------------------------------------------------------------------
  |
  | IMPORTANT DUPLICATE RULE:
  |
  | Two transactions are duplicates only when ALL
  | identifying transaction values match.
  |
  | Amount is included.
  |
  | Therefore:
  |
  | Same date
  | Same type
  | Same category
  | Same payment method
  | Same description
  | Same note
  | DIFFERENT amount
  |
  | => NOT a duplicate.
  |
  */

  function createDuplicateKey(row) {
    return [
      row.date,
      row.type,
      row.amount,
      row.category,
      row.paymentMethod,
      row.title,
      row.note,
    ]
      .map((value) =>
        String(value ?? "")
          .trim()
          .toLowerCase()
      )
      .join("|");
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK DUPLICATES
  |--------------------------------------------------------------------------
  |
  | This stage currently checks duplicates inside the imported CSV.
  |
  | The next backend implementation will compare the same key
  | against existing Pennywise transactions.
  |
  */

  function checkDuplicates() {
    setError("");

    if (rowsWithoutCategory.length > 0) {
      setError(
        `Please select a category for all transactions before checking duplicates.`
      );

      return;
    }

    const seen = new Map();
    const duplicates = [];

    normalizedRows.forEach(
      (row) => {
        const key =
          createDuplicateKey(row);

        if (seen.has(key)) {
          duplicates.push({
            ...row,
            duplicateOf:
              seen.get(key),
          });
        } else {
          seen.set(
            key,
            row
          );
        }
      }
    );

    setDuplicateRows(
      duplicates
    );

    setDuplicateCheckComplete(
      true
    );

    setCurrentStep(6);
  }

  /*
  |--------------------------------------------------------------------------
  | RESET / UPLOAD NEW FILE
  |--------------------------------------------------------------------------
  */

  function uploadNewFile() {
    resetImportState();
    setCurrentStep(2);

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }

  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const steps = [
    {
      number: 1,
      label: "Select Bank",
    },
    {
      number: 2,
      label: "Upload CSV",
    },
    {
      number: 3,
      label: "Preview",
    },
    {
      number: 4,
      label: "Automatic Processing",
    },
    {
      number: 5,
      label: "Review",
    },
    {
      number: 6,
      label: "Duplicate Check",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="bank-import-page">
      {/* HEADER */}

      <header className="bank-import-header">
        <button
          type="button"
          className="bank-import-back-button"
          onClick={() =>
            navigate("/transactions")
          }
        >
          <ArrowLeft size={17} />
          Back to Transactions
        </button>

        <span className="bank-import-label">
          DATA IMPORT
        </span>

        <h1>
          Import Bank Transactions
        </h1>

        <p>
          Upload your bank transaction CSV
          and prepare it for Pennywise.
        </p>
      </header>

      {/* PROGRESS */}

      <div className="bank-import-progress">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`bank-import-progress-item ${
              currentStep >= step.number
                ? "active"
                : ""
            }`}
          >
            <div className="bank-import-progress-step">
              {currentStep >
              step.number ? (
                <CheckCircle2
                  size={16}
                />
              ) : (
                step.number
              )}
            </div>

            <span>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* MAIN CARD */}

      <section className="bank-import-card">
        {/* ==================================================
            STEP 1 — SELECT BANK
            ================================================== */}

        {currentStep === 1 && (
          <div>
            <div className="bank-import-card-header">
              <div className="bank-import-icon">
                <Building2 size={21} />
              </div>

              <div>
                <span className="bank-import-small-label">
                  STEP 1
                </span>

                <h2>
                  Which bank is this CSV from?
                </h2>

                <p>
                  Select your bank so Pennywise
                  can automatically understand
                  its CSV format.
                </p>
              </div>
            </div>

            <div className="bank-import-bank-grid">
              {Object.values(
                BANK_PROFILES
              ).map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  className="bank-import-bank-option"
                  onClick={() =>
                    handleBankSelect(
                      bank.id
                    )
                  }
                >
                  <div className="bank-import-bank-icon">
                    <Building2
                      size={22}
                    />
                  </div>

                  <div>
                    <strong>
                      {bank.name}
                    </strong>

                    <span>
                      {bank.shortName}
                    </span>
                  </div>

                  <ArrowRight
                    size={17}
                  />
                </button>
              ))}
            </div>

            <div className="bank-import-info">
              <Sparkles size={17} />

              <div>
                <strong>
                  Why do we ask for your bank?
                </strong>

                <p>
                  Different banks use different
                  CSV formats. Selecting the bank
                  lets Pennywise automatically
                  understand the transaction data
                  without asking you to manually map
                  every column.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 2 — UPLOAD
            ================================================== */}

        {currentStep === 2 && (
          <div>
            <div className="bank-import-card-header">
              <div className="bank-import-icon">
                <Upload size={21} />
              </div>

              <div>
                <span className="bank-import-small-label">
                  STEP 2
                </span>

                <h2>
                  Upload your CSV
                </h2>

                <p>
                  Upload the CSV downloaded
                  from{" "}
                  <strong>
                    {
                      BANK_PROFILES[
                        selectedBank
                      ]?.name
                    }
                  </strong>
                  .
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={
                handleInputChange
              }
              hidden
            />

            {!selectedFile && (
              <div
                className={`bank-import-dropzone ${
                  isDragging
                    ? "dragging"
                    : ""
                }`}
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                onClick={
                  openFilePicker
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) {
                    openFilePicker();
                  }
                }}
              >
                <div className="bank-import-upload-icon">
                  <Upload size={26} />
                </div>

                <h3>
                  Drop your CSV file here
                </h3>

                <p>
                  or click to browse
                  from your computer
                </p>

                <span>
                  CSV files only ·
                  Maximum 10 MB
                </span>
              </div>
            )}

            {selectedFile && (
              <div className="bank-import-file">
                <div className="bank-import-file-left">
                  <div className="bank-import-file-icon">
                    <FileText
                      size={21}
                    />
                  </div>

                  <div className="bank-import-file-info">
                    <strong>
                      {
                        selectedFile.name
                      }
                    </strong>

                    <span>
                      {formatFileSize(
                        selectedFile.size
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="bank-import-remove"
                  onClick={
                    removeFile
                  }
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {error && (
              <div className="bank-import-error">
                <AlertCircle
                  size={17}
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            <div className="bank-import-info">
              <FileText size={17} />

              <div>
                <strong>
                  Your original CSV stays unchanged.
                </strong>

                <p>
                  Pennywise reads the CSV locally
                  and prepares the transaction data
                  before anything is added to your
                  account.
                </p>
              </div>
            </div>

            <div className="bank-import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCurrentStep(1)
                }
                disabled={readingCsv}
              >
                <ArrowLeft size={17} />
                Change Bank
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    readCsvFile
                  }
                  disabled={readingCsv}
                >
                  {readingCsv
                    ? "Reading CSV..."
                    : "Read CSV"}

                  {!readingCsv && (
                    <ArrowRight
                      size={17}
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 3 — PREVIEW
            ================================================== */}

        {currentStep === 3 && (
          <div className="bank-import-preview">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 3
                </span>

                <h2>
                  CSV detected successfully
                </h2>

                <p>
                  Pennywise found{" "}
                  <strong>
                    {csvRowCount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>{" "}
                  transaction records and{" "}
                  <strong>
                    {csvHeaders.length}
                  </strong>{" "}
                  columns.
                </p>
              </div>

              <CheckCircle2
                size={25}
                className="bank-import-success-icon"
              />
            </div>

            <div className="bank-import-detected-file">
              <FileText size={18} />

              <div>
                <strong>
                  {selectedFile?.name}
                </strong>

                <span>
                  {formatFileSize(
                    selectedFile?.size ||
                      0
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={
                  removeFile
                }
                title="Remove file"
              >
                <X size={17} />
              </button>
            </div>

            <div className="bank-import-columns">
              <h3>
                Detected Columns
              </h3>

              <div className="bank-import-column-list">
                {csvHeaders.map(
                  (header) => (
                    <span
                      key={header}
                      className="bank-import-column"
                    >
                      {header}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="bank-import-table-section">
              <h3>
                Transaction Preview
              </h3>

              <div className="bank-import-table-wrapper">
                <table className="bank-import-table">
                  <thead>
                    <tr>
                      {csvHeaders.map(
                        (header) => (
                          <th
                            key={
                              header
                            }
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {csvRows.map(
                      (
                        row,
                        rowIndex
                      ) => (
                        <tr
                          key={
                            rowIndex
                          }
                        >
                          {csvHeaders.map(
                            (
                              header
                            ) => (
                              <td
                                key={
                                  header
                                }
                              >
                                {row[
                                  header
                                ] ||
                                  "—"}
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {csvRowCount > 10 && (
                <p className="bank-import-preview-note">
                  Showing the first 10
                  transactions out of{" "}
                  {csvRowCount.toLocaleString(
                    "en-IN"
                  )}
                  .
                </p>
              )}
            </div>

            {error && (
              <div className="bank-import-error">
                <AlertCircle size={17} />

                <span>
                  {error}
                </span>
              </div>
            )}

            <div className="bank-import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCurrentStep(2)
                }
              >
                <ArrowLeft
                  size={17}
                />
                Back
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  processCsvAutomatically
                }
              >
                Process Automatically
                <Sparkles
                  size={17}
                />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 4 — AUTOMATIC PROCESSING ERROR
            ================================================== */}

        {currentStep === 4 && (
          <div className="bank-import-mapping">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 4
                </span>

                <h2>
                  Automatic processing
                </h2>

                <p>
                  Pennywise used the selected{" "}
                  <strong>
                    {
                      BANK_PROFILES[
                        selectedBank
                      ]?.shortName
                    }
                  </strong>{" "}
                  bank profile to understand
                  the CSV.
                </p>
              </div>

              <div className="bank-import-mapping-icon">
                <Sparkles size={25} />
              </div>
            </div>

            {processingError && (
              <div className="bank-import-error">
                <AlertCircle
                  size={19}
                />

                <div>
                  <strong>
                    Pennywise cannot safely
                    process this file.
                  </strong>

                  <p>
                    {processingError}
                  </p>
                </div>
              </div>
            )}

            {processingErrors.length >
              0 && (
              <div className="bank-import-processing-errors">
                <h3>
                  Information Pennywise
                  could not understand
                </h3>

                <ul>
                  {processingErrors.map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="bank-import-info">
              <FileText size={17} />

              <div>
                <strong>
                  We will not guess your
                  financial data.
                </strong>

                <p>
                  Date, amount and
                  income/expense type must
                  be understood safely.
                  If Pennywise cannot determine
                  them, the import is stopped
                  instead of creating incorrect
                  transactions.
                </p>
              </div>
            </div>

            <div className="bank-import-info">
              <RefreshCw size={17} />

              <div>
                <strong>
                  Recommended action
                </strong>

                <p>
                  Download the transaction
                  statement again in CSV format
                  from your bank and upload that
                  file.
                </p>
              </div>
            </div>

            <div className="bank-import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCurrentStep(3)
                }
              >
                <ArrowLeft
                  size={17}
                />
                Back to Preview
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  uploadNewFile
                }
              >
                Upload Another CSV
                <Upload size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 5 — REVIEW
            ================================================== */}

        {currentStep === 5 && (
          <div className="bank-import-review">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 5
                </span>

                <h2>
                  Review your transactions
                </h2>

                <p>
                  Pennywise automatically
                  prepared the bank transactions.
                  Select a category where required.
                </p>
              </div>

              <CheckCircle2
                size={25}
                className="bank-import-success-icon"
              />
            </div>

            <div className="bank-import-review-summary">
              <div>
                <span>
                  Total records
                </span>

                <strong>
                  {
                    normalizedRows.length
                  }
                </strong>
              </div>

              <div>
                <span>
                  Ready to import
                </span>

                <strong>
                  {
                    rowsWithoutCategory.length ===
                    0
                      ? validRows.length
                      : 0
                  }
                </strong>
              </div>

              <div>
                <span>
                  Need category
                </span>

                <strong>
                  {
                    rowsWithoutCategory.length
                  }
                </strong>
              </div>
            </div>

            <div className="bank-import-info">
              <Sparkles size={17} />

              <div>
                <strong>
                  Only Category needs your input.
                </strong>

                <p>
                  Date, type, amount, payment
                  method, description and notes
                  are handled automatically from
                  your bank CSV.
                </p>
              </div>
            </div>

            <div className="bank-import-category-toolbar">
              <div>
                <strong>
                  Imported Transactions
                </strong>

                <span>
                  Choose the category for
                  each transaction.
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  handleAddCategory
                }
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>

            {loadingCategories && (
              <div className="bank-import-info">
                <RefreshCw
                  size={17}
                />

                <div>
                  <strong>
                    Loading categories...
                  </strong>

                  <p>
                    Pennywise is loading
                    your existing categories.
                  </p>
                </div>
              </div>
            )}

            {!loadingCategories &&
              categories.length === 0 && (
                <div className="bank-import-error">
                  <AlertCircle
                    size={17}
                  />

                  <div>
                    <strong>
                      No categories were found.
                    </strong>

                    <p>
                      Please create a category
                      before importing transactions.
                    </p>
                  </div>
                </div>
              )}

            <div className="bank-import-table-section">
              <h3>
                Imported Transactions
              </h3>

              <div className="bank-import-table-wrapper">
                <table className="bank-import-table">
                  <thead>
                    <tr>
                      <th>
                        Category
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Payment Method
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {normalizedRows
                      .slice(0, 50)
                      .map((row) => (
                        <tr
                          key={
                            row.id
                          }
                        >
                          <td>
                            <select
                              value={
                                row.category
                              }
                              onChange={(
                                event
                              ) =>
                                handleCategoryChange(
                                  row.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className={
                                !row.category
                                  ? "bank-import-category-select missing"
                                  : "bank-import-category-select"
                              }
                            >
                              <option value="">
                                Select Category
                              </option>

                              {categories
                                .filter(
                                  (
                                    category
                                  ) => {
                                    /*
                                    | If the API returns category type,
                                    | show categories appropriate for
                                    | this transaction.
                                    |
                                    | If type is not present on the
                                    | category object, show it.
                                    */

                                    const categoryType =
                                      String(
                                        category?.type ??
                                          ""
                                      )
                                        .trim()
                                        .toLowerCase();

                                    if (
                                      !categoryType
                                    ) {
                                      return true;
                                    }

                                    return (
                                      categoryType ===
                                      row.type
                                    );
                                  }
                                )
                                .map(
                                  (
                                    category
                                  ) => (
                                    <option
                                      key={getCategoryId(
                                        category
                                      )}
                                      value={getCategoryId(
                                        category
                                      )}
                                    >
                                      {getCategoryName(
                                        category
                                      )}
                                    </option>
                                  )
                                )}

                              <option value="__add_category__">
                                + Add Category
                              </option>
                            </select>
                          </td>

                          <td>
                            <span
                              className={`bank-import-type ${
                                row.type
                              }`}
                            >
                              {row.type ===
                              "income"
                                ? "Income"
                                : "Expense"}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {Number(
                                row.amount
                              ).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </strong>
                          </td>

                          <td>
                            {row.paymentMethod ||
                              "—"}
                          </td>

                          <td>
                            {row.date ||
                              "—"}
                          </td>

                          <td>
                            {row.title ||
                              "—"}
                          </td>

                          <td>
                            {row.note ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {normalizedRows.length >
                50 && (
                <p className="bank-import-preview-note">
                  Showing the first 50
                  transactions out of{" "}
                  {
                    normalizedRows.length
                  }
                  .
                </p>
              )}
            </div>

            {rowsWithoutCategory.length >
              0 && (
              <div className="bank-import-error">
                <AlertCircle
                  size={17}
                />

                <span>
                  Please select a category
                  for all{" "}
                  {
                    rowsWithoutCategory.length
                  }{" "}
                  transaction
                  {rowsWithoutCategory.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  before continuing.
                </span>
              </div>
            )}

            {error && (
              <div className="bank-import-error">
                <AlertCircle
                  size={17}
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            <div className="bank-import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCurrentStep(3)
                }
              >
                <ArrowLeft
                  size={17}
                />
                Back to Preview
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={
                  rowsWithoutCategory.length >
                  0
                }
                onClick={
                  checkDuplicates
                }
              >
                Continue to Duplicate Check
                <RefreshCw
                  size={17}
                />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            STEP 6 — DUPLICATE CHECK
            ================================================== */}

        {currentStep === 6 && (
          <div className="bank-import-review">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 6
                </span>

                <h2>
                  Duplicate check
                </h2>

                <p>
                  Pennywise checked the imported
                  transactions using the complete
                  transaction details.
                </p>
              </div>

              {duplicateRows.length ===
              0 ? (
                <CheckCircle2
                  size={25}
                  className="bank-import-success-icon"
                />
              ) : (
                <AlertCircle
                  size={25}
                />
              )}
            </div>

            {duplicateRows.length ===
            0 ? (
              <>
                <div className="bank-import-info">
                  <CheckCircle2
                    size={17}
                  />

                  <div>
                    <strong>
                      No duplicate transactions
                      were found in this import.
                    </strong>

                    <p>
                      The imported transactions
                      have different transaction
                      signatures.
                    </p>
                  </div>
                </div>

                <div className="bank-import-info">
                  <Sparkles size={17} />

                  <div>
                    <strong>
                      Important duplicate rule
                    </strong>

                    <p>
                      Amount is part of the
                      duplicate check. If the
                      date, category, payment
                      method, description and
                      other details are the same
                      but the amount is different,
                      Pennywise treats them as
                      different transactions.
                    </p>
                  </div>
                </div>

                <div className="bank-import-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setCurrentStep(5)
                    }
                  >
                    <ArrowLeft
                      size={17}
                    />
                    Back to Review
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      setError(
                        "Final import will be connected here next. No transactions have been added yet."
                      )
                    }
                  >
                    Continue to Final Import
                    <ArrowRight
                      size={17}
                    />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bank-import-error">
                  <AlertCircle
                    size={18}
                  />

                  <div>
                    <strong>
                      {
                        duplicateRows.length
                      } duplicate transaction
                      {
                        duplicateRows.length !==
                        1
                          ? "s"
                          : ""
                      }{" "}
                      found.
                    </strong>

                    <p>
                      These transactions have
                      the same date, type, amount,
                      category, payment method,
                      description and notes.
                    </p>
                  </div>
                </div>

                <div className="bank-import-table-section">
                  <h3>
                    Duplicate Transactions
                  </h3>

                  <div className="bank-import-table-wrapper">
                    <table className="bank-import-table">
                      <thead>
                        <tr>
                          <th>
                            Date
                          </th>

                          <th>
                            Type
                          </th>

                          <th>
                            Amount
                          </th>

                          <th>
                            Category
                          </th>

                          <th>
                            Payment Method
                          </th>

                          <th>
                            Description
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {duplicateRows.map(
                          (row) => (
                            <tr
                              key={
                                row.id
                              }
                            >
                              <td>
                                {
                                  row.date
                                }
                              </td>

                              <td>
                                {
                                  row.type
                                }
                              </td>

                              <td>
                                {Number(
                                  row.amount
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td>
                                {
                                  categories.find(
                                    (
                                      category
                                    ) =>
                                      getCategoryId(
                                        category
                                      ) ===
                                      row.category
                                  )
                                    ? getCategoryName(
                                        categories.find(
                                          (
                                            category
                                          ) =>
                                            getCategoryId(
                                              category
                                            ) ===
                                            row.category
                                        )
                                      )
                                    : "—"
                                }
                              </td>

                              <td>
                                {
                                  row.paymentMethod ||
                                  "—"
                                }
                              </td>

                              <td>
                                {
                                  row.title ||
                                  "—"
                                }
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bank-import-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setCurrentStep(5)
                    }
                  >
                    <ArrowLeft
                      size={17}
                    />
                    Back to Review
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      setError(
                        "Duplicate resolution will be implemented before the final import. No transactions have been added yet."
                      )
                    }
                  >
                    Review Duplicates
                    <RefreshCw
                      size={17}
                    />
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="bank-import-error">
                <AlertCircle
                  size={17}
                />

                <span>
                  {error}
                </span>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default BankImport;

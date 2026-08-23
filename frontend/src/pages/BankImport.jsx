import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
      note: ["notes", "note", "comments", "remark", "remarks"],
    },
  },

  hdfc: {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",
    mapping: {
      date: ["date", "transaction date", "txn date", "value date"],
      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],
      amount: ["amount", "transaction amount", "txn amount", "value"],
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
      note: ["notes", "note", "comments", "remark", "remarks"],
    },
  },

  icici: {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",
    mapping: {
      date: ["date", "transaction date", "txn date", "value date"],
      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],
      amount: ["amount", "transaction amount", "txn amount", "value"],
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
      note: ["notes", "note", "comments", "remark", "remarks"],
    },
  },

  axis: {
    id: "axis",
    name: "Axis Bank",
    shortName: "Axis",
    mapping: {
      date: ["date", "transaction date", "txn date", "value date"],
      type: [
        "type",
        "transaction type",
        "cr/dr",
        "dr/cr",
        "credit/debit",
        "debit/credit",
      ],
      amount: ["amount", "transaction amount", "txn amount", "value"],
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
      note: ["notes", "note", "comments", "remark", "remarks"],
    },
  },

  other: {
    id: "other",
    name: "Other / Unknown Bank",
    shortName: "Other",
    mapping: {
      date: ["date", "transaction date", "txn date", "value date"],
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
      note: ["notes", "note", "comments", "remark", "remarks"],
    },
  },
};

const EMPTY_MAPPING = {
  date: "",
  type: "",
  amount: "",
  creditAmount: "",
  debitAmount: "",
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
| AUTOMATIC COLUMN MAPPING
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

  Object.entries(bankProfile.mapping).forEach(([field, aliases]) => {
    const normalizedAliases = aliases.map(normalizeHeader);

    const match = normalizedHeaders.find((header) =>
      normalizedAliases.includes(header.normalized),
    );

    if (match) {
      mapping[field] = match.original;
    }
  });

  const findHeader = (aliases) => {
    const normalizedAliases = aliases.map(normalizeHeader);

    const match = normalizedHeaders.find((header) =>
      normalizedAliases.includes(header.normalized),
    );

    return match?.original || "";
  };

  mapping.creditAmount = findHeader([
    "credit",
    "credit amount",
    "credit_amt",
    "credit amt",
    "cr amount",
    "cr amt",
    "credited amount",
  ]);

  mapping.debitAmount = findHeader([
    "debit",
    "debit amount",
    "debit_amt",
    "debit amt",
    "dr amount",
    "dr amt",
    "debited amount",
  ]);

  return mapping;
}

/*
|--------------------------------------------------------------------------
| BANK IMPORT COMPONENT
|--------------------------------------------------------------------------
*/

function BankImport() {
  const navigate = useNavigate();
  const location = useLocation();

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
  | PROCESSING
  |--------------------------------------------------------------------------
  */

  const [columnMapping, setColumnMapping] = useState(EMPTY_MAPPING);
  const [normalizedRows, setNormalizedRows] = useState([]);
  const [processingError, setProcessingError] = useState("");
  const [processingErrors, setProcessingErrors] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | CATEGORIES
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY RETURN FLOW
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | These states MUST be inside the component.
  |
  */

  const [addingCategoryForRow, setAddingCategoryForRow] = useState(null);
  const [categoryReturnHandled, setCategoryReturnHandled] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | DUPLICATES
  |--------------------------------------------------------------------------
  */

  const [duplicateRows, setDuplicateRows] = useState([]);
  const [duplicateCheckComplete, setDuplicateCheckComplete] = useState(false);

  const [duplicateSummary, setDuplicateSummary] = useState({
    total: 0,
    duplicateCount: 0,
    newCount: 0,
  });

  /*
  |--------------------------------------------------------------------------
  | IMPORT
  |--------------------------------------------------------------------------
  */

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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
  */

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const response = await apiRequest("/categories");

      const loadedCategories = Array.isArray(response)
        ? response
        : response?.categories || response?.data || [];

      setCategories(loadedCategories);
    } catch (err) {
      console.error("Unable to load categories:", err);

      setCategories([]);

      setError(
        "Unable to load your Pennywise categories. Please refresh and try again.",
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RESTORE BANK IMPORT AFTER RETURNING FROM CATEGORIES
  |--------------------------------------------------------------------------
  |
  | Categories page navigates here with location.state:
  |
  |   { from: "bank-import", newCategoryId, rowId }
  |
  | This fires after:
  |
  | 1. Creating a category (newCategoryId is set)
  | 2. Cancelling the Add Category form (newCategoryId is null)
  |
  */

  useEffect(() => {
    const state = location.state;

    if (state?.from !== "bank-import" || categoryReturnHandled) {
      return;
    }

    setCategoryReturnHandled(true);

    const newCategoryId = state?.newCategoryId || null;
    const rowId = state?.rowId || null;

    async function restoreImport() {
      try {
        /*
        | Restore saved import state from sessionStorage.
        */

        const saved = sessionStorage.getItem(
          "pennywise_bank_import_state",
        );

        if (saved) {
          try {
            const parsed = JSON.parse(saved);

            if (parsed.selectedBank) {
              setSelectedBank(parsed.selectedBank);
            }

            if (Array.isArray(parsed.csvHeaders)) {
              setCsvHeaders(parsed.csvHeaders);
            }

            if (Array.isArray(parsed.csvRows)) {
              setCsvRows(parsed.csvRows);
            }

            if (typeof parsed.csvRowCount === "number") {
              setCsvRowCount(parsed.csvRowCount);
            }

            if (parsed.columnMapping) {
              setColumnMapping(parsed.columnMapping);
            }

            if (Array.isArray(parsed.normalizedRows)) {
              setNormalizedRows(parsed.normalizedRows);
            }

            if (parsed.selectedFileName) {
              setSelectedFile({
                name: parsed.selectedFileName,
                size: parsed.selectedFileSize || 0,
              });
            }
          } catch (parseErr) {
            console.error(
              "Unable to restore bank import state:",
              parseErr,
            );
          }

          sessionStorage.removeItem(
            "pennywise_bank_import_state",
          );
        }

        /*
        | If a new category was created, reload categories first.
        */

        await loadCategories();

        /*
        | If Categories returned a newly created category,
        | automatically assign it to the row that requested it.
        */

        if (newCategoryId && rowId) {
          setNormalizedRows((previousRows) =>
            previousRows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    category: newCategoryId,
                  }
                : row,
            ),
          );
        }

        /*
        | Always return to the Review step.
        */

        setCurrentStep(5);

        setAddingCategoryForRow(null);

        /*
        | Clear the location state so this doesn't re-trigger.
        */

        window.history.replaceState(
          {},
          "",
          location.pathname,
        );
      } catch (err) {
        console.error(
          "Unable to restore bank import after category flow:",
          err,
        );
      }
    }

    restoreImport();
  }, [location.state, categoryReturnHandled]);

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

    setDuplicateSummary({
      total: 0,
      duplicateCount: 0,
      newCount: 0,
    });

    setImporting(false);
    setImportResult(null);

    setAddingCategoryForRow(null);
    setCategoryReturnHandled(false);

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
      setError("CSV file must be smaller than 10 MB.");
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
  | FILE SIZE
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
              "The CSV file does not contain a readable header row.",
            );

            setReadingCsv(false);
            return;
          }

          const cleanedRows = rows.filter((row) =>
            Object.values(row).some(
              (value) => String(value ?? "").trim() !== "",
            ),
          );

          if (!cleanedRows.length) {
            setError(
              "The CSV file does not contain any usable transaction records.",
            );

            setReadingCsv(false);
            return;
          }

          setCsvHeaders(fields);
          setCsvRows(cleanedRows.slice(0, 10));
          setCsvRowCount(cleanedRows.length);

          setCurrentStep(3);
        } catch (err) {
          console.error("CSV processing error:", err);

          setError(
            "Something went wrong while reading the CSV file.",
          );
        } finally {
          setReadingCsv(false);
        }
      },

      error: (parseError) => {
        console.error("CSV parsing error:", parseError);

        setError(
          parseError?.message || "Unable to read the CSV file.",
        );

        setReadingCsv(false);
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | AMOUNT PARSING
  |--------------------------------------------------------------------------
  */

  function parseRawAmount(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const originalValue = String(value).trim();

    if (!originalValue) {
      return null;
    }

    let cleanedValue = originalValue
      .replace(/,/g, "")
      .replace(/[₹$€£]/g, "")
      .trim();

    const upper = cleanedValue.toUpperCase();

    let suffixType = "";

    if (/\bCR\.?$/.test(upper)) {
      suffixType = "income";

      cleanedValue = cleanedValue
        .replace(/\s*CR\.?$/i, "")
        .trim();
    } else if (/\bDR\.?$/.test(upper)) {
      suffixType = "expense";

      cleanedValue = cleanedValue
        .replace(/\s*DR\.?$/i, "")
        .trim();
    }

    const parenthesesNegative = /^\(.*\)$/.test(cleanedValue);

    cleanedValue = cleanedValue
      .replace(/^\(/, "")
      .replace(/\)$/, "")
      .trim();

    const amount = Number(cleanedValue);

    if (!Number.isFinite(amount)) {
      return null;
    }

    let sign = "positive";

    if (
      amount < 0 ||
      parenthesesNegative ||
      /^-/.test(cleanedValue)
    ) {
      sign = "negative";
    } else if (/^\+/.test(cleanedValue)) {
      sign = "positive";
    }

    return {
      amount: Math.abs(amount),
      sign,
      suffixType,
    };
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

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      return rawValue;
    }

    const ddmmyyyy = rawValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );

    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, "0");
      const month = ddmmyyyy[2].padStart(2, "0");
      const year = ddmmyyyy[3];

      return `${year}-${month}-${day}`;
    }

    const ddmmyyyyDash = rawValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    );

    if (ddmmyyyyDash) {
      const day = ddmmyyyyDash[1].padStart(2, "0");
      const month = ddmmyyyyDash[2].padStart(2, "0");
      const year = ddmmyyyyDash[3];

      return `${year}-${month}-${day}`;
    }

    const parsedDate = new Date(rawValue);

    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(
        parsedDate.getMonth() + 1,
      ).padStart(2, "0");
      const day = String(
        parsedDate.getDate(),
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | TYPE NORMALIZATION
  |--------------------------------------------------------------------------
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

    if (rawValue.includes("credit") || rawValue === "cr") {
      return "income";
    }

    if (rawValue.includes("debit") || rawValue === "dr") {
      return "expense";
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | COLUMN VALUE
  |--------------------------------------------------------------------------
  */

  function getColumnValue(row, column) {
    if (!column) {
      return "";
    }

    return String(row[column] ?? "").trim();
  }

  /*
  |--------------------------------------------------------------------------
  | DETERMINE FINANCIALS
  |--------------------------------------------------------------------------
  */

  function determineTransactionFinancials(row, mapping) {
    const explicitType = mapping.type
      ? normalizeType(
          getColumnValue(row, mapping.type),
        )
      : "";

    const rawAmount = mapping.amount
      ? getColumnValue(row, mapping.amount)
      : "";

    const parsedAmount = rawAmount
      ? parseRawAmount(rawAmount)
      : null;

    const creditRaw = getColumnValue(
      row,
      mapping.creditAmount,
    );

    const debitRaw = getColumnValue(
      row,
      mapping.debitAmount,
    );

    const credit = creditRaw
      ? parseRawAmount(creditRaw)
      : null;

    const debit = debitRaw
      ? parseRawAmount(debitRaw)
      : null;

    const hasCredit = credit && credit.amount > 0;
    const hasDebit = debit && debit.amount > 0;

    if (hasCredit && hasDebit) {
      return {
        type: "",
        amount: null,
        error:
          "Both Credit and Debit contain values, so the transaction type is ambiguous.",
      };
    }

    if (hasCredit) {
      if (
        explicitType &&
        explicitType !== "income"
      ) {
        return {
          type: "",
          amount: null,
          error:
            "Credit amount conflicts with the transaction type column.",
        };
      }

      return {
        type: "income",
        amount: credit.amount,
        error: "",
      };
    }

    if (hasDebit) {
      if (
        explicitType &&
        explicitType !== "expense"
      ) {
        return {
          type: "",
          amount: null,
          error:
            "Debit amount conflicts with the transaction type column.",
        };
      }

      return {
        type: "expense",
        amount: debit.amount,
        error: "",
      };
    }

    if (explicitType) {
      if (parsedAmount) {
        if (
          parsedAmount.suffixType &&
          parsedAmount.suffixType !== explicitType
        ) {
          return {
            type: "",
            amount: null,
            error:
              "The amount direction conflicts with the transaction type column.",
          };
        }

        if (
          parsedAmount.sign === "negative" &&
          explicitType !== "expense"
        ) {
          return {
            type: "",
            amount: null,
            error:
              "A negative amount conflicts with an Income transaction type.",
          };
        }

        if (
          parsedAmount.sign === "positive" &&
          explicitType === "expense" &&
          /^\+/.test(rawAmount)
        ) {
          return {
            type: "",
            amount: null,
            error:
              "A positive signed amount conflicts with an Expense transaction type.",
          };
        }

        return {
          type: explicitType,
          amount: parsedAmount.amount,
          error: "",
        };
      }

      return {
        type: explicitType,
        amount: null,
        error: "Amount could not be determined.",
      };
    }

    if (parsedAmount) {
      if (parsedAmount.suffixType) {
        return {
          type: parsedAmount.suffixType,
          amount: parsedAmount.amount,
          error: "",
        };
      }

      if (parsedAmount.sign === "negative") {
        return {
          type: "expense",
          amount: parsedAmount.amount,
          error: "",
        };
      }

      if (
        parsedAmount.sign === "positive" &&
        /^\+/.test(rawAmount)
      ) {
        return {
          type: "income",
          amount: parsedAmount.amount,
          error: "",
        };
      }

      return {
        type: "",
        amount: parsedAmount.amount,
        error:
          "The Amount is unsigned and no Credit/Debit or Type information was found.",
      };
    }

    return {
      type: "",
      amount: null,
      error:
        "Income/Expense type could not be determined from this CSV row.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE ROW
  |--------------------------------------------------------------------------
  */

  function normalizeRow(row, index, mapping) {
    const date = normalizeDate(
      getColumnValue(row, mapping.date),
    );

    const financials =
      determineTransactionFinancials(
        row,
        mapping,
      );

    const paymentMethod = getColumnValue(
      row,
      mapping.paymentMethod,
    );

    const title = getColumnValue(
      row,
      mapping.title,
    );

    const note = getColumnValue(
      row,
      mapping.note,
    );

    return {
      id: `import-${index}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      rowNumber: index + 2,

      date,

      type: financials.type,

      amount: financials.amount,

      paymentMethod,

      title,

      note,

      category: "",

      originalRow: row,

      errors: financials.error
        ? [financials.error]
        : [],
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
      setError("Please select your bank first.");
      return;
    }

    if (!csvHeaders.length) {
      setError("Please read the CSV file first.");
      return;
    }

    const profile =
      BANK_PROFILES[selectedBank];

    if (!profile) {
      setError(
        "Unable to identify the selected bank.",
      );
      return;
    }

    const mapping =
      automaticallyMapColumns(
        csvHeaders,
        profile,
      );

    setColumnMapping(mapping);

    const missingColumns = [];

    if (!mapping.date) {
      missingColumns.push("Date");
    }

    if (
      !mapping.amount &&
      !mapping.creditAmount &&
      !mapping.debitAmount
    ) {
      missingColumns.push(
        "Amount or Credit/Debit",
      );
    }

    if (missingColumns.length > 0) {
      setProcessingError(
        `Pennywise cannot safely process this CSV because ${missingColumns.join(
          " and ",
        )} could not be identified.`,
      );

      setProcessingErrors([
        `Missing required CSV column: ${missingColumns.join(
          ", ",
        )}`,
      ]);

      setNormalizedRows([]);
      setCurrentStep(4);

      return;
    }

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
                  String(value ?? "").trim() !== "",
              ),
            );

          const normalized =
            cleanedRows.map((row, index) =>
              normalizeRow(
                row,
                index,
                mapping,
              ),
            );

          const rowsWithErrors =
            normalized.map((row) => {
              const errors = Array.isArray(
                row.errors,
              )
                ? [...row.errors]
                : [];

              if (!row.date) {
                errors.push(
                  "Date could not be determined",
                );
              }

              if (row.amount === null) {
                errors.push(
                  "Amount could not be determined",
                );
              }

              if (
                !row.type &&
                !errors.some((item) =>
                  String(item)
                    .toLowerCase()
                    .includes("type"),
                )
              ) {
                errors.push(
                  "Income/Expense type could not be determined",
                );
              }

              return {
                ...row,
                errors: [
                  ...new Set(errors),
                ],
              };
            });

          const invalidRows =
            rowsWithErrors.filter(
              (row) =>
                row.errors.length > 0,
            );

          if (invalidRows.length > 0) {
            setNormalizedRows(
              rowsWithErrors,
            );

            setProcessingErrors(
              invalidRows
                .slice(0, 10)
                .map(
                  (row) =>
                    `Row ${row.rowNumber}: ${row.errors.join(
                      ", ",
                    )}`,
                ),
            );

            setProcessingError(
              `${invalidRows.length} transaction${
                invalidRows.length !== 1
                  ? "s"
                  : ""
              } could not be safely understood.`,
            );

            setCurrentStep(4);

            return;
          }

          setNormalizedRows(
            rowsWithErrors,
          );

          setProcessingError("");
          setProcessingErrors([]);

          setCurrentStep(5);
        } catch (err) {
          console.error(
            "Automatic processing error:",
            err,
          );

          setProcessingError(
            "Pennywise could not safely process this CSV. Please upload another CSV file.",
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
          parseError,
        );

        setProcessingError(
          "Pennywise could not read this CSV safely. Please upload another CSV file.",
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
    categoryId,
  ) {
    setNormalizedRows(
      (previousRows) =>
        previousRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                category: categoryId,
              }
            : row,
        ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY HELPERS
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
  | ADD CATEGORY FLOW
  |--------------------------------------------------------------------------
  |
  | This is the important part.
  |
  | Clicking Add Category:
  |
  | Bank Import
  |      ↓
  | Transactions
  |      ↓
  | Add Category form automatically opens
  |      ↓
  | User creates/cancels
  |      ↓
  | Bank Import
  |
  | rowId identifies exactly which imported row
  | requested the category.
  |
  */

  function handleAddCategory(rowId = null) {
    setAddingCategoryForRow(rowId);

    /*
    | Save the current import state to sessionStorage
    | so it survives the round-trip to the Categories page.
    | File objects cannot be serialized, so we store
    | the file name and size separately.
    */

    try {
      const stateToSave = {
        selectedBank,
        csvHeaders,
        csvRows,
        csvRowCount,
        columnMapping,
        normalizedRows,
        selectedFileName: selectedFile?.name || null,
        selectedFileSize: selectedFile?.size || 0,
      };

      sessionStorage.setItem(
        "pennywise_bank_import_state",
        JSON.stringify(stateToSave),
      );
    } catch (err) {
      console.error(
        "Unable to save bank import state:",
        err,
      );
    }

    navigate("/categories", {
      state: {
        from: "bank-import",
        rowId: rowId || null,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY VALIDATION
  |--------------------------------------------------------------------------
  */

  const rowsWithoutCategory =
    normalizedRows.filter(
      (row) => !row.category,
    );

  /*
  |--------------------------------------------------------------------------
  | VALID ROWS
  |--------------------------------------------------------------------------
  */

  const validRows =
    normalizedRows.filter(
      (row) =>
        row.date &&
        row.type &&
        row.amount !== null,
    );

  /*
  |--------------------------------------------------------------------------
  | CHECK DUPLICATES
  |--------------------------------------------------------------------------
  */

  async function checkDuplicates() {
    setError("");
    setImportResult(null);

    const invalidCategoryRows =
      normalizedRows.filter(
        (row) =>
          !row.category ||
          row.category ===
            "__add_category__",
      );

    if (invalidCategoryRows.length > 0) {
      setError(
        "Please select a real Pennywise category for every transaction before checking duplicates.",
      );

      return;
    }

    if (normalizedRows.length === 0) {
      setError(
        "There are no transactions to check.",
      );

      return;
    }

    try {
      const response =
        await apiRequest(
          "/transactions/import/check-duplicates",
          {
            method: "POST",

            body: JSON.stringify({
              transactions:
                normalizedRows.map(
                  (row) => ({
                    date: row.date,
                    type: row.type,
                    amount: row.amount,
                    category:
                      row.category,
                    paymentMethod:
                      row.paymentMethod ||
                      "Bank",
                    title:
                      row.title ||
                      "Imported Transaction",
                    note:
                      row.note || "",
                    importIndex:
                      row.rowNumber,
                  }),
                ),
            }),
          },
        );

      const checkedRows =
        Array.isArray(
          response?.transactions,
        )
          ? response.transactions
          : [];

      const updatedRows =
        normalizedRows.map(
          (row, index) => {
            const checked =
              checkedRows[index];

            return {
              ...row,
              isDuplicate: Boolean(
                checked?.isDuplicate,
              ),
              duplicateReason:
                checked?.duplicateReason ||
                null,
            };
          },
        );

      const duplicates =
        updatedRows.filter(
          (row) => row.isDuplicate,
        );

      setNormalizedRows(
        updatedRows,
      );

      setDuplicateRows(
        duplicates,
      );

      setDuplicateSummary({
        total:
          Number(response?.total) ||
          updatedRows.length,

        duplicateCount:
          Number(
            response?.duplicateCount,
          ) || duplicates.length,

        newCount:
          Number(response?.newCount) ||
          updatedRows.length -
            duplicates.length,
      });

      setDuplicateCheckComplete(
        true,
      );

      setCurrentStep(6);
    } catch (err) {
      console.error(
        "Duplicate check error:",
        err,
      );

      setError(
        err?.message ||
          "Unable to check duplicates against your Pennywise database.",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORT TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  async function importTransactions() {
    setError("");
    setImportResult(null);

    const invalidCategoryRows =
      normalizedRows.filter(
        (row) =>
          !row.category ||
          row.category ===
            "__add_category__",
      );

    if (invalidCategoryRows.length > 0) {
      setError(
        "Please select a real Pennywise category for every transaction before importing.",
      );

      return;
    }

    if (normalizedRows.length === 0) {
      setError(
        "There are no transactions to import.",
      );

      return;
    }

    setImporting(true);

    try {
      const response =
        await apiRequest(
          "/transactions/import",
          {
            method: "POST",

            body: JSON.stringify({
              transactions:
                normalizedRows.map(
                  (row) => ({
                    date: row.date,
                    type: row.type,
                    amount: row.amount,
                    category:
                      row.category,
                    paymentMethod:
                      row.paymentMethod ||
                      "Bank",
                    title:
                      row.title ||
                      "Imported Transaction",
                    note:
                      row.note || "",
                  }),
                ),
            }),
          },
        );

      setImportResult({
        success: true,

        insertedCount:
          Number(
            response?.insertedCount,
          ) ||
          Number(response?.count) ||
          0,

        skippedCount:
          Number(
            response?.skippedCount,
          ) || 0,

        message:
          response?.message ||
          "Transactions imported successfully.",
      });
    } catch (err) {
      console.error(
        "Transaction import error:",
        err,
      );

      const backendMessage =
        err?.message ||
        err?.response?.data
          ?.message ||
        err?.data?.message ||
        err?.error?.message;

      setError(
        backendMessage ||
          "Unable to import the transactions into Pennywise. Check the browser Network/Console for the server response.",
      );
    } finally {
      setImporting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPLOAD NEW FILE
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
                <CheckCircle2 size={16} />
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
        {/* STEP 1 */}

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
                  Which bank is this CSV
                  from?
                </h2>

                <p>
                  Select your bank so
                  Pennywise can automatically
                  understand its CSV format.
                </p>
              </div>
            </div>

            <div className="bank-import-bank-grid">
              {Object.values(
                BANK_PROFILES,
              ).map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  className="bank-import-bank-option"
                  onClick={() =>
                    handleBankSelect(
                      bank.id,
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
                  Why do we ask for your
                  bank?
                </strong>

                <p>
                  Different banks use
                  different CSV formats.
                  Selecting the bank lets
                  Pennywise automatically
                  understand the transaction
                  data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}

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
                onDrop={handleDrop}
                onClick={
                  openFilePicker
                }
                role="button"
                tabIndex={0}
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    openFilePicker();
                  }
                }}
              >
                <div className="bank-import-upload-icon">
                  <Upload size={26} />
                </div>

                <h3>
                  Drop your CSV file
                  here
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
                        selectedFile.size,
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
                  Your original CSV stays
                  unchanged.
                </strong>

                <p>
                  Pennywise reads the CSV
                  locally and prepares the
                  transaction data before
                  anything is added.
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
                  disabled={
                    readingCsv
                  }
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

        {/* STEP 3 */}

        {currentStep === 3 && (
          <div className="bank-import-preview">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 3
                </span>

                <h2>
                  CSV detected
                  successfully
                </h2>

                <p>
                  Pennywise found{" "}
                  <strong>
                    {csvRowCount.toLocaleString(
                      "en-IN",
                    )}
                  </strong>{" "}
                  transaction records
                  and{" "}
                  <strong>
                    {
                      csvHeaders.length
                    }
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
                      0,
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
                  ),
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
                          <th key={header}>
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {csvRows.map(
                      (
                        row,
                        rowIndex,
                      ) => (
                        <tr
                          key={
                            rowIndex
                          }
                        >
                          {csvHeaders.map(
                            (
                              header,
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
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {csvRowCount >
                10 && (
                <p className="bank-import-preview-note">
                  Showing the first
                  10 transactions
                  out of{" "}
                  {csvRowCount.toLocaleString(
                    "en-IN",
                  )}
                  .
                </p>
              )}
            </div>

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
                  setCurrentStep(2)
                }
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  processCsvAutomatically
                }
              >
                Process
                Automatically
                <Sparkles
                  size={17}
                />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}

        {currentStep === 4 && (
          <div className="bank-import-mapping">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 4
                </span>

                <h2>
                  Automatic
                  processing
                </h2>

                <p>
                  Pennywise used the
                  selected{" "}
                  <strong>
                    {
                      BANK_PROFILES[
                        selectedBank
                      ]?.shortName
                    }
                  </strong>{" "}
                  bank profile.
                </p>
              </div>

              <div className="bank-import-mapping-icon">
                <Sparkles
                  size={25}
                />
              </div>
            </div>

            {processingError && (
              <div className="bank-import-error">
                <AlertCircle
                  size={19}
                />

                <div>
                  <strong>
                    Pennywise cannot
                    safely process
                    this file.
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
                  Information
                  Pennywise could
                  not understand
                </h3>

                <ul>
                  {processingErrors.map(
                    (
                      item,
                      index,
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <div className="bank-import-info">
              <FileText size={17} />

              <div>
                <strong>
                  We will not guess
                  your financial data.
                </strong>

                <p>
                  Date, amount and
                  income/expense type
                  must be understood
                  safely.
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
                  Download the
                  transaction statement
                  again in CSV format
                  from your bank and
                  upload that file.
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
                <ArrowLeft size={17} />
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

        {/* STEP 5 */}

        {currentStep === 5 && (
          <div className="bank-import-review">
            <div className="bank-import-preview-header">
              <div>
                <span className="bank-import-small-label">
                  STEP 5
                </span>

                <h2>
                  Review your
                  transactions
                </h2>

                <p>
                  Pennywise automatically
                  prepared the bank
                  transactions. Select a
                  category where required.
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
                  {rowsWithoutCategory.length ===
                  0
                    ? validRows.length
                    : 0}
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
                  Only Category needs your
                  input.
                </strong>

                <p>
                  Date, type, amount,
                  payment method,
                  description and notes
                  are handled
                  automatically.
                </p>
              </div>
            </div>

            <div className="bank-import-category-toolbar">
              <div>
                <strong>
                  Imported Transactions
                </strong>

                <span>
                  Choose the category
                  for each transaction.
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  handleAddCategory(
                    null,
                  )
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
                    Loading
                    categories...
                  </strong>

                  <p>
                    Pennywise is loading
                    your existing
                    categories.
                  </p>
                </div>
              </div>
            )}

            {!loadingCategories &&
              categories.length ===
                0 && (
                <div className="bank-import-error">
                  <AlertCircle
                    size={17}
                  />

                  <div>
                    <strong>
                      No categories were
                      found.
                    </strong>

                    <p>
                      Please create a
                      category before
                      importing
                      transactions.
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
                      <th>Type</th>
                      <th>Amount</th>
                      <th>
                        Payment Method
                      </th>
                      <th>Date</th>
                      <th>
                        Description
                      </th>
                      <th>Notes</th>
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
                                event,
                              ) => {
                                const value =
                                  event
                                    .target
                                    .value;

                                if (
                                  value ===
                                  "__add_category__"
                                ) {
                                  handleAddCategory(
                                    row.id,
                                  );

                                  return;
                                }

                                handleCategoryChange(
                                  row.id,
                                  value,
                                );
                              }}
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
                                    category,
                                  ) => {
                                    const categoryType =
                                      String(
                                        category?.type ??
                                          "",
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
                                  },
                                )
                                .map(
                                  (
                                    category,
                                  ) => (
                                    <option
                                      key={getCategoryId(
                                        category,
                                      )}
                                      value={getCategoryId(
                                        category,
                                      )}
                                    >
                                      {getCategoryName(
                                        category,
                                      )}
                                    </option>
                                  ),
                                )}

                              <option value="__add_category__">
                                + Add Category
                              </option>
                            </select>
                          </td>

                          <td>
                            <span
                              className={`bank-import-type ${row.type}`}
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
                                row.amount,
                              ).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </strong>
                          </td>

                          <td>
                            {row.paymentMethod ||
                              "Bank"}
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
                <ArrowLeft size={17} />
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
                Continue to Duplicate
                Check
                <RefreshCw
                  size={17}
                />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6 */}

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
                  Pennywise checked the
                  imported transactions
                  against your existing
                  database.
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
              <div className="bank-import-info">
                <CheckCircle2
                  size={17}
                />

                <div>
                  <strong>
                    No duplicates were
                    found.
                  </strong>

                  <p>
                    All{" "}
                    {
                      duplicateSummary.newCount
                    }{" "}
                    transactions are
                    new and can be
                    imported.
                  </p>
                </div>
              </div>
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
                      }{" "}
                      duplicate
                      transaction
                      {duplicateRows.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      found.
                    </strong>

                    <p>
                      Duplicate
                      transactions will
                      be skipped.
                    </p>
                  </div>
                </div>

                <div className="bank-import-table-section">
                  <h3>
                    Duplicate
                    Transactions
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
                          <th>
                            Reason
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {duplicateRows.map(
                          (row) => {
                            const category =
                              categories.find(
                                (
                                  item,
                                ) =>
                                  getCategoryId(
                                    item,
                                  ) ===
                                  row.category,
                              );

                            return (
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
                                  {row.type ===
                                  "income"
                                    ? "Income"
                                    : "Expense"}
                                </td>

                                <td>
                                  {Number(
                                    row.amount,
                                  ).toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>

                                <td>
                                  {category
                                    ? getCategoryName(
                                        category,
                                      )
                                    : "—"}
                                </td>

                                <td>
                                  {row.paymentMethod ||
                                    "Bank"}
                                </td>

                                <td>
                                  {row.title ||
                                    "—"}
                                </td>

                                <td>
                                  {row.duplicateReason ||
                                    "Duplicate transaction"}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {importResult && (
              <div className="bank-import-info">
                <CheckCircle2
                  size={17}
                />

                <div>
                  <strong>
                    {
                      importResult.message
                    }
                  </strong>

                  <p>
                    Added{" "}
                    {
                      importResult.insertedCount
                    }{" "}
                    transaction
                    {importResult.insertedCount !==
                    1
                      ? "s"
                      : ""}
                    {importResult.skippedCount >
                    0
                      ? ` and skipped ${
                          importResult.skippedCount
                        } duplicate${
                          importResult.skippedCount !==
                          1
                            ? "s"
                            : ""
                        }.`
                      : "."}
                  </p>
                </div>
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
                  setCurrentStep(5)
                }
                disabled={importing}
              >
                <ArrowLeft size={17} />
                Back to Review
              </button>

              {!importResult ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    importTransactions
                  }
                  disabled={
                    importing
                  }
                >
                  {importing
                    ? "Importing..."
                    : duplicateSummary.newCount >
                      0
                    ? `Import ${
                        duplicateSummary.newCount
                      } New Transaction${
                        duplicateSummary.newCount !==
                        1
                          ? "s"
                          : ""
                      }`
                    : "Import Transactions"}

                  {!importing && (
                    <ArrowRight
                      size={17}
                    />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    window.dispatchEvent(
                      new Event(
                        "transactionsUpdated",
                      ),
                    );

                    navigate(
                      "/transactions",
                    );
                  }}
                >
                  View Transactions
                  <ArrowRight
                    size={17}
                  />
                </button>
              )}
            </div>

            {!importResult && (
              <div className="bank-import-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    uploadNewFile
                  }
                  disabled={
                    importing
                  }
                >
                  <Upload size={17} />
                  Upload Another CSV
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default BankImport;

import * as pdfjsLib from "pdfjs-dist";

// ------------------------------------------------------------
// PDF WORKER
// ------------------------------------------------------------

if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  } catch {
    // Worker configuration can differ between bundlers.
  }
}

// ------------------------------------------------------------
// FILE CHECK
// ------------------------------------------------------------

export function isPdfFile(file) {
  return (
    file instanceof File &&
    (file.type === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf"))
  );
}

// ------------------------------------------------------------
// NORMALIZE TEXT
// ------------------------------------------------------------

export function cleanText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHeader(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/[._:/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------
// NUMBER PARSING
// ------------------------------------------------------------

export function parseNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  let text = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/[₹$€£]/g, "");

  if (!text) {
    return null;
  }

  let negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    negative = true;
    text = text.slice(1, -1);
  }

  if (/^-/.test(text)) {
    negative = true;
    text = text.replace(/^-/, "");
  }

  // Strip DR/CR suffixes.
  text = text.replace(/\s*(DR|CR)\.?\s*$/i, "");

  text = text.replace(/,/g, "");

  const match = text.match(/^\d+(?:\.\d+)?$/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  if (!Number.isFinite(number)) {
    return null;
  }

  return negative ? -number : number;
}

// ------------------------------------------------------------
// DATE PARSING
// ------------------------------------------------------------

export const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

export function pad(value) {
  return String(value).padStart(2, "0");
}

export function toISODate(day, month, year) {
  let y = Number(year);

  if (y < 100) {
    y += y >= 50 ? 1900 : 2000;
  }

  const d = Number(day);
  const m = Number(month);

  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(y) ||
    d < 1 || d > 31 ||
    m < 1 || m > 12
  ) {
    return null;
  }

  const date = new Date(y, m - 1, d);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseDate(value, fallbackYear = new Date().getFullYear()) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  // DD/MM/YYYY
  let match = text.match(
    /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/,
  );

  if (match) {
    return toISODate(match[1], match[2], match[3]);
  }

  // YYYY/MM/DD
  match = text.match(
    /^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/,
  );

  if (match) {
    return toISODate(match[3], match[2], match[1]);
  }

  // DD-MMM-YYYY
  match = text.match(
    /^(\d{1,2})[-/.\s]+([A-Za-z]{3,9})[-/.\s]+(\d{2,4})$/,
  );

  if (match) {
    const month = MONTH_MAP[match[2].toLowerCase()];

    if (month) {
      return toISODate(match[1], month, match[3]);
    }
  }

  // MMM DD YYYY
  match = text.match(
    /^([A-Za-z]{3,9})[-/.\s]+(\d{1,2})[-/.\s]+(\d{2,4})$/,
  );

  if (match) {
    const month = MONTH_MAP[match[1].toLowerCase()];

    if (month) {
      return toISODate(match[2], month, match[3]);
    }
  }

  // DD MMM
  match = text.match(
    /^(\d{1,2})[-/.\s]+([A-Za-z]{3,9})$/,
  );

  if (match) {
    const month = MONTH_MAP[match[2].toLowerCase()];

    if (month) {
      return toISODate(match[1], month, fallbackYear);
    }
  }

  return null;
}

// ------------------------------------------------------------
// DATE DETECTION INSIDE TEXT
// ------------------------------------------------------------

export function findDate(text) {
  const value = cleanText(text);

  const patterns = [
    /\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/,
    /\b\d{4}[/.\-]\d{1,2}[/.\-]\d{1,2}\b/,
    /\b\d{1,2}[-/.\s]+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)[-/.\s]+\d{2,4}\b/i,
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)[-/.\s]+\d{1,2}[-/.\s]+\d{2,4}\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match) {
      return match[0];
    }
  }

  return null;
}

// ------------------------------------------------------------
// PDF TEXT EXTRACTION
// ------------------------------------------------------------

export async function extractPdfPages(file) {
  if (!file) {
    throw new Error("No PDF file selected.");
  }

  if (!isPdfFile(file)) {
    throw new Error("Please select a valid PDF file.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
  });

  const pdf = await loadingTask.promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({
      scale: 1,
    });

    const content = await page.getTextContent();

    const items = [];

    for (const item of content.items) {
      if (!item || typeof item.str !== "string") {
        continue;
      }

      const text = cleanText(item.str);

      if (!text) {
        continue;
      }

      const transform = item.transform || [];

      const x = Number(transform[4] || 0);
      const y = Number(transform[5] || 0);

      const width = Number(item.width || 0);
      const height = Number(item.height || 0);

      items.push({
        text,
        x,
        y,
        width,
        height,
        right: x + width,
      });
    }

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  return {
    numPages: pdf.numPages,
    pages,
  };
}

// ------------------------------------------------------------
// GROUP TEXT INTO VISUAL LINES
// ------------------------------------------------------------

export function groupItemsIntoLines(items, yTolerance = 4.5) {
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 4) {
      return b.y - a.y;
    }

    return a.x - b.x;
  });

  const lines = [];

  for (const item of sorted) {
    let line = null;

    for (const candidate of lines) {
      if (Math.abs(candidate.y - item.y) <= yTolerance) {
        line = candidate;
        break;
      }
    }

    if (!line) {
      line = {
        y: item.y,
        items: [],
      };

      lines.push(line);
    }

    line.items.push(item);
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);

    line.text = cleanText(
      line.items
        .map((item) => item.text)
        .join(" "),
    );

    line.minX =
      line.items.length > 0
        ? Math.min(...line.items.map((item) => item.x))
        : 0;

    line.maxX =
      line.items.length > 0
        ? Math.max(...line.items.map((item) => item.right))
        : 0;
  }

  lines.sort((a, b) => b.y - a.y);

  return lines;
}

// ------------------------------------------------------------
// CHECK NUMERIC TEXT
// ------------------------------------------------------------

/**
 * Returns true if the text looks like a monetary amount.
 * Rejects strings that look like identifiers (account numbers,
 * phone numbers, CIF, etc.) — these are typically long digit
 * sequences without a decimal point.
 */
export function looksLikeMoney(text) {
  const value = cleanText(text);

  if (!value) {
    return false;
  }

  const normalized = value
    .replace(/[₹$€£,\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/CR|DR/gi, "")
    .trim();

  if (!normalized) {
    return false;
  }

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return false;
  }

  // Reject identifier-like numbers: 13+ digits without decimal.
  const digitsOnly = normalized.replace(/^-/, "");
  if (!/\./.test(digitsOnly) && digitsOnly.length > 12) {
    return false;
  }

  return true;
}

/**
 * Returns true if the text looks like a numeric identifier
 * rather than a monetary amount. Used to prevent account numbers,
 * phone numbers, CIF numbers, etc. from being treated as amounts.
 */
export function looksLikeIdentifier(text) {
  const value = cleanText(text).replace(/[\s-]/g, "");

  // Pure digits, 8+ characters, no decimal → likely an identifier.
  if (/^\d{8,}$/.test(value)) {
    return true;
  }

  // Alphanumeric mix with 10+ chars → likely a reference/identifier.
  if (/^[A-Z0-9]{10,}$/i.test(value) && /\d/.test(value) && /[A-Z]/i.test(value)) {
    return true;
  }

  return false;
}

// ------------------------------------------------------------
// HEADER CLASSIFICATION
// ------------------------------------------------------------

export const HEADER_ALIASES = {
  date: [
    "date",
    "transaction date",
    "txn date",
    "value date",
    "posting date",
    "trans date",
    "txn dt",
    "val date",
  ],

  title: [
    "transaction remarks",
    "transaction remark",
    "transaction details",
    "transaction detail",
    "description",
    "narration",
    "remarks",
    "particulars",
    "details",
    "merchant",
    "transaction",
    "reference",
    "cheque details",
    "ref no cheque no",
    "chq no ref no",
  ],

  debit: [
    "withdrawal",
    "withdrawal amount",
    "debit",
    "debit amount",
    "withdrawal amount inr",
    "debit amount inr",
    "debit amt",
    "dr amount",
    "dr amt",
    "withdrawal amt",
  ],

  credit: [
    "deposit",
    "deposit amount",
    "credit",
    "credit amount",
    "deposit amount inr",
    "credit amount inr",
    "credit amt",
    "cr amount",
    "cr amt",
    "deposit amt",
  ],

  amount: [
    "amount",
    "transaction amount",
    "txn amount",
    "txn amt",
  ],

  balance: [
    "balance",
    "closing balance",
    "available balance",
    "balance inr",
    "running balance",
    "balance amt",
  ],
};

export function classifyHeader(text) {
  const normalized = normalizeHeader(text);

  for (const [type, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias)
      ) {
        return type;
      }
    }
  }

  return null;
}

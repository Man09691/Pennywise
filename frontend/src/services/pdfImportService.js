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

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value) {
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

function parseNumber(value) {
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

  text = text.replace(/,/g, "");

  const match = text.match(/\d+(?:\.\d+)?/);

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

const MONTH_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function toISODate(day, month, year) {
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
    d < 1 ||
    d > 31 ||
    m < 1 ||
    m > 12
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

function parseDate(value, fallbackYear = new Date().getFullYear()) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  // DD/MM/YYYY
  let match = text.match(
    /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/,
  );

  if (match) {
    return toISODate(match[1], match[2], match[3]);
  }

  // YYYY/MM/DD
  match = text.match(
    /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/,
  );

  if (match) {
    return toISODate(match[3], match[2], match[1]);
  }

  // DD-MMM-YYYY
  match = text.match(
    /^(\d{1,2})[-\/.\s]+([A-Za-z]{3,9})[-\/.\s]+(\d{2,4})$/,
  );

  if (match) {
    const month = MONTH_MAP[match[2].toLowerCase()];

    if (month) {
      return toISODate(match[1], month, match[3]);
    }
  }

  // MMM DD YYYY
  match = text.match(
    /^([A-Za-z]{3,9})[-\/.\s]+(\d{1,2})[-\/.\s]+(\d{2,4})$/,
  );

  if (match) {
    const month = MONTH_MAP[match[1].toLowerCase()];

    if (month) {
      return toISODate(match[2], month, match[3]);
    }
  }

  // DD MMM
  match = text.match(
    /^(\d{1,2})[-\/.\s]+([A-Za-z]{3,9})$/,
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

function findDate(text) {
  const value = cleanText(text);

  const patterns = [
    /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/,
    /\b\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}\b/,
    /\b\d{1,2}[-\/.\s]+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)[-\/.\s]+\d{2,4}\b/i,
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)[-\/.\s]+\d{1,2}[-\/.\s]+\d{2,4}\b/i,
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

async function extractPdfPages(file) {
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

function groupItemsIntoLines(items) {
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
      if (Math.abs(candidate.y - item.y) <= 4.5) {
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
// HEADER DETECTION
// ------------------------------------------------------------

const HEADER_ALIASES = {
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

function classifyHeader(text) {
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

function detectHeaderColumns(line) {
  const detected = [];

  for (const item of line.items) {
    const type = classifyHeader(item.text);

    if (type) {
      detected.push({
        type,
        x: item.x,
        right: item.right,
        text: item.text,
      });
    }
  }

  // Sometimes a header is split into multiple PDF text objects.
  const fullText = line.text;

  if (detected.length === 0) {
    const normalized = normalizeHeader(fullText);

    const possible = [];

    for (const [type, aliases] of Object.entries(HEADER_ALIASES)) {
      for (const alias of aliases) {
        if (normalized.includes(alias)) {
          possible.push({
            type,
            text: alias,
          });

          break;
        }
      }
    }

    if (possible.length >= 2) {
      return possible.map((entry, index) => ({
        type: entry.type,
        x: index * 100,
        right: index * 100 + 80,
        text: entry.text,
      }));
    }
  }

  return detected;
}

// ------------------------------------------------------------
// FIND TRANSACTION HEADER
// ------------------------------------------------------------

function findTransactionHeader(lines) {
  let best = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const columns = detectHeaderColumns(line);

    const types = new Set(
      columns.map((column) => column.type),
    );

    const score =
      (types.has("date") ? 3 : 0) +
      (types.has("title") ? 3 : 0) +
      (types.has("debit") ? 2 : 0) +
      (types.has("credit") ? 2 : 0) +
      (types.has("amount") ? 1 : 0) +
      (types.has("balance") ? 1 : 0);

    if (
      score >= 5 &&
      (!best || score > best.score)
    ) {
      best = {
        index: i,
        line,
        columns,
        score,
      };
    }
  }

  return best;
}

// ------------------------------------------------------------
// COLUMN POSITIONS
// ------------------------------------------------------------

function buildColumnLayout(header) {
  const columns = [...header.columns]
    .sort((a, b) => a.x - b.x)
    .map((column) => ({
      type: column.type,
      x: column.x,
      right: column.right,
      label: column.text,
    }));

  const unique = [];

  for (const column of columns) {
    const existing = unique.find(
      (item) =>
        item.type === column.type &&
        Math.abs(item.x - column.x) < 15,
    );

    if (!existing) {
      unique.push(column);
    }
  }

  return unique;
}

// ------------------------------------------------------------
// ASSIGN PDF ITEM TO COLUMN
// ------------------------------------------------------------
//
// Uses midpoint-based column boundary intervals.
//
// For each column, the boundary extends from the midpoint
// between it and its left neighbour to the midpoint between
// it and its right neighbour.  Edge columns extend to ±∞.
//
// This prevents a narrow column (e.g. Debit = 50px) from
// stealing text items that belong to a wide adjacent column
// (e.g. Narration = 250px).
// ------------------------------------------------------------

function buildColumnBoundaries(columns) {
  if (!columns.length) {
    return [];
  }

  const sorted = [...columns].sort(
    (a, b) => a.x - b.x,
  );

  return sorted.map((column, index) => {
    const prev = sorted[index - 1];
    const next = sorted[index + 1];

    const leftBound = prev
      ? (prev.x + column.x) / 2
      : -Infinity;

    const rightBound = next
      ? (column.x + next.x) / 2
      : Infinity;

    return {
      ...column,
      leftBound,
      rightBound,
    };
  });
}

function getColumnForItem(item, columns) {
  if (!columns.length) {
    return null;
  }

  const center = item.x + item.width / 2;

  // First try boundary-based matching.
  for (const column of columns) {
    if (
      column.leftBound !== undefined &&
      column.rightBound !== undefined
    ) {
      if (
        center >= column.leftBound &&
        center < column.rightBound
      ) {
        return column;
      }
    }
  }

  // Fall back to closest-distance if boundaries
  // were not computed.
  let closest = null;
  let closestDistance = Infinity;

  for (const column of columns) {
    const distance = Math.abs(
      center - column.x,
    );

    if (distance < closestDistance) {
      closest = column;
      closestDistance = distance;
    }
  }

  return closest;
}

// ------------------------------------------------------------
// CHECK NUMERIC TEXT
// ------------------------------------------------------------

function looksLikeMoney(text) {
  const value = cleanText(text);

  if (!value) {
    return false;
  }

  const normalized = value
    .replace(/[₹$€£,\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/CR|DR/gi, "");

  return /^\-?\d+(?:\.\d+)?$/.test(normalized);
}

// ------------------------------------------------------------
// CHECK DATE LINE
// ------------------------------------------------------------

function lineContainsDate(line) {
  return Boolean(findDate(line.text));
}

// ------------------------------------------------------------
// IGNORE NON-TRANSACTION LINES
// ------------------------------------------------------------

function isRepeatedHeader(line) {
  const header = detectHeaderColumns(line);

  return header.length >= 2;
}

function isNoiseLine(text) {
  const normalized = normalizeHeader(text);

  if (!normalized) {
    return true;
  }

  const noise = [
    "page",
    "statement period",
    "account number",
    "account no",
    "customer id",
    "branch",
    "ifsc",
    "micr",
    "address",
    "generated on",
    "opening balance",
    "closing balance",
    "this is a computer generated",
    "end of statement",
    "total",
    "grand total",
  ];

  return noise.some((value) =>
    normalized.startsWith(value),
  );
}

// ------------------------------------------------------------
// ROW EXTRACTION USING COLUMN POSITIONS
// ------------------------------------------------------------

function extractRowsFromLines(lines, columns, pageNumber) {
  const rows = [];

  let current = null;

  for (const line of lines) {
    const text = cleanText(line.text);

    if (!text) {
      continue;
    }

    if (isRepeatedHeader(line)) {
      continue;
    }

    if (isNoiseLine(text)) {
      continue;
    }

    const hasDate = lineContainsDate(line);

    if (hasDate) {
      if (current) {
        rows.push(current);
      }

      current = {
        pageNumber,
        lines: [line],
        dateLine: line,
      };

      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    rows.push(current);
  }

  return rows.map((row) =>
    reconstructTransactionRow(row, columns),
  );
}

// ------------------------------------------------------------
// RECONSTRUCT ONE TRANSACTION
// ------------------------------------------------------------

function reconstructTransactionRow(row, columns) {
  const values = {
    date: "",
    title: "",
    debit: null,
    credit: null,
    amount: null,
    balance: null,
  };

  const titleParts = [];

  for (const line of row.lines) {
    for (const item of line.items) {
      const column = getColumnForItem(item, columns);

      if (!column) {
        continue;
      }

      const text = cleanText(item.text);

      if (!text) {
        continue;
      }

      switch (column.type) {
        case "date":
          values.date +=
            values.date ? ` ${text}` : text;
          break;

        case "title":
          titleParts.push(text);
          break;

        case "debit":
          if (looksLikeMoney(text)) {
            values.debit = parseNumber(text);
          }
          break;

        case "credit":
          if (looksLikeMoney(text)) {
            values.credit = parseNumber(text);
          }
          break;

        case "amount":
          if (looksLikeMoney(text)) {
            values.amount = parseNumber(text);
          }
          break;

        case "balance":
          if (looksLikeMoney(text)) {
            values.balance = parseNumber(text);
          }
          break;

        default:
          break;
      }
    }
  }

  // If coordinates did not map correctly, use raw line text.
  if (!values.date) {
    values.date = findDate(
      row.lines
        .map((line) => line.text)
        .join(" "),
    );
  }

  values.title = cleanText(titleParts.join(" "));

  // Remove the date from title if it accidentally entered there.
  const dateText = findDate(values.title);

  if (dateText) {
    values.title = cleanText(
      values.title.replace(dateText, ""),
    );
  }

  // Fallback title extraction from first line.
  if (!values.title) {
    const firstLine = row.lines[0]?.text || "";

    values.title = cleanText(
      firstLine.replace(
        values.date || "",
        "",
      ),
    );
  }

  return values;
}

// ------------------------------------------------------------
// FALLBACK TABLE EXTRACTION
// ------------------------------------------------------------
// Useful when PDF text coordinates are not perfectly separated.
// ------------------------------------------------------------

function fallbackExtractRows(lines, pageNumber) {
  const rows = [];

  let current = null;

  for (const line of lines) {
    const text = cleanText(line.text);

    if (!text || isNoiseLine(text)) {
      continue;
    }

    if (isRepeatedHeader(line)) {
      continue;
    }

    const date = findDate(text);

    if (date) {
      if (current) {
        rows.push(current);
      }

      current = {
        pageNumber,
        text,
      };

      continue;
    }

    if (current) {
      current.text += ` ${text}`;
    }
  }

  if (current) {
    rows.push(current);
  }

  return rows.map((row) =>
    parseFallbackTransaction(row.text),
  );
}

function parseFallbackTransaction(text) {
  const dateText = findDate(text);

  const date = parseDate(
    dateText || "",
  );

  let remaining = cleanText(
    text.replace(dateText || "", ""),
  );

  const moneyMatches = [
    ...remaining.matchAll(
      /(?:₹|\$|€|£)?\(?-?\d[\d,]*(?:\.\d+)?\)?/g,
    ),
  ];

  const numbers = moneyMatches
    .map((match) => match[0])
    .filter(Boolean)
    .map(parseNumber)
    .filter(
      (value) =>
        value !== null &&
        Number.isFinite(value),
    );

  let balance = null;

  if (numbers.length >= 1) {
    balance = numbers[numbers.length - 1];
  }

  let debit = null;
  let credit = null;

  const upper = remaining.toUpperCase();

  if (/\bDR\b/.test(upper)) {
    debit =
      numbers.length >= 2
        ? numbers[numbers.length - 2]
        : numbers[0] ?? null;
  }

  if (/\bCR\b/.test(upper)) {
    credit =
      numbers.length >= 2
        ? numbers[numbers.length - 2]
        : numbers[0] ?? null;
  }

  if (
    debit === null &&
    credit === null &&
    numbers.length >= 2
  ) {
    debit = numbers[numbers.length - 2];
  }

  let title = remaining;

  for (const match of moneyMatches) {
    title = title.replace(match[0], "");
  }

  title = title
    .replace(/\b(?:DR|CR)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    date,
    rawDate: dateText || "",
    title,
    debit,
    credit,
    amount:
      credit !== null
        ? credit
        : debit !== null
          ? debit
          : null,
    balance,
  };
}

// ------------------------------------------------------------
// NORMALIZE TRANSACTION
// ------------------------------------------------------------

function normalizeTransaction(row) {
  const debit =
    row.debit !== null &&
    row.debit !== undefined
      ? Math.abs(Number(row.debit))
      : null;

  const credit =
    row.credit !== null &&
    row.credit !== undefined
      ? Math.abs(Number(row.credit))
      : null;

  let type = "expense";
  let amount = null;

  if (
    credit !== null &&
    credit > 0 &&
    (debit === null || debit === 0)
  ) {
    type = "income";
    amount = credit;
  } else if (
    debit !== null &&
    debit > 0 &&
    (credit === null || credit === 0)
  ) {
    type = "expense";
    amount = debit;
  } else if (
    row.amount !== null &&
    row.amount !== undefined
  ) {
    amount = Math.abs(Number(row.amount));
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  if (!row.date) {
    return null;
  }

  return {
    date: row.date,
    rawDate: row.rawDate || row.date,

    title:
      cleanText(row.title) ||
      "Bank transaction",

    amount,

    type,

    debit,
    credit,

    balance:
      row.balance !== null &&
      row.balance !== undefined
        ? Number(row.balance)
        : null,

    originalRow: row,
  };
}

// ------------------------------------------------------------
// REMOVE DUPLICATES
// ------------------------------------------------------------

function removeDuplicateRows(rows) {
  const seen = new Set();
  const result = [];

  for (const row of rows) {
    const key = [
      row.date,
      row.title,
      row.amount,
      row.type,
      row.debit,
      row.credit,
    ]
      .map((value) =>
        String(value ?? "")
          .toLowerCase()
          .trim(),
      )
      .join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(row);
  }

  return result;
}

// ------------------------------------------------------------
// DETECT BANK
// ------------------------------------------------------------

function detectBankFromText(text) {
  const normalized = cleanText(text).toLowerCase();

  if (
    normalized.includes("icici bank") ||
    normalized.includes("icici")
  ) {
    return "ICICI Bank";
  }

  if (
    normalized.includes("state bank of india") ||
    normalized.includes("sbi")
  ) {
    return "State Bank of India";
  }

  if (normalized.includes("hdfc bank")) {
    return "HDFC Bank";
  }

  if (normalized.includes("axis bank")) {
    return "Axis Bank";
  }

  if (normalized.includes("kotak")) {
    return "Kotak Mahindra Bank";
  }

  if (
    normalized.includes("bank of baroda") ||
    normalized.includes("bob")
  ) {
    return "Bank of Baroda";
  }

  if (
    normalized.includes("punjab national bank") ||
    normalized.includes("pnb")
  ) {
    return "Punjab National Bank";
  }

  if (normalized.includes("indusind")) {
    return "IndusInd Bank";
  }

  if (normalized.includes("yes bank")) {
    return "Yes Bank";
  }

  if (normalized.includes("canara bank")) {
    return "Canara Bank";
  }

  if (normalized.includes("union bank")) {
    return "Union Bank of India";
  }

  if (normalized.includes("federal bank")) {
    return "Federal Bank";
  }

  if (
    normalized.includes("standard chartered")
  ) {
    return "Standard Chartered";
  }

  if (
    normalized.includes("citibank") ||
    normalized.includes("citi bank")
  ) {
    return "Citibank";
  }

  return "Unknown Bank";
}

// ------------------------------------------------------------
// MAIN FUNCTION
// ------------------------------------------------------------

export async function extractPdfTransactions(file) {
  const pdfData = await extractPdfPages(file);

  const allRows = [];

  let detectedBank = "Unknown Bank";

  const fullDocumentText = pdfData.pages
    .map((page) =>
      page.items
        .map((item) => item.text)
        .join(" "),
    )
    .join(" ");

  detectedBank = detectBankFromText(
    fullDocumentText,
  );

  let detectedTable = false;

  // Column layout discovered on the first page that
  // contains a header.  Reused on subsequent pages
  // when the header is not repeated.
  let propagatedColumns = null;

  for (const page of pdfData.pages) {
    const lines = groupItemsIntoLines(
      page.items,
    );

    const header = findTransactionHeader(lines);

    if (header) {
      detectedTable = true;

      const rawColumns =
        buildColumnLayout(header);

      const columns =
        buildColumnBoundaries(rawColumns);

      // Remember this layout for pages without
      // their own header row.
      propagatedColumns = columns;

      const rows = extractRowsFromLines(
        lines.slice(header.index + 1),
        columns,
        page.pageNumber,
      );

      for (const row of rows) {
        const normalized =
          normalizeTransaction(row);

        if (normalized) {
          allRows.push(normalized);
        }
      }
    } else if (propagatedColumns) {
      // No header on this page, but we already found
      // one earlier.  Reuse the same column positions.
      const rows = extractRowsFromLines(
        lines,
        propagatedColumns,
        page.pageNumber,
      );

      for (const row of rows) {
        const normalized =
          normalizeTransaction(row);

        if (normalized) {
          allRows.push(normalized);
        }
      }
    } else {
      // No header found anywhere yet — use fallback.
      const fallbackRows =
        fallbackExtractRows(
          lines,
          page.pageNumber,
        );

      for (const row of fallbackRows) {
        const normalized =
          normalizeTransaction(row);

        if (normalized) {
          allRows.push(normalized);
        }
      }
    }
  }

  const uniqueRows =
    removeDuplicateRows(allRows);

  uniqueRows.sort((a, b) => {
    return (
      new Date(a.date) -
      new Date(b.date)
    );
  });

  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
    },
    {
      key: "title",
      label: "Transaction Remarks",
      type: "title",
    },
    {
      key: "debit",
      label: "Withdrawal Amount",
      type: "debit",
    },
    {
      key: "credit",
      label: "Deposit Amount",
      type: "credit",
    },
    {
      key: "balance",
      label: "Balance",
      type: "balance",
    },
  ];

  return {
    success: true,

    bank: detectedBank,

    numPages: pdfData.numPages,

    detectedTable,

    rowCount: uniqueRows.length,

    columns,

    rows: uniqueRows,

    rawPages: pdfData.pages,
  };
}

// ------------------------------------------------------------
// ALIAS
// ------------------------------------------------------------

export const parsePdfBankStatement =
  extractPdfTransactions;

export default {
  extractPdfTransactions,
  parsePdfBankStatement,
  isPdfFile,
};
import { cleanText } from "./pdfUtils.js";

// ------------------------------------------------------------
// BANK DETECTION
// ------------------------------------------------------------

/**
 * Detect the bank from the full document text.
 *
 * SBI is detected via:
 *   - "state bank of india"
 *   - "sbi"
 *   - "STATE BANK OF INDIA"
 *
 * Returns a human-readable bank name string.
 */
export function detectBankFromText(text) {
  const normalized = cleanText(text).toLowerCase();

  // SBI — checked first and most thoroughly.
  if (
    normalized.includes("state bank of india") ||
    /\bsbi\b/.test(normalized)
  ) {
    return "State Bank of India";
  }

  if (
    normalized.includes("icici bank") ||
    /\bicici\b/.test(normalized)
  ) {
    return "ICICI Bank";
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
    /\bbob\b/.test(normalized)
  ) {
    return "Bank of Baroda";
  }

  if (
    normalized.includes("punjab national bank") ||
    /\bpnb\b/.test(normalized)
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

  if (normalized.includes("standard chartered")) {
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

/**
 * Returns true if the detected bank name indicates SBI.
 */
export function isSBI(bankName) {
  return bankName === "State Bank of India";
}

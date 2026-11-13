import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up worker
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
} catch (_) {}

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  partyName?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: number;
  gstin?: string;
  address?: string;
  rawText: string;
}

/**
 * Extracts plain text from an uploaded PDF File
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. Primary method: pdfjs-dist
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    if (fullText.trim().length > 10) {
      return fullText;
    }
  } catch (err) {
    console.warn('[PDF Extractor] pdfjs-dist extraction failed, falling back to raw stream parse:', err);
  }

  // 2. Fallback: Raw byte text stream scanner
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(arrayBuffer);
    const textPieces: string[] = [];

    // Search for Tj strings
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      textPieces.push(match[1]);
    }

    // Search for TJ arrays
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(raw)) !== null) {
      const inner = match[1];
      const strMatches = inner.match(/\(([^)]+)\)/g);
      if (strMatches) {
        textPieces.push(strMatches.map((s) => s.slice(1, -1)).join(''));
      }
    }

    return textPieces.join(' ');
  } catch (_) {
    return '';
  }
}

/**
 * Normalizes dates (e.g. 15/11/2024 or 15-Nov-2024 -> 2024-11-15)
 */
function normalizeDate(rawDateStr: string): string | undefined {
  if (!rawDateStr) return undefined;
  const clean = rawDateStr.trim().replace(/[.,;]$/, '');

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const partsDmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (partsDmy) {
    const day = partsDmy[1].padStart(2, '0');
    const month = partsDmy[2].padStart(2, '0');
    let year = partsDmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Named months: 15 Nov 2024 or 15-Nov-2024
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const namedMatch = clean.match(/(\d{1,2})[\s-]+([A-Za-z]{3})[a-z]*[\s,-]+(\d{2,4})/);
  if (namedMatch) {
    const day = namedMatch[1].padStart(2, '0');
    const mStr = namedMatch[2].toLowerCase();
    const month = monthMap[mStr] || '01';
    let year = namedMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return undefined;
}

/**
 * Parses invoice fields from the extracted text
 */
export function parseInvoiceText(rawText: string, fileName = ''): ExtractedInvoiceData {
  const result: ExtractedInvoiceData = {
    rawText,
  };

  const text = rawText.replace(/\r/g, ' ');

  // 1. INVOICE NUMBER
  // Common prefixes: Invoice No, Invoice #, Inv No, Bill No, Tax Invoice No
  const invPatterns = [
    /(?:tax\s+invoice\s+no|tax\s+invoice\s*#|invoice\s+number|invoice\s+no\.?|invoice\s*#|bill\s+no\.?|inv\s*#)[\s.:#]*([A-Za-z0-9\/-]+)/i,
    /(?:invoice|inv)[\s.:#]+([A-Z]{2,4}[-\/]?\d{3,}[A-Za-z0-9\/-]*)/i,
    /\b(INV[-_/A-Za-z0-9]{3,})\b/i,
  ];

  for (const regex of invPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/^[:#.\s-]+/, '');
      if (candidate.length >= 3 && !/^(date|dated|to|gstin|total|amount)$/i.test(candidate)) {
        result.invoiceNumber = candidate;
        break;
      }
    }
  }

  // Fallback invoice number from filename if not found in body
  if (!result.invoiceNumber && fileName) {
    const fnMatch = fileName.match(/(?:INV|BILL|REC)[-_ ]?[A-Za-z0-9]+/i) || fileName.match(/\d{3,}/);
    if (fnMatch) {
      result.invoiceNumber = fnMatch[0].toUpperCase().replace(/[ _]/g, '-');
    }
  }

  // 2. GSTIN
  // Standard 15-char Indian GSTIN
  const gstinRegex = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/i;
  const gstinMatch = text.match(gstinRegex);
  if (gstinMatch && gstinMatch[1]) {
    result.gstin = gstinMatch[1].toUpperCase();
  }

  // 3. PARTY NAME / CUSTOMER NAME
  // Common indicators: Bill To:, Billed To:, Customer Name:, Buyer:, M/s, Sold To:
  const partyPatterns = [
    /(?:billed\s+to|bill\s+to|customer\s+name|buyer|buyer\s+name|party\s+name|sold\s+to|client\s+name)[\s.:]*([^\n\r,]+)/i,
    /(?:m\/s\.?|messrs\.?)[\s.:]*([^\n\r,]+)/i,
  ];

  for (const regex of partyPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Avoid capturing headers or keywords
      if (
        candidate.length > 2 &&
        !/^(date|gstin|invoice|state|address|details|phone|email)/i.test(candidate)
      ) {
        result.partyName = candidate.slice(0, 60).trim();
        break;
      }
    }
  }

  // If party name still not found, check filename
  if (!result.partyName && fileName) {
    const cleanBase = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/(?:INV|BILL|REC)[-_ ]?\d+/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();
    if (cleanBase.length > 2) {
      result.partyName = cleanBase;
    }
  }

  // 4. ISSUE DATE
  const datePatterns = [
    /(?:invoice\s*date|date\s*of\s*issue|issue\s*date|dated|bill\s*date|date)[\s.:]*([0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{2,4}|[0-9]{1,2}[\s-]+[A-Za-z]{3}[a-z]*[\s,-]+[0-9]{2,4})/i,
    /\b([0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{4})\b/,
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const normalized = normalizeDate(match[1]);
      if (normalized) {
        result.issueDate = normalized;
        break;
      }
    }
  }

  // 5. DUE DATE
  const dueDatePatterns = [
    /(?:due\s*date|payment\s*due|pay\s*by)[\s.:]*([0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{2,4}|[0-9]{1,2}[\s-]+[A-Za-z]{3}[a-z]*[\s,-]+[0-9]{2,4})/i,
  ];

  for (const regex of dueDatePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const normalized = normalizeDate(match[1]);
      if (normalized) {
        result.dueDate = normalized;
        break;
      }
    }
  }

  // 6. TOTAL AMOUNT / GRAND TOTAL
  const amountPatterns = [
    /(?:grand\s*total|total\s*amount|total\s*payable|amount\s*payable|invoice\s*total|net\s*total|balance\s*due)[\s.:₹RsINR]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i,
    /(?:total|amount)[\s.:₹RsINR]*([0-9]{1,3}(?:,[0-9]{2,3})*\.[0-9]{2})/i,
    /(?:₹|Rs\.?|INR)[\s]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i,
  ];

  for (const regex of amountPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000000) {
        result.totalAmount = parsed;
        break;
      }
    }
  }

  // Fallback to searching all currency figures and taking the grand total (max plausible total)
  if (!result.totalAmount) {
    const allAmountsRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*\.[0-9]{2})/g;
    let m;
    let maxAmt = 0;
    while ((m = allAmountsRegex.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > maxAmt && val < 50000000) {
        maxAmt = val;
      }
    }
    if (maxAmt > 0) {
      result.totalAmount = maxAmt;
    }
  }

  return result;
}

/**
 * Extracts all invoice data directly from an uploaded PDF File
 */
export async function parsePdfInvoice(file: File): Promise<ExtractedInvoiceData> {
  const rawText = await extractTextFromPdf(file);
  console.log('[PDF Extractor] Extracted PDF Text:', rawText);
  const parsed = parseInvoiceText(rawText, file.name);
  console.log('[PDF Extractor] Parsed Invoice Fields:', parsed);
  return parsed;
}

import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse PDF and extract text content
 * NOTE: PDF parsing is disabled on client-side for Vercel compatibility
 */
export async function parsePDF(file: Buffer): Promise<string> {
  throw new Error('PDF parsing requires server-side processing. Please use CSV format instead.');
}

/**
 * Parse PDF with OCR (disabled for Vercel)
 */
export async function parsePDFWithOCR(file: Buffer): Promise<string> {
  throw new Error('PDF OCR requires server-side processing. Please use CSV format instead.');
}

/**
 * Detect if PDF is image-based (disabled for Vercel)
 */
export async function detectIfImagePDF(file: Buffer): Promise<boolean> {
  return false; // Assume text PDF, but parsing is disabled anyway
}

/**
 * Extract transactions from text using regex patterns
 * Supports French bank statement formats
 */
export function extractTransactionsFromText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const seenTransactions = new Set<string>();
  
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  for (const line of lines) {
    const transaction = parseTransactionLine(line);
    if (transaction) {
      const key = `${transaction.rawDate}_${transaction.label}_${transaction.amount}`;
      if (!seenTransactions.has(key)) {
        seenTransactions.add(key);
        transactions.push(transaction);
      }
    }
  }
  
  return transactions;
}

/**
 * Parse a single line to extract transaction data
 */
function parseTransactionLine(line: string): Transaction | null {
  const pattern1 = /(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))\s+(.+?)\s+(-?\d+[,\.]\d{2})\s*$/i;
  const pattern2 = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\d+[,\.]\d{2})\s*$/i;
  const pattern3 = /(\d{2}[.\/\-]\d{2}[.\/\-](?:\d{4}|\d{2}))\s+(.+?)\s+(-?\d+[,\.]\d{2})\s*$/i;
  const pattern4 = /(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))\s+(.+?)\s+(-?\d+[,\.]\d{2})\s*€?\s*$/i;
  
  const patterns = [pattern1, pattern2, pattern3, pattern4];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, dateStr, label, amountStr] = match;
      
      const date = parseDate(dateStr);
      if (!date) continue;
      
      const amount = parseAmount(amountStr);
      if (amount === null) continue;
      
      const normalizedLabel = label
        .replace(/\s+/g, ' ')
        .replace(/\d+x\s*\d+[,\.]\d{2}/gi, '')
        .trim();
      
      if (normalizedLabel.length < 3 || /^(date|libell|montant|solde)/i.test(normalizedLabel)) {
        continue;
      }
      
      return {
        id: uuidv4(),
        date,
        label: normalizedLabel,
        amount: Math.abs(amount),
        rawDate: dateStr,
        rawAmount: amountStr
      };
    }
  }
  
  return null;
}

function parseDate(dateStr: string): Date | null {
  let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isValidDate(date) ? date : null;
  }
  
  match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (match) {
    const [, day, month, yearShort] = match;
    const year = parseInt(yearShort) < 50 ? 2000 + parseInt(yearShort) : 1900 + parseInt(yearShort);
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    return isValidDate(date) ? date : null;
  }
  
  match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isValidDate(date) ? date : null;
  }
  
  match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isValidDate(date) ? date : null;
  }
  
  return null;
}

function parseAmount(amountStr: string): number | null {
  const normalized = amountStr.replace(',', '.').replace(/\s/g, '');
  const amount = parseFloat(normalized);
  return isNaN(amount) ? null : amount;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export async function parsePDFStatement(file: Buffer): Promise<{ transactions: Transaction[]; errors: string[] }> {
  return {
    transactions: [],
    errors: ['PDF parsing requires server-side processing. Please use CSV format instead.']
  };
}

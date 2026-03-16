import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extrait le texte d'un PDF côté client via PDF.js
 */
export async function parsePDFFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdfjs = await import('pdfjs-dist');
    // Worker servi depuis le dossier public pour éviter les problèmes de bundling
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const lines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Regroupe les éléments texte par coordonnée Y pour reconstruire les lignes
      const itemsByY = new Map<number, { x: number; text: string }[]>();

      for (const item of textContent.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        if (!itemsByY.has(y)) itemsByY.set(y, []);
        itemsByY.get(y)!.push({ x, text: item.str });
      }

      // Trie par Y décroissant (haut → bas), puis X croissant (gauche → droite)
      for (const y of Array.from(itemsByY.keys()).sort((a, b) => b - a)) {
        const line = itemsByY.get(y)!
          .sort((a, b) => a.x - b.x)
          .map(i => i.text)
          .join(' ')
          .trim();
        if (line) lines.push(line);
      }
    }

    return lines.join('\n');
  } catch (error) {
    console.error('Erreur parsing PDF:', error);
    throw new Error("Impossible de lire le fichier PDF. Vérifiez que le fichier n'est pas corrompu.");
  }
}

/**
 * Extrait les transactions du texte en utilisant des regex
 * Supporte les formats de relevés bancaires français
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
 * Parse une ligne pour extraire les données de transaction.
 * Supporte : DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD, DD.MM.YYYY
 * Montants : 15,99 ou 1 599,99 ou 15.99
 */
function parseTransactionLine(line: string): Transaction | null {
  // Montant : chiffres avec éventuellement des espaces comme séparateur de milliers
  const amountPart = '(-?\\d[\\d\\s]*[,\\.]\\d{2})';

  const patterns = [
    new RegExp(`(\\d{2}\\/\\d{2}\\/(?:\\d{4}|\\d{2}))\\s+(.+?)\\s+${amountPart}\\s*€?\\s*$`, 'i'),
    new RegExp(`(\\d{4}-\\d{2}-\\d{2})\\s+(.+?)\\s+${amountPart}\\s*€?\\s*$`, 'i'),
    new RegExp(`(\\d{2}[.\\/\\-]\\d{2}[.\\/\\-](?:\\d{4}|\\d{2}))\\s+(.+?)\\s+${amountPart}\\s*€?\\s*$`, 'i'),
  ];

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
        rawAmount: amountStr,
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
  // Enlève les espaces (séparateurs de milliers), remplace la virgule par un point
  const normalized = amountStr.replace(/\s/g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return isNaN(amount) ? null : amount;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse un relevé PDF et retourne les transactions
 */
export async function parsePDFStatement(file: File): Promise<{ transactions: Transaction[]; errors: string[] }> {
  const errors: string[] = [];

  try {
    const text = await parsePDFFile(file);

    if (!text.trim()) {
      return {
        transactions: [],
        errors: ["Impossible d'extraire le texte du PDF. Le fichier pourrait être basé sur des images ou corrompu."],
      };
    }

    const transactions = extractTransactionsFromText(text);

    if (transactions.length === 0) {
      errors.push('Aucune transaction trouvée dans le PDF. Vérifiez le format du fichier.');
    }

    return { transactions, errors };
  } catch (error) {
    return {
      transactions: [],
      errors: [error instanceof Error ? error.message : 'Erreur lors du traitement du PDF'],
    };
  }
}

// Fonctions obsolètes gardées pour compatibilité
export async function parsePDF(_file: Buffer): Promise<string> {
  throw new Error('Utilisez parsePDFFile(file: File) côté client');
}

export async function parsePDFWithOCR(_file: Buffer): Promise<string> {
  throw new Error('OCR non disponible côté client');
}

export async function detectIfImagePDF(_file: Buffer): Promise<boolean> {
  return false;
}

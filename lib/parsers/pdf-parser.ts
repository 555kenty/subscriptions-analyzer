import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';

/**
 * Parse PDF côté client et extraire le texte
 * Utilise pdf-lib qui fonctionne dans le navigateur
 */
export async function parsePDFFile(file: File): Promise<string> {
  try {
    // Lire le fichier comme ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Charger le PDF avec pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // pdf-lib ne supporte pas nativement l'extraction de texte
    // On utilise une approche alternative en lisant le PDF comme texte brut
    let fullText = await extractTextWithPDFJS(arrayBuffer);
    
    return fullText;
  } catch (error) {
    console.error('Erreur lors du parsing PDF:', error);
    throw new Error('Impossible de lire le fichier PDF. Vérifiez que le fichier n\'est pas corrompu.');
  }
}

/**
 * Extrait le texte du PDF
 * Utilise une méthode de lecture directe des bytes
 */
async function extractTextWithPDFJS(arrayBuffer: ArrayBuffer): Promise<string> {
  // Utiliser une approche simple de lecture du PDF comme texte brut
  // Cette méthode fonctionne pour les PDF texte (pas image-based)
  const text = await extractTextFromPDFBytes(arrayBuffer);
  return text;
}

/**
 * Extrait le texte des bytes PDF en cherchant les chaînes de texte
 * Méthode simple qui fonctionne pour les PDF texte
 */
async function extractTextFromPDFBytes(arrayBuffer: ArrayBuffer): Promise<string> {
  // Convertir en Uint8Array pour analyse
  const bytes = new Uint8Array(arrayBuffer);
  
  // Chercher les objets texte dans le PDF
  // Les chaînes de texte dans les PDF sont souvent encodées entre parenthèses
  let text = '';
  const decoder = new TextDecoder('utf-8');
  
  // Essayer d'abord l'encodage UTF-8
  const rawText = decoder.decode(bytes);
  
  // Extraire les chaînes entre parenthèses (format PDF standard pour le texte)
  // Pattern pour trouver les textes dans les PDF
  const textRegex = /\(([^)]{3,500})\)/g;
  const matches = rawText.match(textRegex);
  
  if (matches && matches.length > 0) {
    // Filtrer et nettoyer les textes trouvés
    const texts = matches
      .map(m => m.slice(1, -1)) // Enlever les parenthèses
      .filter(m => {
        // Garder uniquement les chaînes qui ressemblent à du texte
        return /[a-zA-Z0-9]{3,}/.test(m) && 
               !/^[0-9\s]+$/.test(m) && // Pas juste des chiffres
               m.length > 3;
      });
    
    text = texts.join('\n');
  }
  
  // Si on n'a pas trouvé de texte avec cette méthode, essayer une autre approche
  if (!text.trim()) {
    text = extractTextFromRawPDF(bytes);
  }
  
  return text;
}

/**
 * Extrait le texte en analysant la structure brute du PDF
 */
function extractTextFromRawPDF(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(bytes);
  
  // Nettoyer le texte en gardant uniquement les caractères lisibles
  const lines = text.split(/[\r\n]+/);
  const validLines: string[] = [];
  
  for (const line of lines) {
    // Nettoyer la ligne
    const cleaned = line
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ') // Garder les caractères imprimables
      .replace(/\s+/g, ' ')
      .trim();
    
    // Garder les lignes qui semblent être du texte significatif
    if (cleaned.length > 5 && 
        /[a-zA-Z]{2,}/.test(cleaned) && // Au moins 2 lettres
        !/^(obj|endobj|stream|endstream|xref|trailer|startxref|%%EOF)/.test(cleaned)) {
      validLines.push(cleaned);
    }
  }
  
  return validLines.join('\n');
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
 * Parse une ligne pour extraire les données de transaction
 */
function parseTransactionLine(line: string): Transaction | null {
  // Patterns pour différents formats de dates et montants
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

/**
 * Parse un relevé PDF et retourne les transactions
 */
export async function parsePDFStatement(file: File): Promise<{ transactions: Transaction[]; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Extraire le texte du PDF
    const text = await parsePDFFile(file);
    
    if (!text.trim()) {
      return {
        transactions: [],
        errors: ['Impossible d\'extraire le texte du PDF. Le fichier pourrait être basé sur des images ou corrompu.']
      };
    }
    
    // Extraire les transactions du texte
    const transactions = extractTransactionsFromText(text);
    
    if (transactions.length === 0) {
      errors.push('Aucune transaction trouvée dans le PDF. Vérifiez le format du fichier.');
    }
    
    return { transactions, errors };
  } catch (error) {
    return {
      transactions: [],
      errors: [error instanceof Error ? error.message : 'Erreur lors du traitement du PDF']
    };
  }
}

// Fonctions obsolètes gardées pour compatibilité
export async function parsePDF(file: Buffer): Promise<string> {
  throw new Error('Utilisez parsePDFFile(file: File) côté client');
}

export async function parsePDFWithOCR(file: Buffer): Promise<string> {
  throw new Error('OCR non disponible côté client');
}

export async function detectIfImagePDF(file: Buffer): Promise<boolean> {
  return false;
}

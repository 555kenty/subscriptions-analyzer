import Papa from 'papaparse';
import { Transaction, CsvRow } from '@/types';

export interface ParseResult {
  transactions: Transaction[];
  errors: string[];
}

export function parseBankStatement(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: Transaction[] = [];
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          try {
            const transaction = parseRow(row, index);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (err) {
            errors.push(`Ligne ${index + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
          }
        });

        resolve({ transactions, errors });
      },
      error: (error: { message: string }) => {
        resolve({ 
          transactions: [], 
          errors: [`Erreur de parsing CSV: ${error.message}`] 
        });
      }
    });
  });
}

function parseRow(row: CsvRow, index: number): Transaction | null {
  if (!row.Date || !row.Libellé || row.Montant === undefined) {
    return null;
  }

  // Parse date (format: DD/MM/YYYY or YYYY-MM-DD)
  let date: Date;
  const rawDate = row.Date.trim();
  
  if (rawDate.includes('/')) {
    const [day, month, year] = rawDate.split('/').map(Number);
    date = new Date(year, month - 1, day);
  } else if (rawDate.includes('-')) {
    date = new Date(rawDate);
  } else {
    throw new Error(`Format de date non reconnu: ${rawDate}`);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Date invalide: ${rawDate}`);
  }

  // Parse amount (French format: comma as decimal separator)
  let amount: number;
  const rawAmount = row.Montant.trim().replace(/\s/g, '').replace('€', '');
  
  if (rawAmount.includes(',')) {
    amount = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));
  } else {
    amount = parseFloat(rawAmount);
  }

  if (isNaN(amount)) {
    throw new Error(`Montant invalide: ${row.Montant}`);
  }

  // Only keep negative amounts (debits/expenses)
  if (amount >= 0) {
    return null;
  }

  return {
    id: `tx-${index}-${Date.now()}`,
    date,
    label: row.Libellé.trim(),
    amount: Math.abs(amount),
    rawDate,
    rawAmount
  };
}

export function parseCSVText(text: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(text, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: Transaction[] = [];
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          try {
            const transaction = parseRow(row, index);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (err) {
            errors.push(`Ligne ${index + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
          }
        });

        resolve({ transactions, errors });
      },
      error: (error: { message: string }) => {
        resolve({ 
          transactions: [], 
          errors: [`Erreur de parsing CSV: ${error.message}`] 
        });
      }
    });
  });
}

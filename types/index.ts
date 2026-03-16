export interface Transaction {
  id: string;
  date: Date;
  label: string;
  amount: number;
  rawDate: string;
  rawAmount: string;
}

export interface CancellationLink {
  url: string;
  label: string;
}

export interface Subscription {
  id: string;
  name: string;
  vendor: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'unknown';
  category: string;
  lastTransaction: Date;
  transactions: Transaction[];
  cancellationLink?: CancellationLink;
}

export interface SubscriptionStats {
  totalMonthly: number;
  totalYearly: number;
  subscriptionCount: number;
  averagePerSubscription: number;
  categories: Record<string, number>;
}

export interface CsvRow {
  Date: string;
  Libellé: string;
  Montant: string;
}

export type SubscriptionCategory = 
  | 'streaming'
  | 'music'
  | 'software'
  | 'cloud'
  | 'gaming'
  | 'news'
  | 'fitness'
  | 'food'
  | 'other';

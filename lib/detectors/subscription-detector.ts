import { Transaction, Subscription, SubscriptionStats, SubscriptionCategory } from '@/types';
import { format, isSameMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getCancellationLink } from '../cancellation-links';

interface SubscriptionPattern {
  keywords: string[];
  name: string;
  category: SubscriptionCategory;
}

const SUBSCRIPTION_PATTERNS: SubscriptionPattern[] = [
  // Streaming
  { keywords: ['netflix'], name: 'Netflix', category: 'streaming' },
  { keywords: ['prime video', 'amazon prime', 'primevideo'], name: 'Prime Video', category: 'streaming' },
  { keywords: ['disney+', 'disney plus'], name: 'Disney+', category: 'streaming' },
  { keywords: ['spotify'], name: 'Spotify', category: 'music' },
  { keywords: ['deezer'], name: 'Deezer', category: 'music' },
  { keywords: ['apple music'], name: 'Apple Music', category: 'music' },
  { keywords: ['youtube', 'yt premium'], name: 'YouTube Premium', category: 'streaming' },
  { keywords: ['canal+', 'canal plus'], name: 'Canal+', category: 'streaming' },
  { keywords: ['ocs'], name: 'OCS', category: 'streaming' },
  
  // Software & Cloud
  { keywords: ['adobe', 'creative cloud'], name: 'Adobe Creative Cloud', category: 'software' },
  { keywords: ['microsoft', 'office 365', 'microsoft 365'], name: 'Microsoft 365', category: 'software' },
  { keywords: ['notion'], name: 'Notion', category: 'software' },
  { keywords: ['figma'], name: 'Figma', category: 'software' },
  { keywords: ['github'], name: 'GitHub', category: 'software' },
  { keywords: ['gitlab'], name: 'GitLab', category: 'software' },
  { keywords: ['docker'], name: 'Docker', category: 'software' },
  { keywords: ['jetbrains'], name: 'JetBrains', category: 'software' },
  { keywords: ['intellij'], name: 'IntelliJ', category: 'software' },
  
  // Cloud Storage
  { keywords: ['dropbox'], name: 'Dropbox', category: 'cloud' },
  { keywords: ['google one', 'google drive'], name: 'Google One', category: 'cloud' },
  { keywords: ['icloud'], name: 'iCloud', category: 'cloud' },
  { keywords: ['one drive', 'onedrive'], name: 'OneDrive', category: 'cloud' },
  { keywords: ['box.com'], name: 'Box', category: 'cloud' },
  
  // Gaming
  { keywords: ['playstation plus', 'ps plus'], name: 'PlayStation Plus', category: 'gaming' },
  { keywords: ['xbox game pass'], name: 'Xbox Game Pass', category: 'gaming' },
  { keywords: ['nintendo switch online'], name: 'Nintendo Switch Online', category: 'gaming' },
  { keywords: ['steam'], name: 'Steam', category: 'gaming' },
  { keywords: ['ea play'], name: 'EA Play', category: 'gaming' },
  { keywords: ['ubisoft+', 'ubisoft plus'], name: 'Ubisoft+', category: 'gaming' },
  
  // News & Media
  { keywords: ['le monde'], name: 'Le Monde', category: 'news' },
  { keywords: ['le figaro'], name: 'Le Figaro', category: 'news' },
  { keywords: ['liberation', 'libération'], name: 'Libération', category: 'news' },
  { keywords: ['mediapart'], name: 'Mediapart', category: 'news' },
  { keywords: ['nytimes', 'new york times'], name: 'New York Times', category: 'news' },
  { keywords: ['the guardian'], name: 'The Guardian', category: 'news' },
  { keywords: ['substack'], name: 'Substack', category: 'news' },
  
  // Fitness & Health
  { keywords: ['basic-fit', 'basic fit'], name: 'Basic-Fit', category: 'fitness' },
  { keywords: ['neoness'], name: 'Neoness', category: 'fitness' },
  { keywords: ['keepcool'], name: 'Keepcool', category: 'fitness' },
  { keywords: ['apple fitness'], name: 'Apple Fitness+', category: 'fitness' },
  { keywords: ['peloton'], name: 'Peloton', category: 'fitness' },
  { keywords: ['strava'], name: 'Strava', category: 'fitness' },
  { keywords: ['myfitnesspal'], name: 'MyFitnessPal', category: 'fitness' },
  
  // Food
  { keywords: ['hellofresh'], name: 'HelloFresh', category: 'food' },
  { keywords: ['quitoque'], name: 'Quitoque', category: 'food' },
  { keywords: ['frichti'], name: 'Frichti', category: 'food' },
  { keywords: ['uber eats pass', 'eats pass'], name: 'Uber Eats Pass', category: 'food' },
  { keywords: ['deliveroo plus'], name: 'Deliveroo Plus', category: 'food' },
];

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const subscriptionMap = new Map<string, Transaction[]>();

  // Group transactions by vendor
  for (const transaction of transactions) {
    const pattern = findMatchingPattern(transaction.label);
    if (!pattern) continue;

    const key = pattern.name;
    if (!subscriptionMap.has(key)) {
      subscriptionMap.set(key, []);
    }
    subscriptionMap.get(key)!.push(transaction);
  }

  // Create subscription objects
  const subscriptions: Subscription[] = [];

  for (const [name, txs] of subscriptionMap) {
    const pattern = SUBSCRIPTION_PATTERNS.find(p => p.name === name);
    if (!pattern) continue;

    // Sort transactions by date (newest first)
    const sortedTxs = txs.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Calculate average amount
    const avgAmount = sortedTxs.reduce((sum, t) => sum + t.amount, 0) / sortedTxs.length;
    
    // Detect frequency
    const frequency = detectFrequency(sortedTxs);
    
    // Get last transaction date
    const lastTransaction = sortedTxs[0].date;

    subscriptions.push({
      id: `sub-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      vendor: name,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      category: pattern.category,
      lastTransaction,
      transactions: sortedTxs,
      cancellationLink: getCancellationLink(name)
    });
  }

  // Sort by monthly cost (descending)
  return subscriptions.sort((a, b) => {
    const monthlyA = a.frequency === 'yearly' ? a.amount / 12 : a.amount;
    const monthlyB = b.frequency === 'yearly' ? b.amount / 12 : b.amount;
    return monthlyB - monthlyA;
  });
}

function findMatchingPattern(label: string): SubscriptionPattern | null {
  const normalizedLabel = label.toLowerCase();
  
  for (const pattern of SUBSCRIPTION_PATTERNS) {
    if (pattern.keywords.some(keyword => normalizedLabel.includes(keyword))) {
      return pattern;
    }
  }
  
  return null;
}

function detectFrequency(transactions: Transaction[]): 'monthly' | 'yearly' | 'unknown' {
  if (transactions.length < 2) {
    return 'unknown';
  }

  // Sort by date
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate intervals between transactions
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(diffDays);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  if (avgInterval >= 330 && avgInterval <= 395) {
    return 'yearly';
  } else if (avgInterval >= 25 && avgInterval <= 35) {
    return 'monthly';
  }

  return 'unknown';
}

export function calculateStats(subscriptions: Subscription[]): SubscriptionStats {
  let totalMonthly = 0;
  let totalYearly = 0;
  const categories: Record<string, number> = {};

  for (const sub of subscriptions) {
    const monthly = sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
    const yearly = sub.frequency === 'yearly' ? sub.amount : sub.amount * 12;
    
    totalMonthly += monthly;
    totalYearly += yearly;
    
    categories[sub.category] = (categories[sub.category] || 0) + monthly;
  }

  const subscriptionCount = subscriptions.length;
  const averagePerSubscription = subscriptionCount > 0 ? totalMonthly / subscriptionCount : 0;

  return {
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalYearly: Math.round(totalYearly * 100) / 100,
    subscriptionCount,
    averagePerSubscription: Math.round(averagePerSubscription * 100) / 100,
    categories
  };
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    streaming: 'Streaming',
    music: 'Musique',
    software: 'Logiciels',
    cloud: 'Cloud',
    gaming: 'Jeux vidéo',
    news: 'Presse',
    fitness: 'Sport',
    food: 'Alimentation',
    other: 'Autre'
  };
  return labels[category] || category;
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    streaming: '🎬',
    music: '🎵',
    software: '💻',
    cloud: '☁️',
    gaming: '🎮',
    news: '📰',
    fitness: '💪',
    food: '🍽️',
    other: '📦'
  };
  return emojis[category] || '📦';
}

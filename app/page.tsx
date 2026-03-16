'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/upload-zone';
import { StatsCards } from '@/components/stats-cards';
import { SubscriptionCard } from '@/components/subscription-card';
import { parseBankStatement } from '@/lib/parsers/csv-parser';
import { parsePDFStatement } from '@/lib/parsers/pdf-parser';
import { detectSubscriptions, calculateStats } from '@/lib/detectors/subscription-detector';
import { Subscription, SubscriptionStats, Transaction } from '@/types';
import { Receipt, AlertCircle, FileText, Sparkles } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Détecter si c'est un PDF ou un CSV
      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      
      let result;
      if (isPDF) {
        result = await parsePDFStatement(file);
      } else {
        result = await parseBankStatement(file);
      }
      
      const { transactions, errors } = result;

      if (errors.length > 0 && transactions.length === 0) {
        setError(errors.join('\n'));
        setIsLoading(false);
        return;
      }

      const detected = detectSubscriptions(transactions);
      const calculatedStats = calculateStats(detected);

      setSubscriptions(detected);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SubTrack</h1>
              <p className="text-sm text-gray-500">Analyseur d&apos;abonnements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload Section */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Importez votre relevé bancaire</h2>
            <p className="text-sm text-gray-500">
              Glissez votre fichier CSV ou PDF (relevé bancaire) pour détecter automatiquement vos abonnements
            </p>
          </div>
          <UploadZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          )}
        </section>

        {/* Stats Section */}
        {stats && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Résumé</h2>
            </div>
            <StatsCards stats={stats} />
          </section>
        )}

        {/* Subscriptions List */}
        {subscriptions.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Abonnements détectés
                </h2>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {subscriptions.length}
              </span>
            </div>
            
            <div className="grid gap-4">
              {subscriptions.map((subscription) => (
                <SubscriptionCard 
                  key={subscription.id} 
                  subscription={subscription} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && subscriptions.length === 0 && !error && (
          <section className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun abonnement détecté</h3>
            <p className="mt-1 text-sm text-gray-500">
              Importez votre relevé bancaire pour commencer l&apos;analyse
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

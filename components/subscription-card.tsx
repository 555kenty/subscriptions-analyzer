import { ExternalLink, Calendar, RefreshCw, Receipt } from 'lucide-react';
import { Subscription } from '@/types';
import {
  getCategoryEmoji,
  getCategoryLabel,
  formatAmount,
} from '@/lib/detectors/subscription-detector';
import {
  hasCancellationLink,
  getCancellationLink,
} from '@/lib/cancellation-links';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { name, category, amount, frequency, transactions } = subscription;

  const monthlyAmount =
    frequency === 'yearly' ? amount / 12 : amount;
  const yearlyAmount =
    frequency === 'monthly' ? amount * 12 : amount;

  const cancellationLink = hasCancellationLink(name)
    ? getCancellationLink(name)
    : undefined;

  const frequencyLabel =
    frequency === 'monthly'
      ? 'Mensuel'
      : frequency === 'yearly'
      ? 'Annuel'
      : 'Inconnu';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
            {name}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            <span aria-hidden="true">{getCategoryEmoji(category)}</span>
            {getCategoryLabel(category)}
          </span>
        </div>

        <span
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
          aria-label={`Fréquence : ${frequencyLabel}`}
        >
          <RefreshCw size={12} aria-hidden="true" />
          {frequencyLabel}
        </span>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium text-blue-500 mb-0.5">Par mois</p>
          <p className="text-lg font-bold text-blue-700 tabular-nums">
            {formatAmount(monthlyAmount)}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 px-4 py-3">
          <p className="text-xs font-medium text-purple-500 mb-0.5">Par an</p>
          <p className="text-lg font-bold text-purple-700 tabular-nums">
            {formatAmount(yearlyAmount)}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Receipt size={14} aria-hidden="true" />
          {transactions.length} transaction
          {transactions.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} aria-hidden="true" />
          {new Date(subscription.lastTransaction).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Cancellation link */}
      {cancellationLink && (
        <a
          href={cancellationLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors duration-150"
          aria-label={`${cancellationLink.label} (ouvre dans un nouvel onglet)`}
        >
          <ExternalLink size={14} aria-hidden="true" />
          {cancellationLink.label}
        </a>
      )}
    </div>
  );
}

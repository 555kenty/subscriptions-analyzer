'use client';

import { SubscriptionStats } from '@/types';
import { formatAmount } from '@/lib/detectors/subscription-detector';
import { Wallet, CreditCard, TrendingUp, PieChart } from 'lucide-react';

interface StatsCardsProps {
  stats: SubscriptionStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total mensuel',
      value: formatAmount(stats.totalMonthly),
      subtitle: `${formatAmount(stats.totalYearly)}/an`,
      icon: Wallet,
      color: 'blue',
    },
    {
      title: "Nombre d'abonnements",
      value: stats.subscriptionCount.toString(),
      subtitle: 'abonnements actifs',
      icon: CreditCard,
      color: 'green',
    },
    {
      title: 'Moyenne par abonnement',
      value: formatAmount(stats.averagePerSubscription),
      subtitle: 'par mois',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'Catégories',
      value: Object.keys(stats.categories).length.toString(),
      subtitle: 'catégories détectées',
      icon: PieChart,
      color: 'orange',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const colors = colorClasses[card.color];
        return (
          <div
            key={card.title}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{card.subtitle}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

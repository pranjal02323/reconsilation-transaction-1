import { AlertTriangle, CheckCircle2, CheckSquare, Clock, HelpCircle, Layers, ShieldCheck } from 'lucide-react';
import React from 'react';
import './SummaryCards.module.scss';
import { SUMMARY_CARD_GRID_CLASS } from './constants';
import type { SummaryCardsProps } from './interfaces';
import { getTotalMatchesEvaluated } from './utils';

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, activeFilter, onFilterChange }) => {
  if (!summary) return null;

  const totalMatchesEvaluated = getTotalMatchesEvaluated(summary);

  const cards = [
    {
      id: 'ALL',
      title: 'Total Matches Evaluated',
      count: totalMatchesEvaluated,
      icon: Layers,
      color: 'from-slate-800 to-slate-900 border-slate-700 text-slate-200',
      activeRing: 'ring-2 ring-cyan-500',
    },
    {
      id: 'DISCREPANCY',
      title: 'Discrepancies Flagged',
      count: summary.discrepanciesCount,
      icon: AlertTriangle,
      color: 'from-rose-950/40 to-slate-900 border-rose-800/40 text-rose-300',
      activeRing: 'ring-2 ring-rose-500',
      badgeColor: 'bg-rose-500/20 text-rose-400',
    },
    {
      id: 'TOLERATED_MATCH',
      title: 'Tolerated Drift Matches',
      count: summary.toleratedMatchesCount,
      icon: Clock,
      color: 'from-amber-950/40 to-slate-900 border-amber-800/40 text-amber-300',
      activeRing: 'ring-2 ring-amber-500',
      badgeColor: 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'EXACT_MATCH',
      title: 'Exact Reconciled',
      count: summary.exactMatchesCount,
      icon: CheckCircle2,
      color: 'from-emerald-950/40 to-slate-900 border-emerald-800/40 text-emerald-300',
      activeRing: 'ring-2 ring-emerald-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'UNMATCHED_INTERNAL',
      title: 'Unmatched Internal',
      count: summary.unmatchedInternalCount,
      icon: HelpCircle,
      color: 'from-purple-950/40 to-slate-900 border-purple-800/40 text-purple-300',
      activeRing: 'ring-2 ring-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-400',
    },
    {
      id: 'UNMATCHED_EXTERNAL',
      title: 'Unmatched External',
      count: summary.unmatchedExternalCount,
      icon: HelpCircle,
      color: 'from-indigo-950/40 to-slate-900 border-indigo-800/40 text-indigo-300',
      activeRing: 'ring-2 ring-indigo-500',
      badgeColor: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'MANUALLY_RESOLVED',
      title: 'Manually Resolved',
      count: summary.manuallyResolvedCount,
      icon: ShieldCheck,
      color: 'from-cyan-950/40 to-slate-900 border-cyan-800/40 text-cyan-300',
      activeRing: 'ring-2 ring-cyan-500',
      badgeColor: 'bg-cyan-500/20 text-cyan-400',
    },
  ];

  return (
    <div className={SUMMARY_CARD_GRID_CLASS}>
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id as any)}
            className={`flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-b ${card.color} border transition transform hover:-translate-y-0.5 text-left shadow-lg ${
              isActive ? card.activeRing : 'opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-medium text-slate-400 truncate">{card.title}</span>
              <Icon className="w-4 h-4 opacity-75 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold tracking-tight text-white">{card.count}</span>
              {card.badgeColor && card.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.badgeColor}`}>
                  {card.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

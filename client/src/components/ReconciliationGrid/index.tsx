import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Landmark,
  Search,
  SlidersHorizontal,
  UserCheck,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import './ReconciliationGrid.module.scss';
import { SEARCH_PLACEHOLDER } from './constants';
import type { ReconciliationGridProps } from './interfaces';
import { getFilteredMatches } from './utils';
import type { MatchStatus } from '../../types';

export const ReconciliationGrid: React.FC<ReconciliationGridProps> = ({
  matches,
  activeFilter,
  onInspect,
  onResolve,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = getFilteredMatches(matches, activeFilter, searchQuery);

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'EXACT_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Exact Reconciled Match
          </span>
        );
      case 'TOLERATED_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm">
            <Clock className="w-4 h-4" /> Tolerated Drift Match
          </span>
        );
      case 'DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Discrepancy Flagged
          </span>
        );
      case 'UNMATCHED_INTERNAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-sm">
            <AlertCircle className="w-4 h-4 text-purple-400" /> Unmatched Internal Trade
          </span>
        );
      case 'UNMATCHED_EXTERNAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm">
            <AlertCircle className="w-4 h-4 text-indigo-400" /> Unmatched External Trade
          </span>
        );
      case 'MANUALLY_RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Manually Resolved (Operator)
          </span>
        );
      case 'IGNORED_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">
            <XCircle className="w-4 h-4 text-slate-500" /> Cancelled Trade Ignored
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Transaction Comparison Log</h2>
            <p className="text-xs text-slate-400">Showing {filteredMatches.length} reconciled rows</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Rows List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
          No transactions found for the selected filter or search query.
        </div>
      ) : (
        filteredMatches.map((m) => {
          const int = m.internalRecord;
          const ext = m.externalRecord;

          const amountDiff = m.diffs.find((d) => d.field === 'grossAmount');
          const timeDiff = m.diffs.find((d) => d.field === 'tradedAt');

          return (
            <div
              key={m.id}
              className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 shadow-xl transition space-y-4 backdrop-blur-md"
            >
              {/* Row Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  {getStatusBadge(m.status)}
                  <span className="text-xs text-slate-400 font-medium">{m.summaryNote}</span>
                </div>

                  {/* Actions */}
                <div className="flex items-center gap-2">
                  {m.diffs.length > 0 && (
                    <button
                      onClick={() => onInspect(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Inspect Diffs
                    </button>
                  )}

                  {(m.status === 'UNMATCHED_INTERNAL' ||
                    m.status === 'UNMATCHED_EXTERNAL' ||
                    m.status === 'DISCREPANCY') && (
                    <button
                      onClick={() => onResolve(m)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Field Variance Alert Callout (If Discrepancy or Tolerance) */}
              {(amountDiff || timeDiff) && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                  <span className="font-semibold text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Field Differences:
                  </span>

                  {amountDiff && (
                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        amountDiff.isWithinTolerance
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      Amount: ${String(amountDiff.internalValue)} (Ledger) vs ${String(amountDiff.externalValue)} (Statement) | Difference: ${amountDiff.delta?.toFixed(2)}
                    </span>
                  )}

                  {timeDiff && (
                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        timeDiff.isWithinTolerance
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      Time Difference: {timeDiff.delta ? Math.round(timeDiff.delta / 60) : 0} minutes drift
                    </span>
                  )}
                </div>
              )}

              {/* Side-by-Side Dual Transaction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Left Card: System A Internal Ledger */}
                <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                        System A: Internal Ledger
                      </span>
                    </div>
                    {int && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          int.side === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {int.side}
                      </span>
                    )}
                  </div>

                  {int ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-base font-bold text-white tracking-wide">
                          {int.externalRefId}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{int.instrument}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Quantity & Price</span>
                          <span className="text-slate-200 font-semibold">
                            {int.quantity} @ ${int.unitPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Total Gross Amount</span>
                          <span className="text-cyan-300 font-bold text-sm">
                            ${int.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span>{new Date(int.tradedAt).toUTCString()}</span>
                        <span className="text-slate-500 uppercase text-[10px] font-bold">{int.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 italic text-xs font-medium">
                      -- Transaction missing in Internal Ledger --
                    </div>
                  )}
                </div>

                {/* Right Card: System B External Statement */}
                <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-indigo-400" />
                      <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                        System B: External Statement
                      </span>
                    </div>
                    {ext && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ext.side === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ext.side}
                      </span>
                    )}
                  </div>

                  {ext ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-base font-bold text-white tracking-wide">
                          {ext.externalRefId}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{ext.instrument}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Quantity & Price</span>
                          <span className="text-slate-200 font-semibold">
                            {ext.quantity} @ ${ext.unitPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Total Gross Amount</span>
                          <span className="text-indigo-300 font-bold text-sm">
                            ${ext.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span>{new Date(ext.tradedAt).toUTCString()}</span>
                        <span className="text-slate-500 uppercase text-[10px] font-bold">{ext.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 italic text-xs font-medium">
                      -- Transaction missing in Counterparty Statement --
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

import { AlertTriangle, CheckCircle2, Link, ShieldAlert, X } from 'lucide-react';
import React, { useState } from 'react';
import './ManualResolutionModal.module.scss';
import { AUDIT_REASON_PLACEHOLDER } from './constants';
import type { ManualResolutionModalProps } from './interfaces';
import { getCandidateMatches } from './utils';

export const ManualResolutionModal: React.FC<ManualResolutionModalProps> = ({
  match,
  allMatches,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [resolutionType, setResolutionType] = useState<'FORCE_MATCH' | 'ACCEPT_UNMATCHED'>('ACCEPT_UNMATCHED');
  const [targetRef, setTargetRef] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!match) return null;

  const isInternalUnmatched = match.status === 'UNMATCHED_INTERNAL';
  const isExternalUnmatched = match.status === 'UNMATCHED_EXTERNAL';
  const isPairMatch = match.status === 'DISCREPANCY';

  const candidateMatches = getCandidateMatches(match, allMatches);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    let internalRefId: string | undefined;
    let externalRefId: string | undefined;

    if (isInternalUnmatched) {
      internalRefId = match.internalRecord?.externalRefId;
      if (resolutionType === 'FORCE_MATCH') externalRefId = targetRef;
    } else if (isExternalUnmatched) {
      externalRefId = match.externalRecord?.externalRefId;
      if (resolutionType === 'FORCE_MATCH') internalRefId = targetRef;
    } else if (isPairMatch) {
      internalRefId = match.internalRecord?.externalRefId;
      externalRefId = match.externalRecord?.externalRefId;
    }

    onSubmit({
      internalRefId,
      externalRefId,
      resolutionType: isPairMatch ? 'FORCE_MATCH' : resolutionType,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Reconciliation Resolution</h3>
              <p className="text-xs text-slate-400">Apply a persistent operator decision for this transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Row */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Selected Transaction</span>
          <div className="flex items-center justify-between text-xs font-mono text-slate-200 flex-wrap gap-2">
            <span className="font-bold text-white">
              Ref: {match.internalRecord?.externalRefId || match.externalRecord?.externalRefId}
            </span>
            <span className="text-slate-300">{match.internalRecord?.instrument || match.externalRecord?.instrument}</span>
            <span className="text-slate-300">
              Total: ${(match.internalRecord?.grossAmount ?? match.externalRecord?.grossAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Field Differences — same view as Inspect Diff, shown when diffs exist */}
        {match.diffs.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">{match.summaryNote}</p>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Internal Ledger</th>
                    <th className="py-2.5 px-3">External Statement</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {match.diffs.map((diff, index) => (
                    <tr key={index} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-cyan-300">{diff.field}</td>
                      <td className="py-2.5 px-3 text-slate-200">{String(diff.internalValue)}</td>
                      <td className="py-2.5 px-3 text-slate-200">{String(diff.externalValue)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {diff.isWithinTolerance ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Tolerated (
                            {diff.field === 'grossAmount'
                              ? `Diff: $${diff.delta}`
                              : diff.field === 'tradedAt'
                              ? `Drift: ${Math.round((diff.delta || 0) / 60)} min`
                              : `Diff: ${diff.delta}`}
                            )
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> Discrepancy (
                            {diff.field === 'grossAmount'
                              ? `Diff: $${diff.delta}`
                              : diff.field === 'tradedAt'
                              ? `Drift: ${Math.round((diff.delta || 0) / 60)} min`
                              : `Diff: ${diff.delta}`}
                            )
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPairMatch && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Resolution Action</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolutionType('ACCEPT_UNMATCHED')}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                    resolutionType === 'ACCEPT_UNMATCHED'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Standalone Row</span>
                </button>

                {candidateMatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setResolutionType('FORCE_MATCH')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                      resolutionType === 'FORCE_MATCH'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    <span>Pair With Unmatched</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isPairMatch && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              You are overriding the field differences above and confirming this is the correct trade pair. Provide your justification below.
            </div>
          )}

          {resolutionType === 'FORCE_MATCH' && candidateMatches.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Counterparty Record to Pair With
              </label>
              <select
                value={targetRef}
                onChange={(e) => setTargetRef(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
              >
                <option value="">-- Choose matching transaction reference --</option>
                {candidateMatches.map((cand) => {
                  const rec = cand.internalRecord || cand.externalRecord;
                  if (!rec) return null;
                  return (
                    <option key={rec.id} value={rec.externalRefId}>
                      {rec.externalRefId} | {rec.instrument} | {rec.side} | ${rec.grossAmount.toLocaleString()}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Operator Audit Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder={AUDIT_REASON_PLACEHOLDER}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Resolution...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

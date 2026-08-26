import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import React from 'react';
import './DiffDetailsModal.module.scss';
import { MODAL_TITLE } from './constants';
import type { DiffDetailsModalProps } from './interfaces';
import { getVarianceLabel } from './utils';

export const DiffDetailsModal: React.FC<DiffDetailsModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">{MODAL_TITLE}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

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
                          <CheckCircle className="w-3 h-3" /> Tolerated (
                          {getVarianceLabel(diff)}
                          )
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> Discrepancy (
                          {getVarianceLabel(diff)}
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

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

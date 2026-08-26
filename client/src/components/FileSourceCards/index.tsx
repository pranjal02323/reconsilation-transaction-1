import { Building2, FileCheck, Landmark, Upload } from 'lucide-react';
import React from 'react';
import './FileSourceCards.module.scss';
import { FILE_SOURCE_LABELS } from './constants';
import type { FileSourceCardsProps } from './interfaces';
import { getTradeCountLabel } from './utils';

export const FileSourceCards: React.FC<FileSourceCardsProps> = ({
  internalFile,
  externalFile,
  onUploadSource,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Internal Ledger Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400">Source A</span>
              <h3 className="text-sm font-bold text-white">{FILE_SOURCE_LABELS.INTERNAL}</h3>
            </div>
          </div>

          <button
            onClick={() => onUploadSource('INTERNAL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Ledger CSV
          </button>
        </div>

        {internalFile ? (
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate font-semibold max-w-[200px]" title={internalFile.filename}>
                {internalFile.filename}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                {getTradeCountLabel(internalFile)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 text-xs text-slate-500 italic text-center">
            No internal ledger CSV loaded yet
          </div>
        )}
      </div>

      {/* External Statement Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">Source B</span>
              <h3 className="text-sm font-bold text-white">{FILE_SOURCE_LABELS.EXTERNAL}</h3>
            </div>
          </div>

          <button
            onClick={() => onUploadSource('EXTERNAL')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Statement CSV
          </button>
        </div>

        {externalFile ? (
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate font-semibold max-w-[200px]" title={externalFile.filename}>
                {externalFile.filename}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                {getTradeCountLabel(externalFile)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 text-xs text-slate-500 italic text-center">
            No counterparty statement CSV loaded yet
          </div>
        )}
      </div>
    </div>
  );
};

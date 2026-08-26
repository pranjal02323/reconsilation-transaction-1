import { Database, Play, RefreshCw, Trash2, Upload, Zap } from 'lucide-react';
import React from 'react';
import './Navbar.module.scss';
import { APP_VERSION } from './constants';
import type { NavbarProps } from './interfaces';
import { getRunLabel } from './utils';

export const Navbar: React.FC<NavbarProps> = ({
  onRunReconciliation,
  onSeedData,
  onResetData,
  isLoading,
  lastRunAt,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Atlas Reconciler</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400">Financial Ledger & Statement Reconciliation Engine</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={onSeedData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Load initial assignment dataset (T-1001, T-1011, T-1015, T-1016, C-9001)"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Load Seed</span>
          </button>

          <button
            onClick={onResetData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
            title="Clear all stored data to test fresh file uploads"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Data</span>
          </button>

          <button
            onClick={onRunReconciliation}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{getRunLabel(isLoading)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

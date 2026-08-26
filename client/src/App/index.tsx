import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  fetchLatestReport,
  resetSystem,
  seedSampleData,
  submitManualResolution,
  triggerReconciliationRun,
  uploadCSVFile,
} from '../api';
import { DiffDetailsModal } from '../components/DiffDetailsModal';
import { FileSourceCards } from '../components/FileSourceCards';
import { FileUploadModal } from '../components/FileUploadModal';
import { ManualResolutionModal } from '../components/ManualResolutionModal';
import { Navbar } from '../components/Navbar';
import { ReconciliationGrid } from '../components/ReconciliationGrid';
import { SummaryCards } from '../components/SummaryCards';
import { MatchStatus, ReconciliationMatch, RunReportResponse } from '../types';
import './App.module.scss';
import { FOOTER_TEXT } from './constants';
import type { ManualResolutionPayload, UploadSource } from './interfaces';
import { getErrorMessage } from './utils';

export const App: React.FC = () => {
  const [report, setReport] = useState<RunReportResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmittingRes, setIsSubmittingRes] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [inspectMatch, setInspectMatch] = useState<ReconciliationMatch | null>(null);
  const [resolveMatch, setResolveMatch] = useState<ReconciliationMatch | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadSource, setUploadSource] = useState<UploadSource>('INTERNAL');

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchLatestReport();
      setReport(data);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to load reconciliation data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleOpenUpload = (source: UploadSource = 'INTERNAL') => {
    setUploadSource(source);
    setIsUploadOpen(true);
  };

  const handleRunReconciliation = async () => {
    try {
      setIsLoading(true);
      const data = await triggerReconciliationRun();
      setReport(data);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to execute reconciliation run'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsLoading(true);
      const data = await seedSampleData();
      setReport(data);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to seed assignment sample data'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    try {
      setIsLoading(true);
      const data = await resetSystem();
      setReport(data);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to reset system database'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File, source: UploadSource) => {
    try {
      setIsUploading(true);
      const data = await uploadCSVFile(file, source);
      setReport(data);
      setIsUploadOpen(false);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to upload CSV file'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualResolution = async (payload: ManualResolutionPayload) => {
    try {
      setIsSubmittingRes(true);
      const data = await submitManualResolution(payload);
      setReport(data);
      setResolveMatch(null);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Failed to submit manual resolution'));
    } finally {
      setIsSubmittingRes(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar
        onRunReconciliation={handleRunReconciliation}
        onSeedData={handleSeedData}
        onResetData={handleResetData}
        isLoading={isLoading}
        lastRunAt={report?.summary.runAt}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="underline hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Source File Overview Cards */}
        <FileSourceCards
          internalFile={report?.files?.internal}
          externalFile={report?.files?.external}
          onUploadSource={handleOpenUpload}
        />

        {!report ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Upload Files to Start Reconciliation</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Reconciliation works by comparing trade details between two systems. Upload your Internal Ledger CSV and External Counterparty Statement CSV above to see matches and discrepancies, or load the pre-configured seed data.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleSeedData}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Load Seed Sample Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Overview Cards */}
            <SummaryCards
              summary={report.summary}
              activeFilter={activeFilter}
              onFilterChange={(filter) => setActiveFilter(filter)}
            />

            {/* Main Grid Log */}
            <ReconciliationGrid
              matches={report.matches || []}
              activeFilter={activeFilter}
              onInspect={(match) => setInspectMatch(match)}
              onResolve={(match) => setResolveMatch(match)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        {FOOTER_TEXT}
      </footer>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
        source={uploadSource}
      />

      <DiffDetailsModal match={inspectMatch} onClose={() => setInspectMatch(null)} />

      <ManualResolutionModal
        match={resolveMatch}
        allMatches={report?.matches || []}
        onClose={() => setResolveMatch(null)}
        onSubmit={handleManualResolution}
        isSubmitting={isSubmittingRes}
      />
    </div>
  );
};

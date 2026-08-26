import { Building2, FileText, Landmark, UploadCloud, X } from 'lucide-react';
import React, { useState } from 'react';
import './FileUploadModal.module.scss';
import { UPLOAD_SOURCE_COPY } from './constants';
import type { FileUploadModalProps } from './interfaces';
import { isInternalSource } from './utils';

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  source,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const isInternal = isInternalSource(source);
  const sourceCopy = UPLOAD_SOURCE_COPY[source];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onUpload(selectedFile, source);
    setSelectedFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isInternal
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
              }`}
            >
              {isInternal ? <Building2 className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {sourceCopy.title}
              </h3>
              <p className="text-xs text-slate-400">
                {sourceCopy.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              onClose();
            }}
            className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select CSV File</label>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition bg-slate-950/60 ${
                isInternal ? 'border-slate-800 hover:border-cyan-500/50' : 'border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText className={`w-8 h-8 ${isInternal ? 'text-cyan-400' : 'text-indigo-400'}`} />
                <span className="text-xs font-medium text-slate-300">
                  {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {sourceCopy.target}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className={`px-5 py-2 rounded-xl text-slate-950 text-xs font-bold transition disabled:opacity-50 ${
                isInternal ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-indigo-400 hover:bg-indigo-300'
              }`}
            >
              {isUploading
                ? 'Ingesting...'
                : isInternal
                ? 'Ingest Internal Ledger'
                : 'Ingest External Statement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client.js';

const STAGES = ['Planning', 'Development', 'Testing', 'Review', 'Deployed'];

export default function UploadReportModal({ isOpen, onClose, projects = [], initialProjectId = null, onReportSubmitted }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'form'
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || (projects[0]?.id || ''));
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form fields
  const [currentStage, setCurrentStage] = useState('Development');
  const [progress, setProgress] = useState(65);
  const [blockers, setBlockers] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }

    if (activeTab === 'file' && !file) {
      setError('Please select a PDF, DOCX, or TXT file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('projectId', selectedProjectId);

      if (activeTab === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('currentStage', currentStage);
        formData.append('progress', progress.toString());
        formData.append('blockers', blockers);
        formData.append('nextSteps', nextSteps);
        formData.append('rawText', notes);
      }

      const res = await api.upload('/reports/upload', formData);
      setAnalysisResult(res.analysis);

      if (onReportSubmitted) {
        onReportSubmitted(res);
      }

      // Auto close after brief display of AI extraction
      setTimeout(() => {
        onClose();
        setFile(null);
        setAnalysisResult(null);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Report upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Submit Progress Report</h3>
              <p className="text-xs text-slate-500">AI-Powered Automatic Graph Update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Document (PDF / DOCX / TXT)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Manual Structured Form
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {analysisResult && (
            <div className="p-3.5 text-xs rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>AI Structured Extraction Successful!</span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <div>Stage: <strong>{analysisResult.stage}</strong> &bull; Progress: <strong>{analysisResult.progress}%</strong> &bull; Status: <strong>{analysisResult.status}</strong></div>
                <div className="text-emerald-700 dark:text-emerald-300 italic line-clamp-2">"{analysisResult.summary}"</div>
              </div>
            </div>
          )}

          {/* Project Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Target Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.department?.name || 'Dept'} &bull; {p.currentStage})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'file' ? (
            /* File Dropzone */
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attach Progress Report (.pdf, .docx, .txt)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                    : 'border-slate-300 dark:border-slate-800 hover:border-brand-400 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
                onClick={() => document.getElementById('report-file-input').click()}
              >
                <input
                  id="report-file-input"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-semibold text-sm text-brand-600 dark:text-brand-400">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB &bull; Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Drag and drop your report here, or <span className="text-brand-500 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Supports PDF, DOCX, and TXT status updates</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Structured Form Fields */
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stage
                  </label>
                  <select
                    value={currentStage}
                    onChange={(e) => setCurrentStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Progress %
                    </label>
                    <span className="text-xs font-bold font-mono text-brand-600 dark:text-brand-400">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Active Blockers & Impediments
                </label>
                <input
                  type="text"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="e.g. Awaiting third-party OAuth token approval (leave empty if none)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Steps / Upcoming Milestone
                </label>
                <input
                  type="text"
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="e.g. Performance testing and staging deployment"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Notes / Raw Text
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summary of completed sprint tickets, test coverage, team updates..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

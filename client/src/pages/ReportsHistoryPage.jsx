import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Calendar,
  Sparkles,
  Download,
  FileText,
  User,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReportsHistoryPage({ onSelectProject }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await api.get('/reports/history');
        setReports(res.reports || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Executive Report Archive
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Historical log of generative AI report extractions, stage transitions, and downloaded documents.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-brand-500" />
          Loading report archive...
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          No reports recorded in archive.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rpt) => {
            let completedTasks = [];
            let risks = [];
            try {
              completedTasks = JSON.parse(rpt.completedTasks || '[]');
              risks = JSON.parse(rpt.risks || '[]');
            } catch (e) {}

            return (
              <div
                key={rpt.id}
                className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header with Project Name & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <span
                      onClick={() => onSelectProject(rpt.project?.id)}
                      className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors cursor-pointer"
                    >
                      {rpt.project?.name || 'Project'}
                    </span>
                    <p className="text-xs text-slate-400">
                      {rpt.project?.department?.name} &bull; {rpt.project?.team?.name}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {rpt.author?.name}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono">{new Date(rpt.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* AI Executive Summary Box */}
                <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs">
                  <div className="flex items-center justify-between font-bold text-brand-600 dark:text-brand-400 mb-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      AI Executive Extraction
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500">
                      Stage: {rpt.stage} ({rpt.progress}%)
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs">
                    {rpt.summary}
                  </p>
                </div>

                {/* Tasks & Next Milestone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {completedTasks.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Completed Tasks:
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px]">
                        {completedTasks.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rpt.nextMilestone && (
                    <div>
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Upcoming Milestone:
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {rpt.nextMilestone}
                      </p>
                    </div>
                  )}
                </div>

                {/* File Download footer if file was attached */}
                {rpt.fileName && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-sm">{rpt.fileName}</span>
                    </div>

                    <a
                      href={`/api/reports/download/${rpt.fileUrl ? rpt.fileUrl.replace('/uploads/', '') : rpt.fileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-brand-500 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Original</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client.js';

const STATUS_BADGES = {
  ON_TRACK: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  AT_RISK: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  DELAYED: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

export default function ProjectSidePanel({ projectId, onClose, onUploadNewReport }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchDetails() {
      try {
        const res = await api.get(`/projects/${projectId}`);
        if (isMounted) {
          setProject(res.project);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load project details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (!projectId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Project Intelligence</h2>
              <p className="text-xs text-slate-500">AI Analysis & Report Timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm">Fetching project intelligence...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-sm">
              {error}
            </div>
          ) : project ? (
            <>
              {/* Project Meta Card */}
              <div className="rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${STATUS_BADGES[project.status] || STATUS_BADGES.ON_TRACK}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {project.priority} Priority
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{project.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {project.department?.name} &bull; {project.team?.name}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="text-right">
                    <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                      {project.progress}%
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Completion
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Deadline: <strong>{new Date(project.deadline).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Stage: <strong className="text-amber-500">{project.currentStage}</strong></span>
                  </div>
                </div>
              </div>

              {/* Active Blockers Section */}
              {project.blockers && project.blockers.some(b => !b.resolved) && (
                <div className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60">
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Active Impediments & Blockers</span>
                  </div>
                  <div className="space-y-2">
                    {project.blockers.filter(b => !b.resolved).map(blk => (
                      <div key={blk.id} className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex items-start justify-between">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{blk.description}</span>
                        <span className="ml-2 font-mono text-[10px] uppercase font-bold text-rose-500 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950">
                          {blk.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage Pipeline View */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Current Pipeline Progression
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {project.stages?.map((stg) => {
                    const isCompleted = stg.status === 'COMPLETED';
                    const isCurrent = stg.status === 'CURRENT';

                    return (
                      <div
                        key={stg.id}
                        className={`p-2.5 rounded-xl text-center border text-xs transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold ring-2 ring-amber-500/20'
                            : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-mono opacity-80">#{stg.order}</div>
                        <div className="truncate mt-0.5 text-[11px]">{stg.name}</div>
                        <div className="mt-1 text-[9px]">
                          {isCurrent ? '● Active' : isCompleted ? '✓ Done' : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Report History Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Report History & AI Syntheses ({project.reports?.length || 0})
                  </h4>
                  {onUploadNewReport && (
                    <button
                      onClick={() => onUploadNewReport(project)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      + Submit Report
                    </button>
                  )}
                </div>

                {project.reports && project.reports.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {project.reports.map((rpt, idx) => {
                      let completedTasks = [];
                      let risks = [];
                      try {
                        completedTasks = JSON.parse(rpt.completedTasks || '[]');
                        risks = JSON.parse(rpt.risks || '[]');
                      } catch (e) {}

                      return (
                        <div key={rpt.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />

                          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                            
                            {/* Author & Timestamp */}
                            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {rpt.author?.name || 'Team Member'}
                              </span>
                              <span>{new Date(rpt.createdAt).toLocaleString()}</span>
                            </div>

                            {/* AI Summary Highlight */}
                            <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs">
                              <div className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 mb-1 text-[11px]">
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Executive Summary &bull; Stage: {rpt.stage} ({rpt.progress}%)
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                                {rpt.summary}
                              </p>
                            </div>

                            {/* Completed tasks bullet points */}
                            {completedTasks.length > 0 && (
                              <div className="text-xs">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                                  Tasks Completed:
                                </span>
                                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px]">
                                  {completedTasks.map((t, i) => (
                                    <li key={i}>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Next milestone */}
                            {rpt.nextMilestone && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                                <span>Next: <strong>{rpt.nextMilestone}</strong></span>
                              </div>
                            )}

                            {/* Download Original Document if file exists */}
                            {rpt.fileName && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[240px]">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  {rpt.fileName}
                                </span>
                                <a
                                  href={`/api/reports/download/${rpt.fileUrl ? rpt.fileUrl.replace('/uploads/', '') : rpt.fileName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-brand-500 hover:text-white transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  Download Report
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No progress reports filed yet for this project.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

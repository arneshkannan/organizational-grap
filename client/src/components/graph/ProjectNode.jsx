import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertCircle, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';

const STAGES = ['Planning', 'Development', 'Testing', 'Review', 'Deployed'];

const STATUS_CONFIG = {
  ON_TRACK: {
    label: 'On Track',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    ringColor: '#10b981',
    glow: 'hover:border-emerald-500/50',
  },
  AT_RISK: {
    label: 'At Risk',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    ringColor: '#f59e0b',
    glow: 'hover:border-amber-500/50',
  },
  DELAYED: {
    label: 'Delayed',
    badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    ringColor: '#f43f5e',
    glow: 'hover:border-rose-500/50',
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    ringColor: '#3b82f6',
    glow: 'hover:border-blue-500/50',
  },
};

export default function ProjectNode({ data, selected }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const statusInfo = STATUS_CONFIG[data.status] || STATUS_CONFIG.ON_TRACK;
  const progress = Math.min(100, Math.max(0, data.progress || 0));

  // Circular progress calculations (Radius = 18, circumference = 2 * PI * 18 = ~113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentStageIndex = STAGES.indexOf(data.currentStage);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border-2 transition-all duration-200 cursor-pointer ${
          selected
            ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-2xl scale-[1.02]'
            : 'border-slate-200 dark:border-slate-800 ' + statusInfo.glow
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3.5 h-3.5 !bg-sky-400 border-2 border-white dark:border-slate-900"
        />

        {/* Card Header with Name & Circular Progress */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${statusInfo.badge}`}>
                  {statusInfo.label}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {data.priority}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate leading-snug">
                {data.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {data.departmentName} &bull; {data.teamName}
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  stroke={statusInfo.ringColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-bold text-[11px] text-slate-800 dark:text-slate-200 font-mono">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Stage Pipeline Indicator */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Stage Pipeline
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.currentStage}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 relative">
            {STAGES.map((stg, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isFuture = idx > currentStageIndex;

              return (
                <div key={stg} className="flex-1 flex flex-col items-center group/stage">
                  <div className="w-full flex items-center">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                        isPast
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[8.5px] mt-1 font-mono tracking-tight truncate max-w-[50px] ${
                      isCurrent
                        ? 'font-bold text-amber-500 dark:text-amber-400'
                        : isPast
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {stg.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Blockers preview if any */}
          {data.blockers && data.blockers.length > 0 && (
            <div className="mt-2 pt-2 border-t border-rose-200/40 dark:border-rose-900/40 flex items-center gap-1.5 text-rose-500 text-[10px] font-medium">
              <AlertCircle className="w-3 h-3 flex-shrink-0 animate-pulse" />
              <span className="truncate">{data.blockers[0]}</span>
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3.5 h-3.5 !bg-amber-400 border-2 border-white dark:border-slate-900"
        />
      </div>

      {/* Hover Tooltip with AI Summary, Last Updated Date & Blockers */}
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 p-3.5 rounded-xl bg-slate-900/95 text-white text-xs shadow-2xl backdrop-blur-md border border-slate-700/80 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-semibold text-brand-300 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3" />
              AI Executive Summary
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'Recent'}
            </span>
          </div>

          <p className="text-[11px] text-slate-200 leading-relaxed line-clamp-3">
            {data.summary || 'No summary available for this project.'}
          </p>

          {data.blockers && data.blockers.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800">
              <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Active Blockers ({data.blockers.length})
              </div>
              <ul className="text-[10px] text-rose-200/90 space-y-1 list-disc list-inside">
                {data.blockers.map((b, i) => (
                  <li key={i} className="truncate">{b}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9.5px] text-slate-400 text-center font-mono">
            Click project node to open full intelligence panel &rarr;
          </div>
        </div>
      )}
    </div>
  );
}

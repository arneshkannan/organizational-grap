import React, { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

export default function GraphLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-5 right-5 z-20 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 text-xs transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
          <HelpCircle className="w-4 h-4 text-brand-500" />
          <span>Knowledge Graph Legend</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Node Types (Top &rarr; Bottom)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span className="text-slate-700 dark:text-slate-300">Organization</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-slate-700 dark:text-slate-300">Department</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                <span className="text-slate-700 dark:text-slate-300">Team</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">Project Card</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-slate-700 dark:text-slate-300">Active Stage</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-700 dark:text-slate-300">Blocker Alert</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Health Badges
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                ● On Track
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                ● At Risk
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold">
                ● Delayed
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">
                ● Done
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Live Edge Relations
            </div>
            <div className="text-[10.5px] space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>HAS_DEPT / TEAM</span>
                <span className="w-8 h-0.5 bg-indigo-500 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span>CURRENTLY_IN_STAGE</span>
                <span className="w-8 h-0.5 bg-amber-400 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <span>BLOCKED_BY</span>
                <span className="w-8 h-0.5 bg-rose-500 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

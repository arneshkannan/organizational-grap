import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, Briefcase } from 'lucide-react';

const DEPT_COLORS = {
  Engineering: { border: 'border-blue-500/50', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'text-blue-400' },
  Marketing: { border: 'border-purple-500/50', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'text-purple-400' },
  HR: { border: 'border-pink-500/50', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: 'text-pink-400' },
  Finance: { border: 'border-emerald-500/50', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'text-emerald-400' },
  Operations: { border: 'border-amber-500/50', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'text-amber-400' },
  default: { border: 'border-slate-500/50', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: 'text-slate-400' },
};

export default function DeptNode({ data }) {
  const styling = DEPT_COLORS[data.name] || DEPT_COLORS.default;

  return (
    <div className={`w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border-2 ${styling.border} p-3.5 transition-all hover:shadow-2xl`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-indigo-400 border-2 border-white dark:border-slate-900"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Network className={`w-4 h-4 ${styling.icon}`} />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">{data.name}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Dept / {data.code}
            </span>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${styling.badge}`}>
          {data.projectCount || 0} {data.projectCount === 1 ? 'proj' : 'projs'}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-400 border-2 border-white dark:border-slate-900"
      />
    </div>
  );
}

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, CircleDot, Clock } from 'lucide-react';

export default function StageNode({ data }) {
  const isCurrent = data.status === 'CURRENT';
  const isCompleted = data.status === 'COMPLETED';

  return (
    <div
      className={`w-44 rounded-xl px-3 py-2 shadow-md border transition-all text-xs ${
        isCurrent
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/30 animate-pulse-glow'
          : isCompleted
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`w-2.5 h-2.5 border-2 border-white dark:border-slate-900 ${
          isCurrent ? '!bg-amber-400' : isCompleted ? '!bg-emerald-400' : '!bg-slate-400'
        }`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : isCurrent ? (
            <CircleDot className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {data.name}
            </div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
              Stage #{data.order}
            </div>
          </div>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            isCurrent
              ? 'bg-amber-500 text-white'
              : isCompleted
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {isCurrent ? 'ACTIVE' : isCompleted ? 'DONE' : 'NEXT'}
        </span>
      </div>
    </div>
  );
}

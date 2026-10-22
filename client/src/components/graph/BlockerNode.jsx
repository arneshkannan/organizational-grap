import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function BlockerNode({ data }) {
  return (
    <div className="w-64 rounded-xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500/60 shadow-lg p-2.5 text-xs text-rose-900 dark:text-rose-200">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-rose-500 border-2 border-white dark:border-slate-900"
      />

      <div className="flex items-start space-x-2">
        <div className="p-1 rounded-md bg-rose-500/20 text-rose-500 flex-shrink-0 mt-0.5">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Blocker / {data.severity || 'HIGH'}
            </span>
            <span className="text-[9px] px-1 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
              Unresolved
            </span>
          </div>
          <p className="text-[11px] font-medium leading-snug mt-1 line-clamp-2">
            {data.description}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users2 } from 'lucide-react';

export default function TeamNode({ data }) {
  return (
    <div className="w-60 rounded-xl bg-white dark:bg-slate-900/90 shadow-lg border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-400 transition-all">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-400 border-2 border-white dark:border-slate-900"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-500">
            <Users2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="font-medium text-xs text-slate-800 dark:text-slate-200">{data.name}</h5>
            <p className="text-[10px] text-slate-400">{data.departmentName}</p>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {data.projectCount || 0} active
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-sky-400 border-2 border-white dark:border-slate-900"
      />
    </div>
  );
}

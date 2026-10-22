import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, Layers, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function OrgNode({ data }) {
  return (
    <div className="w-80 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 shadow-2xl border-2 border-indigo-500/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30">
            <Building2 className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">{data.label || 'OrgGraph Enterprise'}</h3>
            <p className="text-[11px] text-indigo-300/80">Self-Updating Organizational Graph</p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
          Root Node
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
          <div className="font-bold text-base text-white mt-0.5">{data.totalProjects || 0}</div>
        </div>
        <div className="bg-emerald-950/40 rounded-lg p-2 border border-emerald-500/30">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider">On Track</div>
          <div className="font-bold text-base text-emerald-300 mt-0.5">{data.onTrackCount || 0}</div>
        </div>
        <div className="bg-amber-950/40 rounded-lg p-2 border border-amber-500/30">
          <div className="text-[10px] text-amber-400 uppercase tracking-wider">At Risk</div>
          <div className="font-bold text-base text-amber-300 mt-0.5">{data.atRiskCount || 0}</div>
        </div>
        <div className="bg-rose-950/40 rounded-lg p-2 border border-rose-500/30">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider">Delayed</div>
          <div className="font-bold text-base text-rose-300 mt-0.5">{data.delayedCount || 0}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 !bg-indigo-400 border-2 border-slate-900"
      />
    </div>
  );
}

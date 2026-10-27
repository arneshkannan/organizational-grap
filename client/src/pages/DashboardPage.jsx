import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Network,
  ArrowRight,
  TrendingUp,
  Building,
  PlusCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const STATUS_CONFIG = {
  ON_TRACK: { label: 'On Track', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  AT_RISK: { label: 'At Risk', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  DELAYED: { label: 'Delayed', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  COMPLETED: { label: 'Completed', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
};

export default function DashboardPage({ onNavigateToGraph, onSelectProject, onOpenAssignModal, onOpenUploadModal }) {
  const { user } = useAuth();
  const { addListener } = useSocket();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const isManager = user?.role === 'MANAGER';

  const loadData = async () => {
    try {
      const [deptRes, projRes, repRes] = await Promise.all([
        api.get('/departments'),
        api.get(selectedDept !== 'ALL' ? `/projects?departmentId=${selectedDept}` : '/projects'),
        api.get('/reports/history'),
      ]);

      setDepartments(deptRes.departments || []);
      setProjects(projRes.projects || []);
      setReports(repRes.reports ? repRes.reports.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedDept]);

  // Live WebSocket updates
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (
        event.type === 'REPORT_PROCESSED' ||
        event.type === 'PROJECT_CREATED' ||
        event.type === 'PROJECT_DELETED'
      ) {
        loadData();
      }
    });
    return () => unsubscribe();
  }, [addListener, selectedDept]);

  // Compute metrics
  const totalProjects = projects.length;
  const onTrackCount = projects.filter(p => p.status === 'ON_TRACK').length;
  const atRiskCount = projects.filter(p => p.status === 'AT_RISK').length;
  const delayedCount = projects.filter(p => p.status === 'DELAYED').length;
  const completedCount = projects.filter(p => p.status === 'COMPLETED').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isManager ? 'Enterprise Project Health Dashboard' : `${user?.departmentName || 'Team'} Department Portal`}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time project tracking synthesized automatically from generative AI status reports.
          </p>
        </div>

        {/* Department Filter (For Managers) */}
        {isManager && (
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Building className="w-4 h-4 text-slate-400 ml-2" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 pr-4 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-3 font-mono">
            {totalProjects}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monitored in graph</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span>On Track</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3 font-mono">
            {onTrackCount}
          </div>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            {totalProjects ? Math.round((onTrackCount / totalProjects) * 100) : 0}% of portfolio
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>At Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3 font-mono">
            {atRiskCount}
          </div>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">Requires mitigation</p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <span>Delayed</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-3 font-mono">
            {delayedCount}
          </div>
          <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70 mt-1">Active impediments</p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Completed</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-3 font-mono">
            {completedCount}
          </div>
          <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">Successfully deployed</p>
        </div>
      </div>

      {/* Main Knowledge Graph Callout Card */}
      <div className="rounded-3xl p-7 bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 border border-brand-500/30 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Core Knowledge Engine
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Self-Updating Organizational Knowledge Graph
          </h2>
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            Explore the full top-to-bottom hierarchy from Corporate Strategy down to Department pipelines, project progress rings, active stage pulses, and blockers.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateToGraph}
            className="px-6 py-3 rounded-2xl bg-white text-slate-900 hover:bg-brand-50 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <Network className="w-4 h-4 text-brand-600" />
            <span>Launch Graph View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Overview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Projects ({projects.length})
          </h3>
          {isManager ? (
            <button
              onClick={onOpenAssignModal}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Project</span>
            </button>
          ) : (
            <button
              onClick={onOpenUploadModal}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Report</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading projects...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const statusCfg = STATUS_CONFIG[proj.status] || STATUS_CONFIG.ON_TRACK;
              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-brand-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        {proj.progress}%
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {proj.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {proj.description}
                    </p>
                  </div>

                  <div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Stage: <strong className="text-amber-500">{proj.currentStage}</strong></span>
                      <span className="text-[11px]">{proj.team?.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

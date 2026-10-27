import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Building,
  PlusCircle,
  FileText,
  Network,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const STATUS_BADGES = {
  ON_TRACK: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  AT_RISK: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  DELAYED: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

export default function ProjectsPage({ onSelectProject, onNavigateToGraph, onOpenAssignModal, onOpenUploadModal }) {
  const { user } = useAuth();
  const { addListener } = useSocket();
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await api.get('/departments');
        setDepartments(res.departments || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, []);

  const loadProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDept !== 'ALL') params.append('departmentId', selectedDept);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/projects?${params.toString()}`);
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProjects();
  }, [selectedDept, selectedStatus, search]);

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (
        event.type === 'REPORT_PROCESSED' ||
        event.type === 'PROJECT_CREATED' ||
        event.type === 'PROJECT_DELETED'
      ) {
        loadProjects();
      }
    });

    return () => unsubscribe();
  }, [addListener, selectedDept, selectedStatus, search]);

  // Manager delete project handler
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setActionFeedback({
        type: 'success',
        message: `Project "${projectToDelete.name}" deleted successfully along with all associated stages, reports, and blockers.`,
      });
      setProjectToDelete(null);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to delete project:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to delete project.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Feedback banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Portfolio Project Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track stage pipelines, active completion metrics, and blocker alerts across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isManager ? (
            <button
              onClick={onOpenAssignModal}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 shadow-md shadow-brand-600/20 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create / Assign Project</span>
            </button>
          ) : (
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Submit Progress Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by project name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Filter */}
          {isManager && (
            <div className="flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Health Statuses</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="DELAYED">Delayed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{projects.length}</strong> projects
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-brand-500" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No projects matched your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Department / Team</th>
                  <th className="py-3.5 px-4">Current Stage</th>
                  <th className="py-3.5 px-4">Progress %</th>
                  <th className="py-3.5 px-4">Health Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projects.map((proj) => {
                  const badgeClass = STATUS_BADGES[proj.status] || STATUS_BADGES.ON_TRACK;
                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectProject(proj.id)}
                    >
                      {/* Name & Priority */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {proj.description}
                        </div>
                      </td>

                      {/* Department / Team */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold">{proj.department?.name}</div>
                        <div className="text-[11px] text-slate-400">{proj.team?.name}</div>
                      </td>

                      {/* Stage Pipeline */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {proj.currentStage}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {proj.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Health Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {proj.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(proj.lastUpdated).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectProject(proj.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition-colors text-[11px] font-semibold"
                        >
                          Intelligence
                        </button>
                        <button
                          onClick={() => onNavigateToGraph()}
                          className="p-1 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center"
                          title="View on Knowledge Graph"
                        >
                          <Network className="w-4 h-4" />
                        </button>

                        {/* Manager Delete Button */}
                        {isManager && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(proj);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors inline-flex items-center"
                            title="Delete Project (Manager Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Manager */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Delete Project</h3>
                <p className="text-xs text-slate-500">Manager Authorization Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-slate-100">"{projectToDelete.name}"</strong>? All associated 5-stage milestones, uploaded reports, and active blockers will be completely purged from the knowledge graph. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteProject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Project...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

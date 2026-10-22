import React from 'react';
import {
  LayoutDashboard,
  Network,
  FolderGit2,
  FileCheck2,
  PlusCircle,
  UploadCloud,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Sidebar({ activePage, setActivePage, onOpenAssignModal, onOpenUploadModal }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isManager = user?.role === 'MANAGER';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'graph', label: 'Knowledge Graph', icon: Network, highlight: true },
    { id: 'projects', label: 'Projects List', icon: FolderGit2 },
    { id: 'reports', label: 'Report History', icon: FileCheck2 },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 flex-shrink-0 transition-colors z-30">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
              OrgGraph
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand-500/10 text-brand-500 border border-brand-500/20">
                AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Self-Updating Graph</p>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {user?.name}
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isManager
                  ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                  : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
              }`}>
                {user?.role}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.departmentName || 'All Depts'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-bold">
                  Core
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Action Button */}
        <div className="pt-4 px-1">
          {isManager ? (
            <button
              onClick={onOpenAssignModal}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:shadow-lg hover:from-brand-500 hover:to-indigo-500 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Project</span>
            </button>
          ) : (
            <button
              onClick={onOpenUploadModal}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Report</span>
            </button>
          )}
        </div>
      </nav>

      {/* Footer & Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-slate-400">{theme}</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

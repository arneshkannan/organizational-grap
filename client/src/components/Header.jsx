import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ title, subtitle, onSelectProject }) {
  const { isConnected, notifications, dismissNotification, clearAllNotifications } = useSocket();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.length;

  return (
    <header className="h-16 px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Realtime WebSocket Pulse Status */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {isConnected ? 'Live WebSocket Active' : 'Offline'}
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Live Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Team Updates</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-bold">
                    {unreadCount}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto mt-3 space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No new activity notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs relative group"
                    >
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>{n.title}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-snug pr-4">
                        {n.message}
                      </p>

                      {n.details && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Stage: <strong className="text-amber-500">{n.details.stage}</strong> ({n.details.progress}%)</span>
                          <span>{n.time}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

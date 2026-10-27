import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();

  const [role, setRole] = useState('EMPLOYEE'); // Default to EMPLOYEE as shown in the mockup
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Optional manual credentials drawer toggle
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google SSO simulated dialog
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);

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

  // Update available accounts based on selected role & department
  useEffect(() => {
    if (role === 'MANAGER') {
      setAvailableAccounts([
        {
          name: 'Eleanor Vance',
          email: 'manager@orggraph.internal',
          dept: 'Executive Management',
          avatarText: 'EV'
        }
      ]);
      setEmail('manager@orggraph.internal');
      setPassword('Manager@123');
    } else {
      const dept = departments.find(d => d.id === selectedDeptId);
      if (dept) {
        if (dept.name === 'Engineering') {
          setAvailableAccounts([
            { name: 'Alice Chen', email: 'alice@eng.orggraph.internal', dept: 'Engineering (Frontend Core)', avatarText: 'AC' },
            { name: 'Bob Martinez', email: 'bob@eng.orggraph.internal', dept: 'Engineering (Backend & Cloud)', avatarText: 'BM' }
          ]);
          setEmail('alice@eng.orggraph.internal');
        } else if (dept.name === 'Marketing') {
          setAvailableAccounts([
            { name: 'Charlie Kim', email: 'charlie@mkt.orggraph.internal', dept: 'Marketing (Growth)', avatarText: 'CK' },
            { name: 'Diana Ross', email: 'diana@mkt.orggraph.internal', dept: 'Marketing (Brand)', avatarText: 'DR' }
          ]);
          setEmail('charlie@mkt.orggraph.internal');
        } else if (dept.name === 'HR') {
          setAvailableAccounts([
            { name: 'Evan Wright', email: 'evan@hr.orggraph.internal', dept: 'HR (Talent)', avatarText: 'EW' }
          ]);
          setEmail('evan@hr.orggraph.internal');
        } else if (dept.name === 'Finance') {
          setAvailableAccounts([
            { name: 'George Bailey', email: 'george@fin.orggraph.internal', dept: 'Finance (FP&A)', avatarText: 'GB' }
          ]);
          setEmail('george@fin.orggraph.internal');
        } else {
          setAvailableAccounts([
            { name: 'Ian Malcolm', email: 'ian@ops.orggraph.internal', dept: 'Operations (Cloud)', avatarText: 'IM' }
          ]);
          setEmail('ian@ops.orggraph.internal');
        }
        setPassword('Employee@123');
      } else {
        setAvailableAccounts([]);
      }
    }
  }, [role, selectedDeptId, departments]);

  const handleGoogleClick = () => {
    setError(null);
    if (role === 'EMPLOYEE' && !selectedDeptId) {
      setError('Please select your department first.');
      return;
    }
    setShowGooglePicker(true);
  };

  const executeGoogleLogin = async (chosenEmail) => {
    setLoading(true);
    setError(null);
    setShowGooglePicker(false);

    try {
      await loginWithGoogle({
        role,
        departmentId: role === 'EMPLOYEE' ? selectedDeptId : undefined,
        email: chosenEmail
      });
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({
        email,
        password,
        role,
        departmentId: role === 'EMPLOYEE' ? selectedDeptId : undefined,
      });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a1514] text-white relative overflow-hidden font-sans select-none">
      
      {/* Background Connected Graph Network */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3d8276" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#25574e" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Network connection lines */}
        {/* Left cluster */}
        <line x1="28%" y1="26%" x2="18%" y2="50%" stroke="#1c473f" strokeWidth="2.5" />
        <line x1="18%" y1="50%" x2="32%" y2="76%" stroke="#1c473f" strokeWidth="2.5" />
        <line x1="28%" y1="26%" x2="42%" y2="40%" stroke="#163c35" strokeWidth="2" strokeDasharray="6,6" />

        {/* Right cluster */}
        <line x1="72%" y1="29%" x2="84%" y2="53%" stroke="#1c473f" strokeWidth="2.5" />
        <line x1="72%" y1="29%" x2="62%" y2="45%" stroke="#163c35" strokeWidth="2" strokeDasharray="6,6" />
        <line x1="84%" y1="53%" x2="71%" y2="75%" stroke="#1c473f" strokeWidth="2.5" />

        {/* Left Graph Nodes */}
        <circle cx="28%" cy="26%" r="22" fill="url(#nodeGlow)" />
        <circle cx="18%" cy="50%" r="14" fill="url(#nodeGlow)" />
        <circle cx="32%" cy="76%" r="22" fill="url(#nodeGlow)" />

        {/* Right Graph Nodes */}
        <circle cx="72%" cy="29%" r="22" fill="url(#nodeGlow)" />
        <circle cx="84%" cy="53%" r="14" fill="url(#nodeGlow)" />
        <circle cx="71%" cy="75%" r="22" fill="url(#nodeGlow)" />
      </svg>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[440px] relative z-10 bg-[#0e221f] border border-[#1f4a42]/70 rounded-2xl p-8 shadow-2xl shadow-black/60 transition-all duration-300">
        
        {/* Product Name Header */}
        <div className="text-[#38b29c] font-medium text-sm tracking-wide mb-1">
          [OrgGraph]
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-6 tracking-tight">
          Sign in
        </h1>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Role Toggle (Manager | Employee) */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#081614] border border-[#153a32] mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('MANAGER');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              role === 'MANAGER'
                ? 'bg-[#147a6e] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('EMPLOYEE');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              role === 'EMPLOYEE'
                ? 'bg-[#147a6e] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Employee
          </button>
        </div>

        {/* Department Selector */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Department
          </label>
          <div className="relative">
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setError(null);
              }}
              className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-[#081614] border border-[#183e36] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#147a6e] cursor-pointer"
            >
              <option value="" disabled className="text-slate-500">
                Select your department
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-[#0e221f] text-white">
                  {dept.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {role === 'MANAGER' && (
            <p className="text-[11px] text-teal-300/60 mt-1">
              * Managers have organization-wide access across all departments.
            </p>
          )}
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md flex items-center justify-center gap-2.5 transition-all duration-150 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Footer Subtext */}
        <p className="text-xs text-slate-400 text-center mt-3">
          Use your organization&apos;s Google account.
        </p>

        {/* Manual Credentials Toggle */}
        <div className="mt-6 pt-4 border-t border-[#183e36]/70 text-center">
          <button
            type="button"
            onClick={() => setShowManualLogin(!showManualLogin)}
            className="text-[11px] text-teal-300/70 hover:text-teal-200 transition-colors"
          >
            {showManualLogin ? '▲ Hide manual credentials' : '▼ Or sign in with password'}
          </button>

          {showManualLogin && (
            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3 text-left">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@orggraph.internal"
                  className="w-full px-3 py-2 rounded-xl bg-[#081614] border border-[#183e36] text-white text-xs focus:ring-1 focus:ring-[#147a6e]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#081614] border border-[#183e36] text-white text-xs focus:ring-1 focus:ring-[#147a6e]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#147a6e] hover:bg-[#10655b] text-white font-semibold text-xs transition-colors"
              >
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Google Organization SSO Account Picker Modal */}
      {showGooglePicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center space-x-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Google Workspace SSO
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select your organization profile
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 py-1">
              {availableAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => executeGoogleLogin(acc.email)}
                  className="w-full py-3 px-2 flex items-center space-x-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {acc.avatarText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {acc.email}
                    </div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      {acc.dept}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowGooglePicker(false)}
                className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

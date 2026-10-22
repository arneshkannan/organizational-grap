import React, { useState, useEffect } from 'react';
import {
  Network,
  Shield,
  User,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginPage() {
  const { login } = useAuth();

  const [role, setRole] = useState('MANAGER'); // 'MANAGER' or 'EMPLOYEE'
  const [email, setEmail] = useState('manager@orggraph.internal');
  const [password, setPassword] = useState('Manager@123');
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await api.get('/departments');
        setDepartments(res.departments);
        if (res.departments.length > 0) {
          const eng = res.departments.find(d => d.name === 'Engineering') || res.departments[0];
          setDepartmentId(eng.id);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, []);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'MANAGER') {
      setEmail('manager@orggraph.internal');
      setPassword('Manager@123');
    } else {
      const eng = departments.find(d => d.name === 'Engineering') || departments[0];
      if (eng) setDepartmentId(eng.id);
      setEmail('alice@eng.orggraph.internal');
      setPassword('Employee@123');
    }
  };

  const handleDeptSelect = (deptId) => {
    setDepartmentId(deptId);
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      if (dept.name === 'Engineering') setEmail('alice@eng.orggraph.internal');
      else if (dept.name === 'Marketing') setEmail('charlie@mkt.orggraph.internal');
      else if (dept.name === 'HR') setEmail('evan@hr.orggraph.internal');
      else if (dept.name === 'Finance') setEmail('george@fin.orggraph.internal');
      else if (dept.name === 'Operations') setEmail('ian@ops.orggraph.internal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({
        email,
        password,
        role,
        departmentId: role === 'EMPLOYEE' ? departmentId : undefined,
      });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/30 mb-4 border border-brand-400/30">
            <Network className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">OrgGraph</h1>
          <p className="text-sm text-indigo-200/80 mt-1">
            Self-Updating Organizational Knowledge Graph
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-7 shadow-2xl space-y-6">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Login Role
            </label>
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleChange('MANAGER')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  role === 'MANAGER'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Manager</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('EMPLOYEE')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  role === 'EMPLOYEE'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Employee</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Department Selector for Employees */}
            {role === 'EMPLOYEE' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  Your Department *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => handleDeptSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Employees have strict RBAC access to their own department.
                </p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@orggraph.internal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                role === 'MANAGER'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {role === 'MANAGER' ? 'Manager' : 'Employee'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-1 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleRoleChange('MANAGER');
                  setEmail('manager@orggraph.internal');
                  setPassword('Manager@123');
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-white text-xs">Manager</div>
                <div className="text-[10px] text-slate-400 truncate">manager@orggraph.internal</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRoleChange('EMPLOYEE');
                  const eng = departments.find(d => d.name === 'Engineering');
                  if (eng) setDepartmentId(eng.id);
                  setEmail('alice@eng.orggraph.internal');
                  setPassword('Employee@123');
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-emerald-400 text-xs">Engineer</div>
                <div className="text-[10px] text-slate-400 truncate">alice@eng.orggraph.internal</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

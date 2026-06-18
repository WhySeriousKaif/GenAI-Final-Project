// =========================================================================
// Login & User Account Management Workspace Page
// =========================================================================
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User as UserIcon, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirection target
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    if (!username || !password || (!isLogin && !email)) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await login(username, password);
        if (res.success) {
          navigate(from, { replace: true });
        } else {
          setError(res.message);
        }
      } else {
        const res = await register(username, email, password, role);
        if (res.success) {
          setInfo('Account registered successfully! Redirecting...');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
        } else {
          setError(res.message);
        }
      }
    } catch {
      setError('An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Macro to automatically register and log in a demo role
  const handleDemoLogin = async (demoRole) => {
    setError('');
    setInfo('');
    setSubmitting(true);

    const demoUser = demoRole === 'admin' ? 'demoadmin' : 'demouser';
    const demoEmail = demoRole === 'admin' ? 'admin@lexicore.ai' : 'user@lexicore.ai';
    const demoPass = 'password123';

    try {
      // First attempt log in
      let res = await login(demoUser, demoPass);
      if (res.success) {
        navigate(from, { replace: true });
        return;
      }

      // If login failed (e.g. user does not exist), register the user
      setInfo(`Creating demo ${demoRole} account...`);
      const regRes = await register(demoUser, demoEmail, demoPass, demoRole);
      if (regRes.success) {
        setInfo(`Demo ${demoRole} registered! Redirecting to workspace...`);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 800);
      } else {
        setError(regRes.message || 'Failed to auto-register demo user.');
        setSubmitting(false);
      }
    } catch {
      setError('Connection failed during demo sign-in.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10 animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl -z-10 animate-glow" style={{ animationDelay: '-3s' }}></div>

      <div className="w-full max-w-md bg-navy-900 border border-navy-850 rounded-2xl p-6 shadow-2xl relative">
        
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2.5 bg-blue-950/50 rounded-xl border border-blue-900/30 text-blue-500 mb-2.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isLogin ? 'Access LexiCore AI Portal' : 'Register AI Legal Workspace'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin 
              ? 'Provide credentials to enter the document workspace.' 
              : 'Create an account to configure legal contract parameters.'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 bg-red-950/30 border border-red-900/40 text-red-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="mb-4 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 p-2.5 rounded-lg text-xs flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-navy-950 border border-navy-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-navy-950 border border-navy-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-navy-950 border border-navy-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Workspace Role Authorization
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'user'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-[#15192b] border-navy-850 text-slate-400 hover:bg-navy-800'
                  }`}
                >
                  Legal Staff (User)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-[#15192b] border-navy-850 text-slate-400 hover:bg-navy-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Systems Admin
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 rounded-xl text-xs active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Enter Workspace' : 'Initialize Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-4 text-xs">
          <span className="text-slate-400">
            {isLogin ? "Don't have an account? " : "Already configured? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setInfo('');
            }}
            className="text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            {isLogin ? 'Register now' : 'Log in here'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-navy-850"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest text-slate-500">
            <span className="bg-navy-900 px-2">Academic Review & Viva Tools</span>
          </div>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="space-y-2">
          <p className="text-[10px] text-center text-slate-400">
            Quickly authenticate role credentials with 1-click bypass:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('user')}
              disabled={submitting}
              className="py-1.5 px-3 rounded-lg border border-navy-800 bg-[#161a2e] hover:bg-[#1e233d] text-slate-200 text-[10px] font-semibold transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-slate-300">Demo Legal Staff</span>
              <span className="text-[9px] text-slate-500">Read-Only Access</span>
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={submitting}
              className="py-1.5 px-3 rounded-lg border border-navy-800 bg-[#161a2e] hover:bg-[#1e233d] text-slate-200 text-[10px] font-semibold transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Demo Administrator
              </span>
              <span className="text-[9px] text-slate-500">Full Access (Wipe DB)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

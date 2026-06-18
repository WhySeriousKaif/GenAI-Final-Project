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
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-canvas text-body font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-surface-cream-strong/40 rounded-full blur-3xl -z-10 animate-glow" style={{ animationDelay: '-3s' }}></div>

      <div className="w-full max-w-md bg-surface-card border border-hairline rounded-2xl p-6 shadow-md relative">
        
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2.5 bg-canvas rounded-xl border border-hairline text-primary mb-2.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-serif text-ink tracking-tight font-medium">
            {isLogin ? 'Access LexiCore AI Portal' : 'Register AI Legal Workspace'}
          </h2>
          <p className="text-xs text-muted mt-1.5">
            {isLogin 
              ? 'Provide credentials to enter the document workspace.' 
              : 'Create an account to configure legal contract parameters.'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-error p-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="mb-4 bg-green-50 border border-green-200 text-success p-2.5 rounded-lg text-xs flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">
                Workspace Role Authorization
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'user'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-canvas border-hairline text-muted hover:bg-surface-soft'
                  }`}
                >
                  Legal Staff (User)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-canvas border-hairline text-muted hover:bg-surface-soft'
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
            className="w-full btn-primary py-2.5 text-xs rounded-xl"
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Enter Workspace' : 'Initialize Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-4 text-xs">
          <span className="text-muted">
            {isLogin ? "Don't have an account? " : "Already configured? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setInfo('');
            }}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            {isLogin ? 'Register now' : 'Log in here'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest text-muted">
            <span className="bg-surface-card px-2">Academic Review & Viva Tools</span>
          </div>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="space-y-2">
          <p className="text-[10px] text-center text-muted">
            Quickly authenticate role credentials with 1-click bypass:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('user')}
              disabled={submitting}
              className="py-1.5 px-3 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-ink text-[10px] font-semibold transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-ink">Demo Legal Staff</span>
              <span className="text-[9px] text-muted">Read-Only Access</span>
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={submitting}
              className="py-1.5 px-3 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-ink text-[10px] font-semibold transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-primary flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Demo Administrator
              </span>
              <span className="text-[9px] text-muted">Full Access (Wipe DB)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

}

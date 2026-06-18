// =========================================================================
// Main Navigation Header Component
// =========================================================================
// This component provides navigation links to move between pages.
// It features a premium, semi-translucent glass effect with responsive links
// and clear active-route styling using React Router.


import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, Settings, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to determine if a route is currently active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  // Build nav list based on auth status
  const navItems = [];
  if (user) {
    navItems.push(
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/upload', label: 'Upload', icon: UploadCloud },
      { path: '/compare', label: 'Compare', icon: FileText },
      { path: '/chat', label: 'Chat Console', icon: MessageSquare }
    );

    // Only allow admin dashboard link for admin users
    if (user.role === 'admin') {
      navItems.push({ path: '/admin', label: 'Admin Panel', icon: Settings });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-navy-950/80 backdrop-blur-md border-b border-navy-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200">
              <svg className="h-6 w-6 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#nav-shield-gradient)" />
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="11" r="2.5" fill="#ffffff" />
                <circle cx="12" cy="6" r="1.5" fill="#93c5fd" />
                <circle cx="8" cy="13" r="1.5" fill="#93c5fd" />
                <circle cx="16" cy="13" r="1.5" fill="#93c5fd" />
                <line x1="12" y1="7.5" x2="12" y2="9.5" stroke="#bfdbfe" strokeWidth="1" />
                <line x1="9.5" y1="12.5" x2="11" y2="11.5" stroke="#bfdbfe" strokeWidth="1" />
                <line x1="14.5" y1="12.5" x2="13" y2="11.5" stroke="#bfdbfe" strokeWidth="1" />
                <defs>
                  <linearGradient id="nav-shield-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                LexiCore AI
              </span>
              <span className="hidden sm:block text-[9px] text-slate-400 font-medium -mt-1 uppercase tracking-widest">
                Legal AI Platform
              </span>
            </div>
          </Link>
 
          {/* Navigation Links & Action triggers */}
          <div className="flex items-center gap-4">
            {user && (
              <nav className="flex space-x-1 sm:space-x-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20'
                          : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-navy-800/80">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{user.username}</span>
                  <span className="text-[9px] text-blue-400 font-medium uppercase tracking-wider">{user.role}</span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="px-2.5 py-1.5 bg-[#15192b] hover:bg-[#1e233d] text-slate-300 border border-navy-800 rounded-lg text-xs font-bold active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-950/20 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;

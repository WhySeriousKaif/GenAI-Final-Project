// =========================================================================
// Main Navigation Header Component
// =========================================================================
// This component provides navigation links to move between pages.
// It features a premium, semi-translucent glass effect with responsive links
// and clear active-route styling using React Router.

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, Settings, MessageSquare, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTopContributors } from '../data/contributorsMock';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
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
    <header className="sticky top-0 z-50 w-full bg-canvas/90 backdrop-blur-md border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-linear-to-br from-primary to-primary-active rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
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
              <span className="text-lg font-bold tracking-tight text-ink font-serif">
                LexiCore AI
              </span>
              <span className="hidden sm:block text-[9px] text-primary font-semibold -mt-1 uppercase tracking-widest font-sans">
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
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-body hover:text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
 
            {/* Contributor Avatar Stack */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-navy-800/80">
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Team:</span>
                <div className="contributor-stack group">
                  {getTopContributors().map((contributor) => (
                    <div
                      key={contributor.id}
                      className={`contributor-badge w-7 h-7 bg-linear-to-br ${contributor.avatarColor}`}
                      title={contributor.name}
                    >
                      {contributor.initials}
                    </div>
                  ))}
                </div>
              </div>
            )}
 
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-hairline">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggle}
                  className="btn-theme-toggle"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle dark mode"
                >
                  {isDark
                    ? <Sun className="w-4 h-4" />
                    : <Moon className="w-4 h-4" />}
                </button>
 
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-ink">{user.username}</span>
                  <span className="text-[9px] text-primary font-semibold uppercase tracking-wider">{user.role}</span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="btn-secondary py-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggle}
                  className="btn-theme-toggle"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <Link to="/login" className="btn-primary">
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );

};

export default Navbar;

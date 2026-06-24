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
            <div className="p-1 bg-surface-card rounded-xl shadow-xs border border-hairline group-hover:scale-105 transition-transform duration-200">
              <svg className="h-6.5 w-6.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="nav-shield-left-grad" x1="16" y1="2" x2="6" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="nav-shield-right-grad" x1="16" y1="2" x2="26" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                {/* Left Shield Half */}
                <path d="M16 2.5 L6.5 6.5 V15 C6.5 21 12 26 16 29" stroke="url(#nav-shield-left-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Right Shield Half */}
                <path d="M16 2.5 L25.5 6.5 V15 C25.5 21 20 26 16 29" stroke="url(#nav-shield-right-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Monogram L */}
                <path d="M11 9 V22 H15" stroke="url(#nav-shield-left-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Monogram C */}
                <path d="M21 9 H18.5 C16.5 9 16.5 22 18.5 22 H21" stroke="url(#nav-shield-right-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Central Column of Scales */}
                <path d="M16 8 V24" stroke="url(#nav-shield-right-grad)" strokeWidth="1.5" strokeLinecap="round" />
                {/* Stand base */}
                <path d="M14 24 H18" stroke="url(#nav-shield-right-grad)" strokeWidth="2" strokeLinecap="round" />

                {/* Scales Crossbar */}
                <path d="M10 11 H22" stroke="url(#nav-shield-right-grad)" strokeWidth="1.5" strokeLinecap="round" />

                {/* Left Cup Suspension Strings */}
                <path d="M10 11 L8 17 M10 11 L12 17" stroke="url(#nav-shield-left-grad)" strokeWidth="1" />
                {/* Left Cup */}
                <path d="M7.5 17 H12.5 C12.5 19.5 7.5 19.5 7.5 17 Z" fill="url(#nav-shield-left-grad)" />

                {/* Right Cup Suspension Strings */}
                <path d="M22 11 L20 17 M22 11 L24 17" stroke="url(#nav-shield-right-grad)" strokeWidth="1" />
                {/* Right Cup */}
                <path d="M19.5 17 H24.5 C24.5 19.5 19.5 19.5 19.5 17 Z" fill="url(#nav-shield-right-grad)" />
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
              <div className="hidden lg:flex items-center gap-2 ml-1 select-none" style={{ caretColor: 'transparent' }}>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider pointer-events-none">Team:</span>
                <div className="contributor-stack contributor-stack-nav pointer-events-none">
                  {getTopContributors().map((contributor) => (
                    <div
                      key={contributor.id}
                      className={`contributor-badge contributor-badge-static w-7 h-7 bg-linear-to-br ${contributor.avatarColor}`}
                      title={contributor.name}
                      aria-hidden="true"
                    >
                      <span className="pointer-events-none select-none">{contributor.initials}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-hairline/60">
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

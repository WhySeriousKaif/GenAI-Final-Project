// =========================================================================
// Main React Application Component (App Router)
// =========================================================================
// This component initializes the client-side routing hierarchy for our system.
// We wrap the entire application in a standard Router block, mounting a 
// persistent Navbar component and checking matching routes to display
// pages dynamically.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Navbar
import Navbar from './components/Navbar';

// Pages Workspace
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadContract from './pages/UploadContract';
import ContractDetails from './pages/ContractDetails';
import ClauseComparison from './pages/ClauseComparison';
import ContractChat from './pages/ContractChat';
import AdminDashboard from './pages/AdminDashboard';

// Route Guard Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 bg-navy-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating LexiCore session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-navy-950">
          
          {/* Persistent Header Navigation Bar */}
          <Navbar />

          {/* Dynamic Page Routing Workspace Area */}
          <main className="flex-grow">
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Workspace Pages */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/upload" element={
                <ProtectedRoute>
                  <UploadContract />
                </ProtectedRoute>
              } />

              <Route path="/contract/:id" element={
                <ProtectedRoute>
                  <ContractDetails />
                </ProtectedRoute>
              } />

              <Route path="/compare" element={
                <ProtectedRoute>
                  <ClauseComparison />
                </ProtectedRoute>
              } />

              {/* We provide two pathways: one locked to a contract ID, one open with a sidebar selection */}
              <Route path="/chat/:id" element={
                <ProtectedRoute>
                  <ContractChat />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ContractChat />
                </ProtectedRoute>
              } />

              {/* Admin Panel (Database connection stats & Wiping DB) - Admins Only */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          {/* Persistent Footer */}
          <footer className="w-full bg-navy-950/40 border-t border-navy-850 py-4 text-center text-[10px] text-slate-500 font-medium tracking-wide">
            © {new Date().getFullYear()} LexiCore AI. All rights reserved. Submitted for Academic Review.
          </footer>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

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
import { ThemeProvider } from './context/ThemeContext';

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
      <div className="min-h-screen flex items-center justify-center text-sm text-muted bg-canvas">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
    <ThemeProvider>
      <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-canvas">
          
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
          <footer className="w-full border-t border-hairline py-4.5 text-center text-xs text-muted font-medium tracking-wide">
            © {new Date().getFullYear()} LexiCore AI. All rights reserved. Submitted for Academic Review.
          </footer>

        </div>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

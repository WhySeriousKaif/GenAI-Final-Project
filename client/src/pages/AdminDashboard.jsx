// =========================================================================
// System Admin Panel Component (Health Check & Reset Panel)
// =========================================================================
// This page provides controls to inspect the system health and prepare
// the database for fresh demonstrations.
// 
// Displays:
// 1. Connection states of MongoDB, Gemini API, and Neo4j.
// 2. Database Reset Action (wipes MongoDB collections and deletes Neo4j nodes).

import React, { useEffect, useState } from 'react';
import { getSystemStatus, resetDatabase } from '../services/api';
import { Settings, ShieldCheck, Database, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getSystemStatus();
      if (res.success) {
        setStatus(res.services);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDB = () => {
    setIsConfirmOpen(true);
  };

  const executeResetDB = async () => {
    setIsConfirmOpen(false);
    try {
      setResetting(true);
      setMessage('Purging database clusters...');
      
      const res = await resetDatabase();
      if (res.success) {
        setMessage(res.message);
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to complete system purge.');
    } finally {
      setResetting(false);
      // Clear message after 4 seconds
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-blue-500" />
          System Administration Console
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Monitor system services connectivity and control database resets for live project vivas.
        </p>
      </div>

      {/* Services status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Service 1: MongoDB */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Database Core</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">MongoDB Atlas</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Stores contracts, extracted clauses, and executive summaries.</p>
          </div>
          <div className="pt-2 border-t border-navy-850">
            {loading ? (
              <span className="text-[10px] text-slate-500">Checking...</span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {status?.mongodb || 'Connected'}
              </span>
            )}
          </div>
        </div>

        {/* Service 2: Gemini AI */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cognitive Engine</span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Gemini LLM API</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Extracts clauses, rates risks, and drives interactive RAG chat.</p>
          </div>
          <div className="pt-2 border-t border-navy-850">
            {loading ? (
              <span className="text-[10px] text-slate-500">Checking...</span>
            ) : status?.gemini?.includes('Missing') ? (
              <span className="text-xs font-semibold text-blue-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Mock Heuristics Mode
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Gemini Active (Online)
              </span>
            )}
          </div>
        </div>

        {/* Service 3: Neo4j */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Graph Relations</span>
            <RefreshCw className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Neo4j Graph</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Indices dependencies and traces legal cross-clause reference paths.</p>
          </div>
          <div className="pt-2 border-t border-navy-850">
            {loading ? (
              <span className="text-[10px] text-slate-500">Checking...</span>
            ) : status?.neo4j?.includes('Offline') ? (
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Memory Fallback Mode
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Neo4j Active (Online)
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Database control actions */}
      <div className="glass-card p-4 space-y-4 border border-red-900/10">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-pulse" /> Danger Zone
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Actions in this panel are destructive and will clear the system.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-500/5 p-3 rounded-lg border border-red-500/15">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-200">Full System Reset</h4>
            <p className="text-[10px] text-slate-400 leading-normal max-w-md">
              Deletes all records from MongoDB and empties the Neo4j graph nodes. Useful before beginning a live project viva presentation to showcase uploads from scratch.
            </p>
          </div>
          
          <button
            onClick={handleResetDB}
            disabled={resetting}
            className="btn-danger text-xs py-1.5 px-4 font-bold cursor-pointer"
          >
            {resetting ? 'Resetting DB...' : 'Reset Database'}
          </button>
        </div>

        {message && (
          <div className="p-2.5 bg-navy-950 rounded-lg border border-navy-850 text-[10px] text-center text-blue-500 font-bold uppercase tracking-wider animate-pulse">
            {message}
          </div>
        )}
      </div>

      {/* Viva / Presentation Info Guide */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">University Presentation / Viva Checklist</h3>
        <ul className="text-[11px] text-slate-400 space-y-2 list-disc list-inside">
          <li>Ensure <span className="font-semibold text-slate-300">mongod</span> is running locally or specify your Atlas URI in <span className="font-mono text-slate-300">server/.env</span>.</li>
          <li>If you do not have a Gemini API key, don't worry: our <span className="font-semibold text-blue-500">Mock Heuristics Analyser</span> will automatically engage, allowing you to showcase document text parsing and risk analysis offline.</li>
          <li>To showcase the bonus graph visualization, Neo4j is supported but not required. The visualizer defaults to in-memory graph construction if Neo4j is offline.</li>
          <li>A comprehensive <span className="font-semibold text-slate-300">README.md</span>, API documentation, and viva interview guide have been created in the project root folder.</li>
        </ul>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Full System Reset"
        message="WARNING: This will completely wipe all ingested contracts from MongoDB and delete all nodes from the Neo4j graph database. Are you sure you want to perform a full system reset?"
        confirmText="Confirm Reset"
        cancelText="Cancel"
        onConfirm={executeResetDB}
        onCancel={() => setIsConfirmOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default AdminDashboard;

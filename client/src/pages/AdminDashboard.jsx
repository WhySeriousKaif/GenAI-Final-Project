// =========================================================================
// System Admin Panel Component
// =========================================================================
import React, { useEffect, useState } from 'react';
import { getSystemStatus, resetDatabase } from '../services/api';
import { Settings, ShieldCheck, Database, RefreshCw, ShieldAlert } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getSystemStatus();
      if (res.success) setStatus(res.services);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const executeResetDB = async () => {
    setIsConfirmOpen(false);
    try {
      setResetting(true);
      setMessage('Purging database clusters...');
      const res = await resetDatabase();
      if (res.success) { setMessage(res.message); fetchStatus(); }
    } catch (err) { console.error(err); setMessage('Failed to complete system purge.'); }
    finally { setResetting(false); setTimeout(() => setMessage(''), 4000); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 bg-canvas text-body font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-4xl font-serif tracking-tight text-ink font-medium flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-primary" /> System Administration Console
        </h1>
        <p className="mt-1 text-sm text-muted">Monitor system services connectivity and control database resets for live project vivas.</p>
      </div>

      {/* Services status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* MongoDB */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Database Core</span>
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">MongoDB Atlas</h3>
            <p className="text-xs text-muted mt-0.5">Stores contracts, extracted clauses, and executive summaries.</p>
          </div>
          <div className="pt-2 border-t border-hairline">
            {loading ? <span className="text-xs text-muted">Checking...</span> : (
              <span className="text-xs font-semibold text-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>{status?.mongodb || 'Connected'}
              </span>
            )}
          </div>
        </div>

        {/* Gemini AI */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Cognitive Engine</span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Gemini LLM API</h3>
            <p className="text-xs text-muted mt-0.5">Extracts clauses, rates risks, and drives interactive RAG chat.</p>
          </div>
          <div className="pt-2 border-t border-hairline">
            {loading ? <span className="text-xs text-muted">Checking...</span>
              : status?.gemini?.includes('Missing') ? (
                <span className="text-xs font-semibold text-warning flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning"></span>Mock Heuristics Mode</span>
              ) : (
                <span className="text-xs font-semibold text-success flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success"></span>Gemini Active (Online)</span>
              )
            }
          </div>
        </div>

        {/* Neo4j */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Graph Relations</span>
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Neo4j Graph</h3>
            <p className="text-xs text-muted mt-0.5">Indices dependencies and traces legal cross-clause reference paths.</p>
          </div>
          <div className="pt-2 border-t border-hairline">
            {loading ? <span className="text-xs text-muted">Checking...</span>
              : status?.neo4j?.includes('Offline') ? (
                <span className="text-xs font-semibold text-muted flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted"></span>Memory Fallback Mode</span>
              ) : (
                <span className="text-xs font-semibold text-success flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success"></span>Neo4j Active (Online)</span>
              )
            }
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-5 space-y-4 border border-red-200 bg-red-50/30">
        <div>
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-error animate-pulse" /> Danger Zone
          </h3>
          <p className="text-xs text-muted mt-0.5">Actions in this panel are destructive and will clear the system.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-ink">Full System Reset</h4>
            <p className="text-xs text-muted leading-normal max-w-md">Deletes all records from MongoDB and empties the Neo4j graph nodes. Useful before beginning a live project viva presentation.</p>
          </div>
          <button onClick={() => setIsConfirmOpen(true)} disabled={resetting} className="btn-danger text-xs py-1.5 px-4 cursor-pointer">
            {resetting ? 'Resetting DB...' : 'Reset Database'}
          </button>
        </div>
        {message && (
          <div className="p-2.5 bg-canvas rounded-lg border border-hairline text-xs text-center text-primary font-bold uppercase tracking-wider animate-pulse">{message}</div>
        )}
      </div>

      {/* Viva Checklist */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">University Presentation / Viva Checklist</h3>
        <ul className="text-xs text-muted space-y-2 list-disc list-inside">
          <li>Ensure <span className="font-semibold text-ink">mongod</span> is running locally or specify your Atlas URI in <span className="font-mono text-ink">server/.env</span>.</li>
          <li>If you do not have a Gemini API key, our <span className="font-semibold text-primary">Mock Heuristics Analyser</span> will automatically engage for offline demos.</li>
          <li>To showcase the bonus graph visualization, Neo4j is supported but not required. The visualizer defaults to in-memory graph construction if Neo4j is offline.</li>
          <li>A comprehensive <span className="font-semibold text-ink">README.md</span>, API documentation, and viva interview guide have been created in the project root folder.</li>
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

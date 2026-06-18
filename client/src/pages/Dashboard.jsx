// =========================================================================
// Dashboard Page Component
// =========================================================================
// This is the landing page of our application. It provides:
// 1. Statistics Cards (Total contracts, average risk, high-risk counts).
// 2. Global Search Interface (Searches clauses across all uploaded files).
// 3. Analytics Charts (Risk distribution and clause type frequency).
// 4. Document Registry (Interactive table showing recent uploads).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, deleteContract, globalSearch } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import RiskDistributionChart from '../components/RiskDistributionChart';
import ClauseFrequencyChart from '../components/ClauseFrequencyChart';
import { RiskScoreBadge } from '../components/RiskBadge';
import { 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  UploadCloud, 
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [, setSearching] = useState(false);

  const [deleteContractId, setDeleteContractId] = useState(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await getContracts();
      if (data.success) {
        setContracts(data.contracts);
      }
    } catch (err) {
      setError('Failed to load contract database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load contracts on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContracts();
  }, []);

  const handleDelete = (id, e) => {
    e.preventDefault(); // Stop row click propagation
    setDeleteContractId(id);
  };

  const executeDeleteContract = async () => {
    if (!deleteContractId) return;
    try {
      const res = await deleteContract(deleteContractId);
      if (res.success) {
        fetchContracts();
        // Clear search results if a contract was deleted
        if (searchResults) setSearchResults(null);
      }
    } catch {
      alert('Failed to delete contract.');
    } finally {
      setDeleteContractId(null);
    }
  };

  // Run Global Search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const data = await globalSearch(searchQuery);
      if (data.success) {
        setSearchResults(data.matches);
      }
    } catch (err) {
      console.error(err);
      alert('Global search query failed.');
    } finally {
      setSearching(false);
    }
  };

  // Clear search results and query string
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // Statistics Computations
  const totalContracts = contracts.length;
  const avgRiskScore = totalContracts > 0 
    ? Math.round(contracts.reduce((acc, c) => acc + c.overallRiskScore, 0) / totalContracts) 
    : 0;
  const highRiskContractsCount = contracts.filter(c => c.overallRiskScore > 70).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header and Call to Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Legal AI Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Find risks in 100-page contracts before your lawyer does. Fully automated clause evaluation.
          </p>
        </div>
        <Link to="/upload" className="btn-primary self-start md:self-auto">
          <UploadCloud className="h-4 w-4" />
          Ingest New Contract
        </Link>
      </div>

      {/* Global Search Interface */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Global Search (e.g. 'termination notice', 'indemnity', 'payment terms' across all contracts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-9 text-xs"
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </form>

        {/* Global Search Results Panel */}
        {searchResults !== null && (
          <div className="mt-4 border-t border-navy-700/60 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-200">
                Search Results: {searchResults.length} Match(es) Found
              </h3>
              <button 
                onClick={handleClearSearch}
                className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider"
              >
                Clear Results
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-400">No matching text was found in any contract clause.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {searchResults.map((match, idx) => (
                  <div key={idx} className="bg-navy-900/40 border border-navy-800 rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          to={`/contract/${match.contractId}`}
                          className="text-xs font-bold text-blue-500 hover:underline"
                        >
                          {match.contractTitle}
                        </Link>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400 bg-navy-800/80 px-1.5 py-0.5 rounded border border-navy-700 font-medium">
                          {match.clauseType} ({match.sectionNumber})
                        </span>
                      </div>
                      <RiskScoreBadge score={match.riskScore} />
                    </div>
                    <blockquote className="text-[11px] italic text-slate-300 pl-2.5 border-l-2 border-slate-700 bg-navy-950/30 py-1 rounded-r-md">
                      "{match.clauseText.substring(0, 300)}..."
                    </blockquote>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Numerical Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Contracts */}
        <div className="glass-card glass-card-hover p-4 flex items-center gap-4">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contracts</span>
            <span className="block text-2xl font-extrabold text-white mt-0.5">{totalContracts}</span>
          </div>
        </div>

        {/* Card 2: Average Risk Score */}
        <div className="glass-card glass-card-hover p-4 flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Risk Score</span>
            <span className="block text-2xl font-extrabold text-white mt-0.5">{avgRiskScore}%</span>
          </div>
        </div>

        {/* Card 3: High-Risk Contracts */}
        <div className="glass-card glass-card-hover p-4 flex items-center gap-4">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Risk Contracts</span>
            <span className="block text-2xl font-extrabold text-white mt-0.5">{highRiskContractsCount}</span>
          </div>
        </div>
      </div>

      {/* Graphics Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Distribution Chart Card */}
        <div className="glass-card p-4 md:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-3">Risk Category Distribution</h3>
          <RiskDistributionChart contracts={contracts} />
        </div>

        {/* Clause Frequency Chart Card */}
        <div className="glass-card p-4 md:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-3">Clause Type Frequency</h3>
          <ClauseFrequencyChart contracts={contracts} />
        </div>
      </div>

      {/* Main Ingested Contracts Registry Table */}
      <div className="glass-card p-4 md:p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-3">Ingested Contracts</h3>
        
        {loading ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-400">Loading contract database...</div>
        ) : contracts.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-navy-800 rounded-xl">
            <AlertCircle className="h-8 w-8 text-slate-500" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-300">No contracts found in the database.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Generate or upload a PDF/DOCX to begin clause analysis.</p>
            </div>
            <Link to="/upload" className="btn-secondary py-1.5 px-3 text-[10px] mt-1">
              Go to Upload
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-2.5 pl-1">Contract Name</th>
                  <th className="pb-2.5">Ingested Date</th>
                  <th className="pb-2.5">Extracted Clauses</th>
                  <th className="pb-2.5">Overall Risk</th>
                  <th className="pb-2.5 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-xs">
                {contracts.map((contract) => (
                  <tr key={contract._id} className="hover:bg-navy-800/25 transition-colors group">
                    <td className="py-3 pl-1 font-semibold text-slate-200">
                      <Link to={`/contract/${contract._id}`} className="hover:text-blue-500 transition-colors">
                        {contract.title}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {new Date(contract.uploadedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="flex flex-wrap gap-1 max-w-xs">
                        {contract.extractedClauses && contract.extractedClauses.slice(0, 3).map((c, i) => (
                          <span key={i} className="bg-navy-900 px-1.5 py-0.5 rounded text-[9px] text-slate-400 font-semibold border border-navy-850">
                            {c.clauseType}
                          </span>
                        ))}
                        {contract.extractedClauses && contract.extractedClauses.length > 3 && (
                          <span className="text-slate-500 text-[9px] font-bold">
                            +{contract.extractedClauses.length - 3} more
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3">
                      <RiskScoreBadge score={contract.overallRiskScore} />
                    </td>
                    <td className="py-3 text-right pr-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          to={`/contract/${contract._id}`} 
                          title="Open Details"
                          className="p-1.5 bg-navy-950 text-slate-300 hover:text-white rounded-md border border-navy-800 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link 
                          to={`/chat/${contract._id}`} 
                          title="Open AI RAG Chat"
                          className="p-1.5 bg-navy-950 text-blue-500 hover:text-blue-400 rounded-md border border-navy-800 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(contract._id, e)}
                          title="Delete Contract"
                          className="p-1.5 bg-navy-950 text-rose-500 hover:text-rose-400 rounded-md border border-navy-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteContractId !== null}
        title="Delete Contract"
        message="Are you sure you want to delete this contract from the system? This action is permanent and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={executeDeleteContract}
        onCancel={() => setDeleteContractId(null)}
        isDanger={true}
      />
    </div>
  );
};

export default Dashboard;

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
import { contributors, getTotalContributions, getContributionPercentage } from '../data/contributorsMock';
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
  AlertCircle,
  Users
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
    <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header and Call to Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-serif tracking-tight text-ink font-medium">
            Legal AI Workspace
          </h1>
          <p className="mt-1 text-sm text-muted">
            Find risks in 100-page contracts before your lawyer does. Fully automated clause evaluation.
          </p>
        </div>
        <Link to="/upload" className="btn-primary self-start md:self-auto">
          <UploadCloud className="h-5 w-5" />
          Ingest New Contract
        </Link>
      </div>

      {/* Global Search Interface */}
      <div className="glass-card p-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted" />
            <input
              type="text"
              placeholder="Global Search (e.g. 'termination notice', 'indemnity', 'payment terms' across all contracts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-12 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-8">
            Search
          </button>
        </form>

        {/* Global Search Results Panel */}
        {searchResults !== null && (
          <div className="mt-4 border-t border-hairline pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-ink">
                Search Results: {searchResults.length} Match(es) Found
              </h3>
              <button 
                onClick={handleClearSearch}
                className="text-xs text-primary hover:text-primary-active font-semibold uppercase tracking-wider"
              >
                Clear Results
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-sm text-muted">No matching text was found in any contract clause.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {searchResults.map((match, idx) => (
                  <div key={idx} className="bg-canvas border border-hairline rounded-lg p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          to={`/contract/${match.contractId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {match.contractTitle}
                        </Link>
                        <span className="text-xs text-muted-soft">•</span>
                        <span className="text-xs text-body bg-canvas px-1.5 py-0.5 rounded border border-hairline font-medium">
                          {match.clauseType} ({match.sectionNumber})
                        </span>
                      </div>
                      <RiskScoreBadge score={match.riskScore} />
                    </div>
                    <blockquote className="text-xs italic text-body pl-2.5 border-l-2 border-primary bg-surface-card/30 py-1.5 rounded-r-md">
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card 1: Total Contracts */}
        <div className="glass-card glass-card-hover p-5 flex items-center gap-4">
          <div className="p-3 bg-canvas text-primary rounded-xl border border-hairline">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-muted uppercase tracking-wider">Total Contracts</span>
            <span className="block text-3xl font-semibold text-ink mt-0.5 font-serif">{totalContracts}</span>
          </div>
        </div>

        {/* Card 2: Average Risk Score */}
        <div className="glass-card glass-card-hover p-5 flex items-center gap-4">
          <div className="p-3 bg-canvas text-primary rounded-xl border border-hairline">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-muted uppercase tracking-wider">Average Risk Score</span>
            <span className="block text-3xl font-semibold text-ink mt-0.5 font-serif">{avgRiskScore}%</span>
          </div>
        </div>

        {/* Card 3: High-Risk Contracts */}
        <div className="glass-card glass-card-hover p-5 flex items-center gap-4">
          <div className="p-3 bg-canvas text-primary rounded-xl border border-hairline">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-muted uppercase tracking-wider">High Risk Contracts</span>
            <span className="block text-3xl font-semibold text-ink mt-0.5 font-serif">{highRiskContractsCount}</span>
          </div>
        </div>
      </div>

      {/* Team Contributions Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">Team Contributions</h3>
              <p className="text-xs text-muted mt-0.5">Analysis distribution across team members</p>
            </div>
          </div>
          <span className="text-sm font-bold text-muted bg-canvas border border-hairline px-3.5 py-2 rounded-lg">
            Total: {getTotalContributions()} analyses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {contributors.map((contributor) => {
            const percentage = getContributionPercentage(contributor.id);
            return (
              <div key={contributor.id} className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`contributor-badge w-10 h-10 bg-gradient-to-br ${contributor.avatarColor}`}>
                    {contributor.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{contributor.name}</p>
                    <p className="text-xs text-muted">{contributor.role}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-body">{contributor.contributions}</span>
                    <span className="text-xs text-muted">{percentage}%</span>
                  </div>
                  <div className="contribution-bar bg-surface-soft">
                    <div 
                      className="contribution-fill bg-gradient-to-r from-primary to-primary-active" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphics Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart Card */}
        <div className="glass-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-ink mb-3 font-serif">Risk Category Distribution</h3>
          <RiskDistributionChart contracts={contracts} />
        </div>

        {/* Clause Frequency Chart Card */}
        <div className="glass-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-ink mb-3 font-serif">Clause Type Frequency</h3>
          <ClauseFrequencyChart contracts={contracts} />
        </div>
      </div>

      {/* Main Ingested Contracts Registry Table */}
      <div className="glass-card p-5 md:p-6">
        <h3 className="text-base font-semibold text-ink mb-3 font-serif">Ingested Contracts</h3>
        
        {loading ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted">Loading contract database...</div>
        ) : contracts.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-muted gap-3 border border-dashed border-hairline rounded-xl bg-canvas">
            <AlertCircle className="h-8 w-8 text-muted" />
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">No contracts found in the database.</p>
              <p className="text-xs text-muted mt-0.5">Generate or upload a PDF/DOCX to begin clause analysis.</p>
            </div>
            <Link to="/upload" className="btn-secondary py-2 px-4 text-xs mt-1">
              Go to Upload
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold text-muted uppercase tracking-widest">
                  <th className="pb-3 pl-1">Contract Name</th>
                  <th className="pb-3">Ingested Date</th>
                  <th className="pb-3">Extracted Clauses</th>
                  <th className="pb-3">Analyzed By</th>
                  <th className="pb-3">Overall Risk</th>
                  <th className="pb-3 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-sm text-body">
                {contracts.map((contract) => {
                  // Assign consistent analyst based on contract ID hash
                  const analystIndex = contract._id.charCodeAt(0) % contributors.length;
                  const assignedAnalyst = contributors[analystIndex];
                  
                  return (
                    <tr key={contract._id} className="hover:bg-surface-cream-strong/40 transition-colors group">
                      <td className="py-3.5 pl-1 font-semibold text-ink">
                        <Link to={`/contract/${contract._id}`} className="hover:text-primary transition-colors">
                          {contract.title}
                        </Link>
                      </td>
                      <td className="py-3.5 text-muted">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted" />
                          {new Date(contract.uploadedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 text-body">
                        <span className="flex flex-wrap gap-1 max-w-xs">
                          {contract.extractedClauses && contract.extractedClauses.slice(0, 3).map((c, i) => (
                            <span key={i} className="bg-canvas px-1.5 py-0.5 rounded text-[11px] text-muted font-semibold border border-hairline">
                              {c.clauseType}
                            </span>
                          ))}
                          {contract.extractedClauses && contract.extractedClauses.length > 3 && (
                            <span className="text-muted text-[11px] font-bold">
                              +{contract.extractedClauses.length - 3} more
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`contributor-badge w-7 h-7 bg-gradient-to-br ${assignedAnalyst.avatarColor}`}>
                            {assignedAnalyst.initials}
                          </div>
                          <span className="text-muted text-sm">{assignedAnalyst.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <RiskScoreBadge score={contract.overallRiskScore} />
                      </td>
                      <td className="py-3.5 text-right pr-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link 
                            to={`/contract/${contract._id}`} 
                            title="Open Details"
                            className="p-2 bg-canvas text-body hover:text-ink rounded-md border border-hairline transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            to={`/chat/${contract._id}`} 
                            title="Open AI RAG Chat"
                            className="p-2 bg-canvas text-primary hover:text-primary-active rounded-md border border-hairline transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(contract._id, e)}
                            title="Delete Contract"
                            className="p-2 bg-canvas text-error hover:opacity-85 rounded-md border border-hairline transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      />
    </div>
  );
};

export default Dashboard;

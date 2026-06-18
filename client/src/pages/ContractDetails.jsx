// =========================================================================
// Contract Details Workspace Page Component
// =========================================================================
// This is the core analytical center for a single document.
// It retrieves the contract details from the database and maps them into three tabs:
// 1. RISK ANALYSIS: Detailed breakdowns of the 7 extracted legal clauses.
// 2. EXECUTIVE SUMMARY: A plain-English commercial summary.
// 3. CLAUSE GRAPH: SVG network map showing references and contains paths.
//
// Additional features:
// - Navigation links to launch the AI RAG chat console.
// - Expandable panel to inspect raw text extracted from PDF/DOCX.
// - Interactive node highlight link from the graph to scroll directly to details.

import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContractById } from '../services/api';
import GraphVisualizer from '../components/GraphVisualizer';
import { RiskScoreBadge, MarketStatusBadge } from '../components/RiskBadge';
import CopyButton from '../components/CopyButton';
import ExportReportButton from '../components/ExportReportButton';
import { 
  FileText, 
  ShieldAlert, 
  MessageSquare, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Activity, 
  Layers, 
  ChevronRight,
  Scale
} from 'lucide-react';

const ContractDetails = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('risks'); // 'risks', 'summary', 'graph'
  const [highlightedClauseType, setHighlightedClauseType] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  // References to clause cards to allow scrolling to them
  const clauseRefs = useRef({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getContractById(id);
        if (data.success) {
          setContract(data.contract);
          setGraphData(data.graphData);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve contract data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // Jump callback for Graph visualizer node clicks
  const handleGraphNodeClick = (clauseType) => {
    setActiveTab('risks');
    setHighlightedClauseType(clauseType);
    
    // Smooth scroll to card
    setTimeout(() => {
      if (clauseRefs.current[clauseType]) {
        clauseRefs.current[clauseType].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex items-center justify-center text-slate-400">
        Loading LexiCore contract analysis...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Error Loading Contract</h2>
        <p className="text-slate-400 text-sm">{error || 'Contract record could not be found.'}</p>
        <Link to="/" className="btn-secondary py-2 px-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Formatting variables
  const overallScore = Number(contract.overallRiskScore);
  const clauses = contract.extractedClauses || [];
  const summary = contract.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Back to Dashboard Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Contract Title Banner */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-md text-white mt-0.5">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{contract.title}</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ingested on {new Date(contract.uploadedAt).toLocaleDateString()} at {new Date(contract.uploadedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Overall score card */}
        <div className="flex items-center gap-3 border-l border-navy-700/60 pl-0 md:pl-5">
          <div className="text-right">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Overall Risk Score</span>
            <span className="block text-xl font-extrabold text-white mt-0.5">{overallScore}%</span>
          </div>
          <RiskScoreBadge score={overallScore} />
        </div>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Main Workspaces Area (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tab Selector Links */}
          <div className="flex items-center border-b border-navy-800 text-xs font-bold">
            <div className="flex space-x-5">
              <button
                onClick={() => setActiveTab('risks')}
                className={`pb-3 transition-colors relative cursor-pointer ${
                  activeTab === 'risks' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Risk Analysis ({clauses.length})
                {activeTab === 'risks' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`pb-3 transition-colors relative cursor-pointer ${
                  activeTab === 'summary' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Executive Summary
                {activeTab === 'summary' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`pb-3 transition-colors relative cursor-pointer ${
                  activeTab === 'graph' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clause Relationship Graph
                {activeTab === 'graph' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
              </button>
            </div>

            {/* Export button — always rendered to prevent row height shift,
                visibility toggled based on active tab */}
            <div className={`ml-auto pb-1 transition-opacity duration-150 ${activeTab === 'summary' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <ExportReportButton contract={contract} />
            </div>
          </div>

          {/* TAB 1 CONTENT: RISK ANALYSIS LIST */}
          {activeTab === 'risks' && (
            <div className="space-y-3">
              {clauses.map((clause, idx) => {
                const isHighlighted = highlightedClauseType === clause.clauseType;
                return (
                  <div
                    key={clause._id || idx}
                    ref={el => clauseRefs.current[clause.clauseType] = el}
                    className={`glass-card p-4 space-y-3 transition-all duration-300 ${
                      isHighlighted 
                        ? 'border-blue-500/80 bg-blue-950/10 shadow-md shadow-blue-900/10 scale-[1.01]' 
                        : 'border-navy-700/50 bg-navy-800/40'
                    }`}
                  >
                    {/* Header: Title, Category, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-800/80 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                          {clause.clauseType}
                        </span>
                        <span className="text-[10px] text-slate-500">({clause.sectionNumber})</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-navy-950 text-slate-400 rounded border border-navy-850">
                          {clause.riskType} Risk
                        </span>
                        <MarketStatusBadge status={clause.marketStandardStatus} />
                        <RiskScoreBadge score={clause.riskScore} />
                      </div>
                    </div>

                    {/* Verbatim Clause Text */}
                    <div className="relative group bg-navy-950/50 border border-navy-850/80 rounded-lg p-3 text-[10px] font-mono text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                      <CopyButton text={clause.clauseText} />
                      "{clause.clauseText}"
                    </div>

                    {/* AI Assessment Commentary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-navy-900/40 border border-navy-800/60 rounded-lg p-3 space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Risk Justification</span>
                        <p className="text-slate-300 leading-normal text-[11px]">{clause.reason}</p>
                      </div>
                      <div className="bg-navy-900/40 border border-navy-800/60 rounded-lg p-3 space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Market Comparison</span>
                        <p className="text-slate-300 leading-normal text-[11px]">
                          {clause.marketComparisonReason || 'This clause aligns with average standards and presents no atypical deviations.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2 CONTENT: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">

              {/* Main Summary Blocks */}
              <div className="glass-card p-4 md:p-5 space-y-4">
                
                {/* Purpose Block */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-blue-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Commercial Purpose
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed pl-5">{summary.purpose}</p>
                </div>

                {/* Signing Parties */}
                <div className="space-y-1.5 border-t border-navy-800 pt-4">
                  <h3 className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Signing Parties
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-5">
                    {summary.parties && summary.parties.map((party, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 bg-navy-900/60 p-2 rounded border border-navy-800 font-medium">
                        {party}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Obligations */}
                <div className="space-y-2 border-t border-navy-800 pt-4">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Key Obligations & Deliverables
                  </h3>
                  <ul className="space-y-1.5 pl-5">
                    {summary.keyObligations && summary.keyObligations.map((obl, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {obl}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Risks */}
                <div className="space-y-2 border-t border-navy-800 pt-4">
                  <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" /> Primary Risks Detected
                  </h3>
                  <ul className="space-y-1.5 pl-5">
                    {summary.topRisks && summary.topRisks.map((risk, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
                        <ChevronRight className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Negotiation Points Card */}
              <div className="glass-card p-4 bg-gradient-to-r from-navy-800/80 via-navy-850/80 to-blue-950/10 border-l-4 border-l-blue-500 space-y-3">
                <h3 className="text-sm font-bold text-blue-500 flex items-center gap-1.5 uppercase tracking-wide">
                  <Scale className="h-4 w-4 animate-pulse" /> Top 3 Negotiation Recommendations
                </h3>
                <ol className="space-y-2 pl-1">
                  {summary.negotiationPoints && summary.negotiationPoints.map((point, idx) => (
                     <li key={idx} className="text-[11px] text-slate-200 flex items-start gap-2.5 leading-relaxed">
                       <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-[9px] flex-shrink-0 mt-0.5">
                         {idx + 1}
                       </span>
                       {point}
                     </li>
                  ))}
                </ol>
              </div>

            </div>
          )}

          {/* TAB 3 CONTENT: GRAPH VISUALIZER */}
          {activeTab === 'graph' && (
            <GraphVisualizer 
              graphData={graphData} 
              onNodeClick={handleGraphNodeClick} 
            />
          )}

          {/* RAW DOCUMENT TEXT EXPANSION */}
          <div className="glass-card p-4">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="flex justify-between items-center w-full text-left"
            >
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                View Raw Extracted Text
              </h3>
              <span className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider">
                {showRawText ? 'Hide Text' : 'Show Text'}
              </span>
            </button>

            {showRawText && (
              <div className="mt-3 bg-navy-950 border border-navy-850 rounded-lg p-3 text-[10px] font-mono text-slate-400 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                {contract.rawText}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Workspace Callouts (1/4 width) */}
        <div className="space-y-4">
          
          {/* AI Interactive Chat Card */}
          <div className="glass-card p-4 bg-gradient-to-br from-navy-800 via-navy-850 to-blue-950/20 space-y-3 border border-blue-500/10">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 w-fit">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-100">Interactive Contract Chat</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Ask specific questions about this contract terms, liabilities, or IP clauses. Powered by in-memory RAG vector search.
              </p>
            </div>
            <Link 
              to={`/chat/${contract._id}`}
              className="btn-primary w-full py-2 text-xs font-bold"
            >
              Start AI Chat Console
            </Link>
          </div>

          {/* Side-by-Side Comparator Card */}
          <div className="glass-card p-4 space-y-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-100">Batch Compare</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Compare multiple uploaded documents side-by-side inside a grid table to flag variances in payment terms, liability caps, and termination.
              </p>
            </div>
            <Link 
              to="/compare"
              className="btn-secondary w-full py-2 text-xs font-bold"
            >
              Compare Clauses
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ContractDetails;

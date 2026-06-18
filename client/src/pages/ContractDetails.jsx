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
import { getSampleAnalysisHistory, contributors } from '../data/contributorsMock';
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
  const [activeTab, setActiveTab] = useState('risks');
  const [highlightedClauseType, setHighlightedClauseType] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const clauseRefs = useRef({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getContractById(id);
        if (data.success) { setContract(data.contract); setGraphData(data.graphData); }
      } catch (err) { console.error(err); setError('Failed to retrieve contract data.'); }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [id]);

  const handleGraphNodeClick = (clauseType) => {
    setActiveTab('risks');
    setHighlightedClauseType(clauseType);
    setTimeout(() => {
      clauseRefs.current[clauseType]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-32 flex items-center justify-center text-muted text-sm">Loading LexiCore contract analysis...</div>;
  if (error || !contract) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
      <h2 className="text-xl font-serif text-error font-medium">Error Loading Contract</h2>
      <p className="text-muted text-sm">{error || 'Contract record could not be found.'}</p>
      <Link to="/" className="btn-secondary py-2 px-4 inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
    </div>
  );

  const overallScore = Number(contract.overallRiskScore);
  const clauses = contract.extractedClauses || [];
  const summary = contract.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 bg-canvas text-body font-sans">
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-semibold text-muted hover:text-ink transition-colors uppercase tracking-wider">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Contract Title Banner */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-primary rounded-xl shadow-sm text-white mt-0.5"><FileText className="h-5 w-5" /></div>
          <div>
            <h1 className="text-xl font-serif text-ink leading-tight font-medium">{contract.title}</h1>
            <p className="text-[10px] text-muted mt-0.5">Ingested on {new Date(contract.uploadedAt).toLocaleDateString()} at {new Date(contract.uploadedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-hairline pl-0 md:pl-5">
          <div className="text-right">
            <span className="block text-[9px] text-muted font-bold uppercase tracking-wider">Overall Risk Score</span>
            <span className="block text-xl font-serif text-ink mt-0.5">{overallScore}%</span>
          </div>
          <RiskScoreBadge score={overallScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center justify-between border-b border-hairline text-xs font-semibold">
            <div className="flex space-x-5">
              {[
                ['risks', `Risk Analysis (${clauses.length})`],
                ['summary', 'Executive Summary'],
                ['graph', 'Clause Relationship Graph']
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 transition-colors relative cursor-pointer ${
                    activeTab === tab ? 'text-primary' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                  {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>}
                </button>
              ))}
            </div>
            {/* Export button — always rendered to prevent row height shift,
                visibility toggled based on active tab */}
            <div className={`pb-1 transition-opacity duration-150 ${activeTab === 'summary' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <ExportReportButton contract={contract} />
            </div>
          </div>

          {/* TAB 1: RISK ANALYSIS */}
          {activeTab === 'risks' && (
            <div className="space-y-3">
              {clauses.map((clause, idx) => {
                const isHighlighted = highlightedClauseType === clause.clauseType;
                // Assign consistent analyst based on clause index
                const analystIndex = idx % contributors.length;
                const assignedAnalyst = contributors[analystIndex];

                return (
                  <div key={clause._id || idx} ref={el => clauseRefs.current[clause.clauseType] = el}
                    className={`glass-card p-4 space-y-3 transition-all duration-300 ${isHighlighted ? 'border-primary/60 bg-primary/5 shadow-md scale-[1.01]' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-ink uppercase tracking-wide">{clause.clauseType}</span>
                        <span className="text-[10px] text-muted">({clause.sectionNumber})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-canvas text-muted rounded border border-hairline">{clause.riskType} Risk</span>
                        <MarketStatusBadge status={clause.marketStandardStatus} />
                        <RiskScoreBadge score={clause.riskScore} />
                      </div>
                    </div>

                    {/* Verbatim Clause Text */}
                    <div className="relative group bg-canvas border border-hairline rounded-lg p-3 text-[10px] font-mono text-body leading-relaxed max-h-48 overflow-y-auto">
                      <CopyButton text={clause.clauseText} />
                      "{clause.clauseText}"
                    </div>

                    {/* AI Assessment Commentary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-canvas border border-hairline rounded-lg p-3 space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Risk Justification</span>
                        <p className="text-body leading-normal text-[11px]">{clause.reason}</p>
                      </div>
                      <div className="bg-canvas border border-hairline rounded-lg p-3 space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Market Comparison</span>
                        <p className="text-body leading-normal text-[11px]">{clause.marketComparisonReason || 'This clause aligns with average standards and presents no atypical deviations.'}</p>
                      </div>
                    </div>

                    {/* Analyst Attribution Footer */}
                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <span className="text-[9px] text-muted">Analyzed on {new Date().toLocaleDateString()}</span>
                      <div className="analyst-stamp bg-canvas border border-hairline">
                        <div className={`contributor-badge w-5 h-5 bg-gradient-to-br ${assignedAnalyst.avatarColor}`}>
                          {assignedAnalyst.initials}
                        </div>
                        <span className="text-muted">{assignedAnalyst.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">

              {/* Main Summary Blocks */}
              <div className="glass-card p-4 md:p-5 space-y-4">
                
                {/* Purpose Block */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Commercial Purpose</h3>
                  <p className="text-xs text-body leading-relaxed pl-5">{summary.purpose}</p>
                </div>
                <div className="space-y-1.5 border-t border-hairline pt-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Signing Parties</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-5">
                    {summary.parties?.map((party, idx) => <li key={idx} className="text-[11px] text-body bg-canvas p-2 rounded border border-hairline font-medium">{party}</li>)}
                  </ul>
                </div>
                <div className="space-y-2 border-t border-hairline pt-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-success" /> Key Obligations & Deliverables</h3>
                  <ul className="space-y-1.5 pl-5">
                    {summary.keyObligations?.map((obl, idx) => <li key={idx} className="text-[11px] text-body flex items-start gap-1.5 leading-relaxed"><ChevronRight className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />{obl}</li>)}
                  </ul>
                </div>
                <div className="space-y-2 border-t border-hairline pt-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-error" /> Primary Risks Detected</h3>
                  <ul className="space-y-1.5 pl-5">
                    {summary.topRisks?.map((risk, idx) => <li key={idx} className="text-[11px] text-body flex items-start gap-1.5 leading-relaxed"><ChevronRight className="h-3.5 w-3.5 text-error flex-shrink-0 mt-0.5" />{risk}</li>)}
                  </ul>
                </div>

              </div>
              <div className="glass-card p-4 border-l-4 border-l-primary bg-primary/5 space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wide"><Scale className="h-4 w-4" /> Top 3 Negotiation Recommendations</h3>
                <ol className="space-y-2 pl-1">
                  {summary.negotiationPoints?.map((point, idx) => (
                    <li key={idx} className="text-[11px] text-body flex items-start gap-2.5 leading-relaxed">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 text-[9px] flex-shrink-0 mt-0.5">{idx + 1}</span>
                      {point}
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          )}

          {/* TAB 3: GRAPH */}
          {activeTab === 'graph' && <GraphVisualizer graphData={graphData} onNodeClick={handleGraphNodeClick} />}

          {/* Raw Text Toggle */}
          <div className="glass-card p-4">
            <button onClick={() => setShowRawText(!showRawText)} className="flex justify-between items-center w-full text-left">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">View Raw Extracted Text</h3>
              <span className="text-[10px] text-primary hover:text-primary-active font-semibold uppercase tracking-wider">{showRawText ? 'Hide Text' : 'Show Text'}</span>
            </button>
            {showRawText && <div className="mt-3 bg-canvas border border-hairline rounded-lg p-3 text-[10px] font-mono text-body leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">{contract.rawText}</div>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-4 bg-primary/5 border border-primary/20 space-y-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 w-fit"><MessageSquare className="h-5 w-5" /></div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-ink">Interactive Contract Chat</h3>
              <p className="text-[11px] text-muted leading-normal">Ask specific questions about this contract terms, liabilities, or IP clauses. Powered by in-memory RAG vector search.</p>
            </div>
            <Link to={`/chat/${contract._id}`} className="btn-primary w-full py-2 text-xs">Start AI Chat Console</Link>
          </div>
          {/* Analysis Timeline Card */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-semibold text-ink">Analysis History</h3>
            </div>

            <div className="analysis-timeline">
              {getSampleAnalysisHistory().map((item, idx) => (
                <div key={idx} className="timeline-step">
                  <div className={`timeline-avatar bg-gradient-to-br ${item.analyst.avatarColor}`}>
                    {item.analyst.initials}
                  </div>
                  <div className="timeline-content w-full">
                    <div className="timeline-content-label text-ink">
                      {item.action}
                    </div>
                    <div className="text-[9px] text-muted font-medium">
                      {item.analyst.name}
                    </div>
                    <div className="timeline-content-time text-muted">
                      {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-Side Comparator Card */}
          <div className="glass-card p-4 space-y-3">
            <div className="p-2 bg-canvas text-primary rounded-xl border border-hairline w-fit"><Layers className="h-5 w-5" /></div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-ink">Batch Compare</h3>
              <p className="text-[11px] text-muted leading-normal">Compare multiple uploaded documents side-by-side inside a grid table to flag variances in payment terms, liability caps, and termination.</p>
            </div>
            <Link to="/compare" className="btn-secondary w-full py-2 text-xs">Compare Clauses</Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ContractDetails;

// =========================================================================
// LexiCore AI Portal Homepage (Synapse-Inspired Landing Page)
// =========================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Shield, Cpu, Activity, Database, Layers, BrainCircuit, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const scrollToSpecs = () => {
    document.getElementById('tech-specs')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-navy-950 text-slate-100">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl -z-10 animate-glow"></div>
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-3xl -z-10 animate-glow" style={{ animationDelay: '-3s' }}></div>

      {/* 1. HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center relative">
        {/* Top small badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/40 border border-blue-900/30 rounded-full text-xs font-semibold text-blue-400 mb-6 tracking-wide uppercase">
          <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
          Autonomous Legal Intelligence
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto">
          Vision-Driven Multimodal Autonomous Legal Workspace
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto mt-5 leading-relaxed">
          Bypass brittle manual document scanning and generic parsers. LexiCore AI orchestrates 
          automated risk evaluation, semantic clause matching, and relationship extraction in a unified midnight-navy workspace.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={handleCtaClick}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/20"
          >
            <Terminal className="w-4 h-4" />
            Open Interactive Console
          </button>
          <button
            onClick={scrollToSpecs}
            className="bg-navy-900 hover:bg-[#1a2036] text-slate-300 border border-navy-800 font-bold px-5 py-2.5 rounded-lg text-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            Read System Specs
          </button>
        </div>
      </section>

      {/* 2. STATS SECTION (Sleek Horizontal Bar) */}
      <section className="max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-navy-900/40 border border-navy-850 rounded-xl backdrop-blur-sm">
          <div className="text-center p-2 border-r border-navy-850/50 last:border-0">
            <div className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">AI Agent</div>
            <div className="text-blue-400 font-bold text-xs mt-1">ACTIVE STREAM</div>
          </div>
          <div className="text-center p-2 border-r border-navy-850/50 last:border-0">
            <div className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">Inspection</div>
            <div className="text-blue-400 font-bold text-xs mt-1">10+ CRITICAL FIELDS</div>
          </div>
          <div className="text-center p-2 border-r border-navy-850/50 last:border-0 text-center">
            <div className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">Database</div>
            <div className="text-blue-400 font-bold text-xs mt-1">MONGO + NEO4J</div>
          </div>
          <div className="text-center p-2 last:border-0">
            <div className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">Latency</div>
            <div className="text-blue-400 font-bold text-xs mt-1">&lt; 150MS HEURISTIC</div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-navy-900">
        <div className="mb-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 block mb-1">Capabilities</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Engineered to bypass the limits of standard legal tech</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-navy-900 border border-navy-850 rounded-xl p-5 hover:border-blue-900/40 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-900/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">Risk Compliance Scoring</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Analyzes contract clauses dynamically, flagging hidden liabilities, indemnification exposures, and jurisdiction compliance concerns.
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-850 rounded-xl p-5 hover:border-blue-900/40 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-900/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">Conversational RAG Chat</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Interrogate your agreements in real-time. The vector context assembler supplies accurate snippets directly to the Gemini LLM.
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-850 rounded-xl p-5 hover:border-blue-900/40 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-900/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">Relationship Graphing</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Maps multi-document links, overlap, and agreement structures inside an interactive Neo4j graph registry database.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM SPECS */}
      <section id="tech-specs" className="max-w-5xl mx-auto px-6 py-12 border-t border-navy-900">
        <div className="mb-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 block mb-1">Specifications</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Deep Technical Architecture Specs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-navy-900/50 border border-navy-850 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Visual Bounding Core</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Ingests PDFs, strips structure layers, extracts legal terminology mapping coordinates, and writes clean payload entries.
            </p>
          </div>

          <div className="bg-navy-900/50 border border-navy-850 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Neo4j Network Schema</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Resolves agreement entities, cross-references clauses, and identifies conflict paths inside a high-speed graph network.
            </p>
          </div>

          <div className="bg-navy-900/50 border border-navy-850 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Dual Storage Pipeline</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Stores raw metadata in MongoDB Atlas collections while publishing relationship linkages directly to Neo4j.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FAQS & VIVA PREPARATION */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-navy-900 mb-12">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500 block mb-1">Academic & Viva Guides</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Recruiter & Examiner Q&A Guide</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-[#101424] border border-navy-850 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-400">Q: How does LexiCore AI perform document analysis?</h4>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              A: When a contract is uploaded, our Node.js server parses it via `pdf-parse`. The text is split into clauses, and sent to the Gemini API (or Mock Mode) which applies custom prompts to flag risks, write summaries, and identify metadata.
            </p>
          </div>

          <div className="bg-[#101424] border border-navy-850 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-400">Q: How are database services structured?</h4>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              A: We use MongoDB to store contracts, metadata summaries, and individual clause arrays. In parallel, a Neo4j database is updated to map nodes (contracts and clauses) and link relationships (such as jurisdictional overlaps).
            </p>
          </div>

          <div className="bg-[#101424] border border-navy-850 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-400">Q: How is role-based authentication enforced?</h4>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              A: We implement a custom Express middleware that checks the incoming JWT. If valid, it appends the user details. We then use a role checking guard `authorize('admin')` to ensure only users registered as Administrators can trigger database wipe routines.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

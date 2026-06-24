// =========================================================================
// LexiCore AI Portal Homepage (Synapse-Inspired Landing Page)
// =========================================================================

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Shield, Cpu, Activity, Database, Layers, BrainCircuit } from 'lucide-react';
import HeroBackground from '../components/HeroBackground';

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
    <div className="min-h-screen relative overflow-hidden bg-canvas text-body font-sans">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden min-h-[88vh] flex flex-col justify-center pb-[12vh] md:pb-[16vh]">
        <HeroBackground />

        <div className="relative z-10 max-w-[85rem] mx-auto px-6 pt-12 md:pt-16 pb-10 text-center">
          {/* Top small badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-card/80 border border-hairline rounded-full text-xs font-semibold text-primary mb-6 tracking-wide uppercase backdrop-blur-sm">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
            Autonomous Legal Intelligence
          </div>

          {/* Big Bold Headline */}
          <h1 className="text-6xl md:text-7xl font-serif text-ink leading-tight tracking-tight max-w-4xl mx-auto font-medium">
            Vision-Driven Multimodal Autonomous Legal Workspace
          </h1>

          {/* Subtitle */}
          <p className="text-muted text-base max-w-2xl mx-auto mt-6 leading-relaxed">
            Bypass brittle manual document scanning and generic parsers. LexiCore AI orchestrates 
            automated risk evaluation, semantic clause matching, and relationship extraction in a warm-canvas workspace.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <button
              onClick={handleCtaClick}
              className="btn-primary px-8 py-3.5 text-sm shadow-lg shadow-primary/20"
            >
              <Terminal className="w-4.5 h-4.5" />
              Open Interactive Console
            </button>
            <button
              onClick={scrollToSpecs}
              className="btn-secondary px-8 py-3.5 text-sm backdrop-blur-sm bg-surface-card/70"
            >
              Read System Specs
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION (Sleek Horizontal Bar) */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4.5 bg-surface-card/60 border border-hairline rounded-xl backdrop-blur-sm">
          <div className="text-center p-2 border-r border-hairline last:border-0">
            <div className="text-muted text-xs uppercase font-bold tracking-widest">AI Agent</div>
            <div className="text-primary font-bold text-sm mt-1">ACTIVE STREAM</div>
          </div>
          <div className="text-center p-2 border-r border-hairline last:border-0">
            <div className="text-muted text-xs uppercase font-bold tracking-widest">Inspection</div>
            <div className="text-primary font-bold text-sm mt-1">10+ CRITICAL FIELDS</div>
          </div>
          <div className="text-center p-2 border-r border-hairline last:border-0">
            <div className="text-muted text-xs uppercase font-bold tracking-widest">Database</div>
            <div className="text-primary font-bold text-sm mt-1">MONGO + NEO4J</div>
          </div>
          <div className="text-center p-2 last:border-0">
            <div className="text-muted text-xs uppercase font-bold tracking-widest">Latency</div>
            <div className="text-primary font-bold text-sm mt-1">&lt; 150MS HEURISTIC</div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <section className="max-w-[85rem] mx-auto px-6 py-12 border-t border-hairline">
        <div className="mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-primary block mb-1">Capabilities</span>
          <h2 className="text-3xl font-serif text-ink tracking-tight font-medium">Engineered to bypass the limits of standard legal tech</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="w-9 h-9 rounded-lg bg-canvas border border-hairline text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">Risk Compliance Scoring</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              Analyzes contract clauses dynamically, flagging hidden liabilities, indemnification exposures, and jurisdiction compliance concerns.
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="w-9 h-9 rounded-lg bg-canvas border border-hairline text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">Conversational RAG Chat</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              Interrogate your agreements in real-time. The vector context assembler supplies accurate snippets directly to the OpenAI ChatGPT model.
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="w-9 h-9 rounded-lg bg-canvas border border-hairline text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">Relationship Graphing</h3>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              Maps multi-document links, overlap, and agreement structures inside an interactive Neo4j graph registry database.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM SPECS */}
      <section id="tech-specs" className="max-w-[85rem] mx-auto px-6 py-12 border-t border-hairline">
        <div className="mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-primary block mb-1">Specifications</span>
          <h2 className="text-3xl font-serif text-ink tracking-tight font-medium">Deep Technical Architecture Specs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4.5 h-4.5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-sm uppercase font-bold text-ink tracking-wider font-sans group-hover:text-primary transition-colors">Visual Bounding Core</h4>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Ingests PDFs, strips structure layers, extracts legal terminology mapping coordinates, and writes clean payload entries.
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4.5 h-4.5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-sm uppercase font-bold text-ink tracking-wider font-sans group-hover:text-primary transition-colors">Neo4j Network Schema</h4>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Resolves agreement entities, cross-references clauses, and identifies conflict paths inside a high-speed graph network.
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6 hover:bg-surface-cream-strong transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4.5 h-4.5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-sm uppercase font-bold text-ink tracking-wider font-sans group-hover:text-primary transition-colors">Dual Storage Pipeline</h4>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Stores raw metadata in MongoDB Atlas collections while publishing relationship linkages directly to Neo4j.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FAQS & VIVA PREPARATION */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-hairline mb-12">
        <div className="text-center mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-primary block mb-1">Academic & Viva Guides</span>
          <h2 className="text-3xl font-serif text-ink tracking-tight font-medium">Recruiter & Examiner Q&A Guide</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-card border border-hairline rounded-xl p-6">
            <h4 className="text-base font-semibold text-ink">Q: How does LexiCore AI perform document analysis?</h4>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              A: When a contract is uploaded, our Node.js server parses it via `pdf-parse`. The text is split into clauses, and sent to the OpenAI API (or Mock Mode) which applies custom prompts to flag risks, write summaries, and identify metadata.
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6">
            <h4 className="text-base font-semibold text-ink">Q: How are database services structured?</h4>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              A: We use MongoDB to store contracts, metadata summaries, and individual clause arrays. In parallel, a Neo4j database is updated to map nodes (contracts and clauses) and link relationships (such as jurisdictional overlaps).
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-6">
            <h4 className="text-base font-semibold text-ink">Q: How is role-based authentication enforced?</h4>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              A: We implement a custom Express middleware that checks the incoming JWT. If valid, it appends the user details. We then use a role checking guard `authorize('admin')` to ensure only users registered as Administrators can trigger database wipe routines.
            </p>
          </div>
        </div>
      </section>

    </div>
  );

}

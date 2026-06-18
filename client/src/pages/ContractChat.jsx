// =========================================================================
// RAG Contract Chat Console Page Component
// =========================================================================
// This page provides a full chat console interface enabling interactive 
// natural-language querying of contract contents.
// 
// Key features:
// - Automatic URL lock-in for specific contracts, with a sidebar selector fallback.
// - Quick-query chips (pre-built prompt shortcuts) to facilitate quick demos.
// - Conversation message history (User bubbles vs AI bubbles).
// - Context Source Inspection Drawer: Highlights the exact paragraphs 
//   pulled by the in-memory cosine-similarity search.

import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContracts, getContractById, chatWithContract } from '../services/api';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';

const ContractChat = () => {
  const { id } = useParams();
  const [contractsList, setContractsList] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Chat History & Input
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [activeContext, setActiveContext] = useState('');
  
  const messagesEndRef = useRef(null);

  // Quick prompt templates for demos
  const quickQuestions = [
    "What are the primary risks?",
    "Who owns the intellectual property?",
    "What is the notice period for termination?",
    "Is there a cap on limitation of liability?",
    "What are the payment terms?"
  ];

  // 1. Fetch contract lists on mount
  useEffect(() => {
    const loadContracts = async () => {
      try {
        const res = await getContracts();
        if (res.success) {
          setContractsList(res.contracts);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadContracts();
  }, []);

  const loadActiveContract = async (contractId) => {
    try {
      const res = await getContractById(contractId);
      if (res.success) {
        setSelectedContract(res.contract);
        // Reset chat with welcome message
        setMessages([
          {
            sender: 'ai',
            text: `Hello! I have loaded and indexed "${res.contract.title}". Ask me any questions about its legal clauses, obligations, payment schedules, or risks.`,
            timestamp: new Date()
          }
        ]);
        setActiveContext('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetChat = () => {
    setSelectedContract(null);
    setMessages([]);
    setActiveContext('');
  };

  // 2. Fetch specific contract details when ID changes
  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadActiveContract(id);
    } else {
      resetChat();
    }
  }, [id, contractsList]);

  // Scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingAnswer]);

  // Handle message submission
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !selectedContract) return;

    // Add user message to history
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoadingAnswer(true);

    try {
      // Query RAG backend
      const res = await chatWithContract(selectedContract._id, text);
      
      if (res.success) {
        const aiMsg = { 
          sender: 'ai', 
          text: res.answer, 
          mode: res.mode,
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, aiMsg]);
        setActiveContext(res.contextUsed);
      }
    } catch (err) {
      console.error(err);
      const errMsg = {
        sender: 'ai',
        text: 'Sorry, I encountered an error attempting to scan the document context.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-widest mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)] min-h-[550px]">
        
        {/* SIDEBAR: Contract Selection (1/4 width) */}
        <div className="glass-card p-4 flex flex-col gap-4 overflow-hidden h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Contract</h3>
            <p className="text-[10px] text-slate-500 mt-1">Choose a loaded contract to index into active memory.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {contractsList.map(c => {
              const isActive = selectedContract?._id === c._id;
              return (
                <Link
                  key={c._id}
                  to={`/chat/${c._id}`}
                  className={`block p-3 rounded-xl border text-left transition-all ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500 text-white' 
                      : 'bg-navy-900/30 border-navy-850 text-slate-400 hover:border-navy-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-semibold truncate">{c.title}</p>
                  <span className="text-[9px] text-slate-500 block mt-1 uppercase font-medium">Risk Score: {c.overallRiskScore}%</span>
                </Link>
              );
            })}
            {contractsList.length === 0 && (
              <p className="text-xs text-slate-500 italic mt-4 text-center">No contracts available.</p>
            )}
          </div>
        </div>

        {/* CHAT DISPLAY & INPUT (2/4 width) */}
        <div className="lg:col-span-2 glass-card flex flex-col h-full overflow-hidden">
          
          {/* Active Contract Info Header */}
          <div className="border-b border-navy-800 p-4 bg-navy-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div className="truncate max-w-[250px]">
                <h4 className="text-sm font-semibold text-slate-200 truncate">
                  {selectedContract ? selectedContract.title : 'No Contract Indexed'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {selectedContract ? 'Vector Space Vectorized (RAG Ready)' : 'Select a contract on the left to start'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages History Pane */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-navy-950/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-navy-850 text-slate-200 border border-navy-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.mode && (
                  <span className="text-[8px] text-blue-500/80 font-bold uppercase tracking-widest mt-1 pl-2">
                    Source: {msg.mode}
                  </span>
                )}
              </div>
            ))}
            
            {/* Typing Loader Bubble */}
            {loadingAnswer && (
              <div className="flex items-start gap-1 p-3 bg-navy-850/50 rounded-2xl rounded-tl-none border border-navy-800 w-fit">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Query Shortcut Chips */}
          {selectedContract && messages.length > 0 && (
            <div className="px-4 py-2 border-t border-navy-850/60 bg-navy-900/10 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  disabled={loadingAnswer}
                  className="bg-navy-900 hover:bg-navy-850 border border-navy-800 text-[10px] text-slate-300 font-semibold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-navy-800 bg-navy-900/30">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                disabled={!selectedContract || loadingAnswer}
                placeholder={selectedContract ? "Ask a question about this contract terms..." : "Select a contract first..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="glass-input flex-1 py-2.5 text-xs disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedContract || !inputMessage.trim() || loadingAnswer}
                className="btn-primary p-2.5 rounded-xl disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

        {/* RETRIEVED CONTEXT INSPECTOR (1/4 width) */}
        <div className="glass-card p-4 flex flex-col gap-4 overflow-hidden h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">RAG Context Source</h3>
            <p className="text-[10px] text-slate-500 mt-1">Paragraphs fetched by Cosine Similarity vector matching.</p>
          </div>

          <div className="flex-1 overflow-y-auto bg-navy-950/40 rounded-xl p-3 border border-navy-850 text-[10px] font-mono leading-relaxed text-slate-400 select-all space-y-4">
            {activeContext ? (
              activeContext.split('\n\n').map((chunk, idx) => (
                <div key={idx} className="bg-navy-900/20 p-2 border border-navy-850 rounded-lg">
                  <span className="text-[8px] text-blue-500 font-bold block mb-1">RETRIEVED BLOCK #{idx + 1}</span>
                  "{chunk}"
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic text-center mt-10">Submit a question. The matching context chunks used by the LLM will appear here.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ContractChat;

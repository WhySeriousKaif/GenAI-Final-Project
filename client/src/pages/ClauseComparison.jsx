// =========================================================================
// Clause Comparison Page Component
// =========================================================================
// This page implements the batch contract comparison feature.
// It allows users to:
// 1. Select multiple ingested contracts from a checklist.
// 2. Select specific clause types they want to compare.
// 3. Render a beautiful grid table showing the side-by-side comparisons, 
//    including verbatim texts, section numbers, and risk ratings.

import { useEffect, useState } from 'react';
import { getContracts, getContractById } from '../services/api';
import { RiskScoreBadge } from '../components/RiskBadge';
import CopyButton from '../components/CopyButton';
import { Layers, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClauseComparison = () => {
  const [contractsList, setContractsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // Selection states
  const [selectedContractIds, setSelectedContractIds] = useState([]);
  const [comparedContracts, setComparedContracts] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // List of comparison clauses
  const clauseTypes = [
    'Payment Terms',
    'Termination',
    'Limitation of Liability',
    'Indemnity',
    'IP Ownership',
    'Governing Law',
    'Confidentiality'
  ];
  const [selectedClauses, setSelectedClauses] = useState(['Payment Terms', 'Termination', 'Limitation of Liability']);

  const fetchContractsList = async () => {
    try {
      setLoadingList(true);
      const data = await getContracts();
      if (data.success) {
        setContractsList(data.contracts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContractsList();
  }, []);

  // Toggle contract selection
  const handleToggleContract = (id) => {
    setSelectedContractIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Toggle clause type selection
  const handleToggleClause = (type) => {
    setSelectedClauses(prev => 
      prev.includes(type) 
        ? prev.filter(item => item !== type) 
        : [...prev, type]
    );
  };

  // Execute details fetch for compared contracts
  const handleCompareSubmit = async () => {
    if (selectedContractIds.length === 0) return;
    
    try {
      setLoadingComparison(true);
      const detailPromises = selectedContractIds.map(id => getContractById(id));
      const results = await Promise.all(detailPromises);
      
      const successfulContracts = results
        .filter(res => res.success)
        .map(res => res.contract);
        
      setComparedContracts(successfulContracts);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve detail comparison records.');
    } finally {
      setLoadingComparison(false);
    }
  };

  // Helper to extract a specific clause from a contract record
  const getClauseForContract = (contract, clauseType) => {
    return contract.extractedClauses?.find(c => c.clauseType === clauseType);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Layers className="h-8 w-8 text-blue-500" />
          Batch Clause Comparison
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Select multiple contracts and compare terms side-by-side to discover deviations and variance.
        </p>
      </div>

      {/* Control Panel: Contract Checkbox list & Clause selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Step 1: Select Contracts (Left 2/3 width) */}
        <div className="md:col-span-2 glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Step 1: Select Contracts to Compare
          </h3>
          
          {loadingList ? (
            <div className="text-sm text-slate-400">Loading registry...</div>
          ) : contractsList.length === 0 ? (
            <div className="text-sm text-slate-400 flex items-center gap-2 p-4 border border-navy-800 rounded-xl bg-navy-950/20">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span>No contracts available in database. <Link to="/upload" className="text-blue-500 hover:underline">Upload some first.</Link></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
              {contractsList.map(contract => {
                const isChecked = selectedContractIds.includes(contract._id);
                return (
                  <button
                    key={contract._id}
                    onClick={() => handleToggleContract(contract._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isChecked 
                        ? 'bg-blue-600/10 border-blue-500 text-white' 
                        : 'bg-navy-900/30 border-navy-800 text-slate-300 hover:border-navy-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isChecked 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-slate-500'
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-semibold truncate">{contract.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Risk Rating: {contract.overallRiskScore}%</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Select Clauses (Right 1/3 width) */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Step 2: Select Clause Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {clauseTypes.map(type => {
              const isChecked = selectedClauses.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => handleToggleClause(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isChecked
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                      : 'bg-navy-900/40 border-navy-800 text-slate-400 hover:border-navy-700'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Compare button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompareSubmit}
          disabled={selectedContractIds.length === 0 || selectedClauses.length === 0 || loadingComparison}
          className="btn-primary px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
        >
          {loadingComparison ? 'Loading comparison matrices...' : 'Generate Comparison Matrix'}
        </button>
      </div>

      {/* Step 3: Comparison Grid Table rendering */}
      {comparedContracts.length > 0 && !loadingComparison && (
        <div className="glass-card p-6 overflow-hidden">
          <h3 className="text-md font-bold text-slate-100 mb-6 flex items-center gap-2">
            Comparison Matrix ({comparedContracts.length} Contracts)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="border-b border-navy-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4 w-1/4">Clause Category</th>
                  {comparedContracts.map(contract => (
                    <th key={contract._id} className="pb-4 px-4 truncate">
                      <p className="text-slate-200 font-bold text-sm truncate">{contract.title}</p>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Overall Risk: {contract.overallRiskScore}%
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-xs leading-normal">
                {selectedClauses.map(clauseType => (
                  <tr key={clauseType} className="hover:bg-navy-800/10">
                    {/* Clause Category Row Head */}
                    <td className="py-5 pr-4 font-bold text-slate-300 text-sm align-top">
                      {clauseType}
                    </td>

                    {/* Columns representing contracts */}
                    {comparedContracts.map(contract => {
                      const clause = getClauseForContract(contract, clauseType);
                      
                      if (!clause) {
                        return (
                          <td key={contract._id} className="py-5 px-4 text-slate-500 italic align-top">
                            Clause not detected in this contract.
                          </td>
                        );
                      }

                      return (
                        <td key={contract._id} className="py-5 px-4 space-y-2.5 align-top border-l border-navy-800/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold">{clause.sectionNumber}</span>
                            <RiskScoreBadge score={clause.riskScore} />
                          </div>
                          <div className="relative group">
                            <CopyButton text={clause.clauseText} />
                            <p className="text-slate-300 line-clamp-4 leading-relaxed hover:line-clamp-none transition-all duration-200 cursor-pointer" title="Click to expand">
                              "{clause.clauseText}"
                            </p>
                          </div>
                          <div className="bg-navy-950/40 border border-navy-850 p-2 rounded-lg space-y-1">
                            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider block">Assessment</span>
                            <p className="text-[10px] text-slate-400 leading-normal">{clause.reason}</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClauseComparison;

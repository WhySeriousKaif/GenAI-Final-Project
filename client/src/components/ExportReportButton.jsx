// =========================================================================
// ExportReportButton — Full Analysis JSON Report Downloader
// =========================================================================
// This component assembles the complete AI analysis of a contract into a
// structured JSON report and triggers a native browser file download.
//
// What gets exported:
//   - Report metadata (title, generation timestamp)
//   - Contract metadata (name, upload date, overall risk score)
//   - Executive Summary (purpose, parties, obligations, top risks)
//   - All extracted clauses (type, text, section, risk score, market status)
//   - Negotiation recommendations
//
// Download mechanism:
//   Uses the browser Blob API + URL.createObjectURL() + a temporary <a> tag
//   to trigger a native "Save File" dialog. No backend call needed.
//
// Usage:
//   <ExportReportButton contract={contract} />

import React, { useState, useCallback } from 'react';
import { Download, Check } from 'lucide-react';

/**
 * @param {object} contract - The full contract object from the API response.
 *                            Must contain: title, uploadedAt, overallRiskScore,
 *                            extractedClauses, summary.
 */
const ExportReportButton = ({ contract }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = useCallback(() => {
    if (!contract) return;

    // ---------------------------------------------------------------
    // 1. Assemble the structured report object
    // ---------------------------------------------------------------
    const report = {
      reportTitle: 'LegalAI — Contract Analysis Report',
      generatedAt: new Date().toISOString(),
      generatedBy: 'Legal Document Intelligence System (LegalAI)',

      contractMetadata: {
        contractName: contract.title || 'Unnamed Contract',
        uploadedAt: contract.uploadedAt,
        overallRiskScore: contract.overallRiskScore,
        riskLevel:
          contract.overallRiskScore > 70
            ? 'High'
            : contract.overallRiskScore > 30
            ? 'Medium'
            : 'Low',
      },

      executiveSummary: {
        purpose: contract.summary?.purpose || 'N/A',
        signingParties: contract.summary?.parties || [],
        keyObligations: contract.summary?.keyObligations || [],
        primaryRisksDetected: contract.summary?.topRisks || [],
      },

      negotiationRecommendations: contract.summary?.negotiationPoints || [],

      extractedClauses: (contract.extractedClauses || []).map((clause) => ({
        clauseType: clause.clauseType,
        sectionNumber: clause.sectionNumber,
        riskType: clause.riskType,
        riskScore: clause.riskScore,
        marketStandardStatus: clause.marketStandardStatus,
        riskJustification: clause.reason,
        marketComparisonReason: clause.marketComparisonReason,
        clauseText: clause.clauseText,
      })),
    };

    // ---------------------------------------------------------------
    // 2. Serialize to a pretty-printed JSON string
    // ---------------------------------------------------------------
    const jsonString = JSON.stringify(report, null, 2);

    // ---------------------------------------------------------------
    // 3. Create a Blob and trigger browser download
    // ---------------------------------------------------------------
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Build a safe filename from the contract title
    const safeTitle = (contract.title || 'contract')
      .replace(/[^a-z0-9]/gi, '-')   // replace special chars with hyphens
      .replace(/-+/g, '-')            // collapse multiple hyphens
      .substring(0, 60);              // cap length

    const filename = `LegalAI-Report-${safeTitle}.json`;

    // Create a temporary anchor element to trigger the download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup: remove anchor and revoke the object URL to free memory
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    // ---------------------------------------------------------------
    // 4. Show "Downloaded ✓" confirmation for 2 seconds
    // ---------------------------------------------------------------
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [contract]);

  return (
    <button
      id="export-report-btn"
      onClick={handleExport}
      disabled={!contract}
      title="Download the full AI analysis as a JSON report"
      aria-label="Download Analysis Report"
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-lg text-xs font-bold
        border transition-all duration-200 ease-out
        cursor-pointer select-none active:scale-[0.97]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          downloaded
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : 'bg-navy-900/60 border-navy-700/60 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300'
        }
      `}
    >
      {downloaded ? (
        <>
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          Downloaded!
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 stroke-[2]" />
          Download Report
        </>
      )}
    </button>
  );
};

export default ExportReportButton;

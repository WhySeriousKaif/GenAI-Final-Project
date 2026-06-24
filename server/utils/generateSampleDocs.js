// =========================================================================
// Sample PDF Contract Generator
// =========================================================================
// This script generates three realistic contract PDF files inside the 
// 'sample-contracts' directory using the 'pdfkit' library.
// These sample documents represent different risk levels:
// 1. Standard_SaaS_Agreement.pdf (Favourable / Low Risk)
// 2. Risky_Vendor_Contract.pdf (Unfavourable / High Risk)
// 3. Service_Agreement_Foreign_Jurisdiction.pdf (Unusual / Medium Risk)
//
// Students can run this script to quickly populate their system with test data.

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Target directory for generated sample files
const outputDir = path.join(__dirname, '../../sample-contracts');

// Ensure the target directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Helper to build a clean PDF contract document
 */
const createContractPDF = (filename, title, sections) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(outputDir, filename);
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Document Header
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a8a').text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#4b5563').text(`Generated Test Contract - Legal Document Intelligence System`, { align: 'center' });
      doc.moveDown(1.5);
      
      // Horizontal Line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(1.5);

      // Write Sections
      sections.forEach((sec, idx) => {
        // Section Title
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text(sec.heading);
        doc.moveDown(0.4);
        
        // Section Body Text
        doc.fontSize(10).font('Helvetica').fillColor('#334155').text(sec.text, {
          align: 'justify',
          paragraphGap: 10,
          lineGap: 4
        });
        doc.moveDown(1);
      });

      doc.end();

      writeStream.on('finish', () => {
        console.log(`[PDF Generator] Generated: ${filename}`);
        resolve();
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// =========================================================================
// CONTRACT 1: STANDARD SAAS AGREEMENT (Low Risk / Market Standard)
// =========================================================================
const saasSections = [
  {
    heading: "PREAMBLE",
    text: "This Software as a Service Subscription Agreement (the 'Agreement') is entered into as of June 1, 2026, by and between CloudFlow Solutions Inc. ('Vendor') and TechGrowth Enterprises Inc. ('Customer')."
  },
  {
    heading: "ARTICLE 1: SERVICES & LICENSE",
    text: "Subject to the terms and conditions herein, Vendor hereby grants Customer a non-exclusive, non-transferable, revocable subscription license to access and use the CloudFlow Workflow Platform solely for its internal business operations."
  },
  {
    heading: "Section 3.1: PAYMENT TERMS",
    text: "Customer shall pay all undisputed invoices within thirty (30) days of receipt. All payments must be made in US Dollars via electronic fund transfer or credit card."
  },
  {
    heading: "Article 4.2: TERMINATION FOR CONVENIENCE",
    text: "Either party may terminate this agreement for convenience upon 30 days written notice to the other party without incurring any penalty or liability."
  },
  {
    heading: "Section 6: INTELLECTUAL PROPERTY OWNERSHIP",
    text: "Vendor assigns all rights, titles, and interests in the custom deliverables to the Customer upon full payment. Vendor retains all rights in its pre-existing tools, software libraries, and proprietary technologies."
  },
  {
    heading: "Article 8: MUTUAL INDEMNIFICATION",
    text: "Each party shall defend, indemnify, and hold harmless the other party from and against any and all claims, actions, suits, or demands arising out of material breaches of representations or warranties, or intellectual property infringement claims arising from the platform."
  },
  {
    heading: "Section 9.1: LIMITATION OF LIABILITY",
    text: "In no event shall either party's aggregate liability exceed the total amounts paid by customer in the twelve (12) months preceding the incident. Neither party shall be liable for indirect, incidental, or consequential damages."
  },
  {
    heading: "Section 12.1: GOVERNING LAW",
    text: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without giving effect to any choice of law principles."
  }
];

// =========================================================================
// CONTRACT 2: RISKY VENDOR CONTRACT (High Risk / Unfavourable)
// =========================================================================
const riskySections = [
  {
    heading: "PREAMBLE",
    text: "This Master Procurement Agreement is entered into on June 10, 2026, by and between Apex Hardware Corp ('Apex') and TechGrowth Enterprises Inc. ('Buyer')."
  },
  {
    heading: "Section 3.3: PAYMENT TERMS",
    text: "Buyer shall make full payment on all invoices net ninety (90) days from receipt of invoice. Late payments will incur a compounded interest rate of 3.5% per month."
  },
  {
    heading: "Section 4.2: TERMINATION FOR CONVENIENCE",
    text: "Apex may terminate this agreement immediately at its sole discretion upon 15 days written notice, while Buyer has no right to terminate for convenience and must complete the full 3-year term."
  },
  {
    heading: "Section 7.1: INTELLECTUAL PROPERTY OWNERSHIP",
    text: "Apex retains all intellectual property in custom work product created for Customer. No transfers of copyrights, patent rights, or trademarks shall occur under this procurement agreement."
  },
  {
    heading: "Section 8.2: ONE-SIDED INDEMNITY",
    text: "Buyer agrees to defend, indemnify, and hold harmless Apex from and against any and all claims, damages, losses, and expenses, including attorney fees, arising out of or resulting from the performance of services under this contract, regardless of Apex's negligence."
  },
  {
    heading: "Section 9.1: LIMITATION OF LIABILITY",
    text: "Apex's liability is capped at $500, whereas the Buyer's liability under this agreement is completely unlimited, exposing the Buyer to full operational and consequential damages."
  },
  {
    heading: "Section 14.5: GOVERNING LAW",
    text: "This contract is governed solely by the courts of Tokyo, Japan, and all disputes must be resolved in Tokyo courts under Japanese language proceedings."
  }
];

// =========================================================================
// CONTRACT 3: SERVICE AGREEMENT WITH FOREIGN JURISDICTION (Medium Risk / Unusual)
// =========================================================================
const unusualSections = [
  {
    heading: "PREAMBLE",
    text: "This Consulting Services Agreement is dated June 15, 2026, between Helvetica Consulting AG ('Consultant') and TechGrowth Enterprises Inc. ('Client')."
  },
  {
    heading: "Section 3.3: PAYMENT TERMS",
    text: "Client shall pay all fees Net 45 days. Any dispute regarding invoicing must be filed within 5 days of invoice date, or rights to dispute are permanently waived."
  },
  {
    heading: "Section 4.2: TERMINATION FOR CONVENIENCE",
    text: "Either party may terminate this agreement upon sixty (60) days written notice, but client must reimburse consultant for all future projected revenues if terminated early."
  },
  {
    heading: "Section 7.1: IP INTERESTS",
    text: "All intellectual property rights developed during the consultancy shall remain the sole property of Helvetica Consulting AG. Client is granted a temporary 1-year usage license."
  },
  {
    heading: "Section 9.1: LIMITATION OF LIABILITY",
    text: "Limitation of liability is set to three times (3x) the contract value. This provides unusual protection but does cap general exposures."
  },
  {
    heading: "Section 14.5: GOVERNING LAW",
    text: "This agreement shall be interpreted in accordance with the laws of Switzerland. Any litigation arising from this agreement shall be settled in the courts of Geneva, Switzerland."
  }
];

// =========================================================================
// CONTRACT 4: NDA & MASTER SERVICES AGREEMENT (Mixed Risk / Confidentiality Focus)
// =========================================================================
const msaSections = [
  {
    heading: "PREAMBLE",
    text: "This Non-Disclosure and Master Services Agreement (the 'Agreement') is made effective as of July 1, 2026, between DataVault Analytics Ltd. ('Service Provider') and TechGrowth Enterprises Inc. ('Client')."
  },
  {
    heading: "ARTICLE 2: CONFIDENTIALITY OBLIGATIONS",
    text: "Each party agrees to hold in strict confidence all Confidential Information disclosed by the other party for a period of five (5) years following termination of this Agreement. Confidential Information shall not be disclosed to any third party except as required by law, and each party shall use Confidential Information solely for the purpose of performing obligations under this Agreement."
  },
  {
    heading: "Section 3.2: PAYMENT TERMS",
    text: "Client shall pay all undisputed invoices within forty-five (45) days of invoice date. Service Provider may suspend services if any invoice remains unpaid for more than sixty (60) days. All fees are exclusive of applicable taxes, which Client shall pay."
  },
  {
    heading: "Section 5.1: TERMINATION",
    text: "Either party may terminate this Agreement upon forty-five (45) days prior written notice. Service Provider may terminate immediately upon Client's material breach of confidentiality obligations or failure to pay fees within the cure period of fifteen (15) days after written notice."
  },
  {
    heading: "Section 7.3: INTELLECTUAL PROPERTY OWNERSHIP",
    text: "Client owns all deliverables specifically created for Client under a Statement of Work upon full payment. Service Provider retains all rights to its pre-existing methodologies, frameworks, and generic software components. Jointly developed improvements shall be owned jointly unless otherwise agreed in writing."
  },
  {
    heading: "Section 8.4: INDEMNIFICATION",
    text: "Service Provider shall indemnify Client against third-party claims alleging that the deliverables infringe a U.S. patent or copyright, provided Client gives prompt notice and allows Service Provider to control defense. Client shall indemnify Service Provider against claims arising from Client's misuse of deliverables or violation of applicable law."
  },
  {
    heading: "Section 10.2: LIMITATION OF LIABILITY",
    text: "Except for breaches of confidentiality or indemnification obligations, each party's total liability under this Agreement shall not exceed two times (2x) the fees paid or payable in the twelve (12) months preceding the claim. Neither party shall be liable for lost profits, loss of data, or indirect damages."
  },
  {
    heading: "Section 15.1: GOVERNING LAW AND DISPUTE RESOLUTION",
    text: "This Agreement shall be governed by the laws of the State of New York, without regard to conflict-of-law principles. Any dispute shall first be submitted to good-faith negotiation, followed by binding arbitration in New York City under the rules of the American Arbitration Association."
  }
];

// Execute the Generator
const generate = async () => {
  try {
    await createContractPDF('Standard_SaaS_Agreement.pdf', 'Standard Software as a Service Agreement', saasSections);
    await createContractPDF('Risky_Vendor_Contract.pdf', 'Apex Hardware Master Agreement', riskySections);
    await createContractPDF('Service_Agreement_Foreign_Jurisdiction.pdf', 'Helvetica Consulting Services Agreement', unusualSections);
    await createContractPDF('NDA_Master_Services_Agreement.pdf', 'Non-Disclosure & Master Services Agreement', msaSections);
    console.log('[PDF Generator] Successfully generated all 4 sample contracts.');
  } catch (error) {
    console.error(`[PDF Generator Error]: ${error.message}`);
  }
};

generate();

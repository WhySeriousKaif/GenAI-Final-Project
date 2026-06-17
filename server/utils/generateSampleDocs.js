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

// Execute the Generator
const generate = async () => {
  try {
    await createContractPDF('Standard_SaaS_Agreement.pdf', 'Standard Software as a Service Agreement', saasSections);
    await createContractPDF('Risky_Vendor_Contract.pdf', 'Apex Hardware Master Agreement', riskySections);
    await createContractPDF('Service_Agreement_Foreign_Jurisdiction.pdf', 'Helvetica Consulting Services Agreement', unusualSections);
    console.log('[PDF Generator] Successfully generated all 3 sample contracts.');
  } catch (error) {
    console.error(`[PDF Generator Error]: ${error.message}`);
  }
};

generate();

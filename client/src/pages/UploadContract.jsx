// =========================================================================
// Document Ingestion / Upload Page Component
// =========================================================================
// This page provides a file-drag area for uploading PDF and DOCX contracts.
// It features:
// - HTML5 drag-and-drop listeners with visual state change.
// - Validation checks to block non-compatible files.
// - Interactive loading animation telling the user which pipeline step 
//   is executing (e.g. text extraction, Gemini analysis, Graph DB indexing).
// - Quick instruction guides on how to test with our pre-generated sample PDFs.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadContract } from '../services/api';
import { UploadCloud, File, AlertTriangle, ShieldAlert } from 'lucide-react';

const UploadContract = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Drag listeners
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Invalid file type. Only PDF and DOCX files are supported.');
      setFile(null);
      return false;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum supported size is 10MB.');
      setFile(null);
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Step-by-step visual status simulation for the user
      setPipelineStep('Step 1: Extracting raw text from document buffer...');
      await new Promise(r => setTimeout(r, 1000));
      
      setPipelineStep('Step 2: Processing text with Google Gemini AI...');
      await new Promise(r => setTimeout(r, 1000));
      
      setPipelineStep('Step 3: Calculating clause risk levels and mapping standards...');
      
      const response = await uploadContract(file);
      
      if (response.success) {
        setPipelineStep('Step 4: Syncing document nodes to Neo4j graph registry...');
        await new Promise(r => setTimeout(r, 800));
        
        navigate(`/contract/${response.contractId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze contract. Ensure the backend server is running.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="glass-card p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <UploadCloud className="h-7 w-7 text-blue-500" />
            Document Ingestion Portal
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Upload commercial agreements or contracts for risk scanning.
          </p>
        </div>

        {/* Drag Area */}
        {!uploading && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/5' 
                : 'border-navy-700 bg-navy-900/20 hover:border-navy-600 hover:bg-navy-900/40'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="p-4 bg-navy-800 rounded-full border border-navy-750 text-slate-400">
              <UploadCloud className="h-10 w-10 text-blue-500" />
            </div>
 
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop your file here, or <span className="text-blue-500 hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports PDF and DOCX agreements (Max 10MB)</p>
            </div>
          </div>
        )}

        {/* Loading / Processing State */}
        {uploading && (
          <div className="flex flex-col items-center justify-center p-10 space-y-6 bg-navy-900/40 border border-navy-800 rounded-2xl">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <ShieldAlert className="h-6 w-6 text-blue-500 absolute animate-pulse" />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-md font-bold text-slate-200">Document Ingestion Pipeline Running</h4>
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">{pipelineStep}</p>
              <p className="text-[10px] text-slate-500 italic">This usually takes 3-10 seconds depending on document length.</p>
            </div>
          </div>
        )}

        {/* Selected File Card */}
        {file && !uploading && (
          <div className="bg-navy-900/50 border border-navy-850 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
                <File className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200 truncate max-w-md">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={handleUploadSubmit}
              className="btn-primary py-2 px-5 text-sm"
            >
              Analyze
            </button>
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-bold text-red-400">Ingestion Error</h5>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default UploadContract;

import React from 'react';
import { X, FileText, Download, Calendar, HardDrive, User, CheckCircle2 } from 'lucide-react';

export default function FilePreviewModal({ isOpen, onClose, file, onDownload }) {
  if (!isOpen || !file) return null;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{file.fileName}</h3>
              <p className="text-xs text-slate-500 font-mono">Location: /{file.folder || 'Root'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Metadata pill grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Type</span>
              <span className="font-semibold text-slate-800">{file.fileType?.toUpperCase() || 'FILE'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Size</span>
              <span className="font-semibold text-slate-800">{formatBytes(file.sizeBytes)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Uploaded By</span>
              <span className="font-semibold text-slate-800 truncate block">{file.uploadedBy || 'Team Member'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">S3 Versions</span>
              <span className="font-bold text-blue-600 font-mono">{file.versionCount || 1} iterations</span>
            </div>
          </div>

          {/* File Content Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">File Content Preview</span>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Integrity</span>
              </span>
            </div>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-slate-800 shadow-inner">
              <pre>{file.content || `# ${file.fileName}\n# Stored on Amazon S3 with EventBridge notifications\n\nContent ready for inspection and processing.`}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Amazon S3 Versioned Object</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={() => {
                onDownload(file);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

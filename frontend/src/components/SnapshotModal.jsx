import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  CheckCircle2, 
  Download, 
  Lock, 
  FolderArchive, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../services/api';

export default function SnapshotModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectTitle, 
  onSnapshotSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerateSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createSnapshot(projectId);
      setSnapshotResult(res.data);
      if (onSnapshotSuccess) onSnapshotSuccess(res.data);
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      setError(err.response?.data?.detail || 'Failed to bundle submission snapshot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Submission Snapshot</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{projectTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!snapshotResult ? (
            <>
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Creating a submission snapshot locks current project assets into an immutable S3 prefix <code className="text-blue-800 bg-white px-1.5 py-0.5 rounded font-mono font-bold">/snapshots/{projectId}/[timestamp]/</code> and generates a bundled <code className="text-blue-800 bg-white px-1.5 py-0.5 rounded font-mono font-bold">.zip</code> archive for faculty evaluation.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <h4 className="font-bold text-slate-900">Automated Pipeline Actions:</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Atomic copy of all latest active files into immutable directory</li>
                  <li>In-memory .zip bundle generation with all source code & reports</li>
                  <li>Update project status to <span className="text-emerald-700 font-mono font-bold">SUBMITTED</span></li>
                  <li>Record immutable audit log into <span className="text-blue-700 font-mono font-bold">CloudForge_ActivityLogs</span></li>
                </ul>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerateSnapshot}
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Bundling and Uploading Snapshot...' : 'Confirm & Generate Immutable Snapshot'}</span>
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Submission Snapshot Created!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your project has been sealed and archived on AWS S3.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase">S3 Snapshot Path:</span>
                  <span className="font-mono text-slate-800 break-all font-medium">{snapshotResult.snapshotPrefix}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase">Zip Archive Key:</span>
                  <span className="font-mono text-emerald-700 break-all font-bold">{snapshotResult.zipKey}</span>
                </div>
              </div>

              {snapshotResult.downloadUrl && (
                <a
                  href={snapshotResult.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Bundled Submission .ZIP</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

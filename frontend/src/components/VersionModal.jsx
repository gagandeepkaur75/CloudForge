import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  RotateCcw, 
  Check, 
  Copy, 
  Calendar, 
  User, 
  HardDrive, 
  AlertTriangle, 
  Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

export default function VersionModal({ 
  isOpen, 
  onClose, 
  file, 
  projectId, 
  onVersionRecovered 
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recoveringId, setRecoveringId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    if (isOpen && file && projectId) {
      loadVersions();
    }
  }, [isOpen, file, projectId]);

  const loadVersions = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await api.getFileVersions(projectId, file.fileName);
      setVersions(res.data.versions || []);
    } catch (err) {
      console.error('Failed to load file versions:', err);
      setAlertMsg({ type: 'error', text: 'Could not fetch S3 version history.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (versionId) => {
    if (!window.confirm(`Are you sure you want to restore '${file.fileName}' to this historical version? A new S3 version will be generated.`)) {
      return;
    }
    setRecoveringId(versionId);
    setAlertMsg(null);
    try {
      const res = await api.recoverFileVersion(projectId, file.fileName, versionId);
      setAlertMsg({ 
        type: 'success', 
        text: `Version restored successfully! New S3 Version ID: ${res.data.newVersionId.substring(0, 12)}...` 
      });
      await loadVersions();
      if (onVersionRecovered) onVersionRecovered();
    } catch (err) {
      console.error('Recovery failed:', err);
      setAlertMsg({ type: 'error', text: 'Failed to restore object version.' });
    } finally {
      setRecoveringId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">S3 Object Version History</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-md">{file.fileName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {alertMsg && (
          <div className={`px-6 py-2.5 text-xs flex items-center space-x-2 font-medium ${
            alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-700 border-b border-red-200'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Amazon S3 Object Versioning preserves every file iteration. Recovering a version executes an atomic <code className="text-blue-800 bg-white px-1.5 py-0.5 rounded font-mono font-bold">s3:CopyObject</code> with target <code className="text-blue-800 bg-white px-1.5 py-0.5 rounded font-mono font-bold">VersionId</code>, creating a new current version while keeping the entire historical audit trail intact.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Querying S3 & DynamoDB version records...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No version records found for this file.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div 
                  key={ver.versionId}
                  className={`p-4 rounded-2xl border transition ${
                    ver.isLatest 
                      ? 'bg-blue-50/50 border-blue-300 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ver.isLatest ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ver.label || `v${versions.length - idx}`}
                        </span>
                        {ver.isLatest && (
                          <span className="text-[11px] font-bold text-blue-700 flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active / Latest</span>
                          </span>
                        )}
                      </div>

                      {/* Version ID */}
                      <div className="mt-1.5 flex items-center space-x-2">
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: <span className="text-slate-800 font-semibold">{ver.versionId}</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(ver.versionId, ver.versionId)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Copy S3 VersionId"
                        >
                          {copiedId === ver.versionId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div className="flex items-center space-x-1 font-medium">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatBytes(ver.sizeBytes)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(ver.lastModified || ver.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{ver.uploadedBy || 'Team Member'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="sm:self-center shrink-0">
                      {ver.isLatest ? (
                        <div className="text-xs text-blue-700 font-bold px-3 py-1.5 rounded-xl bg-blue-100/60 border border-blue-200 text-center">
                          Current Version
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRecover(ver.versionId)}
                          disabled={recoveringId === ver.versionId}
                          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${recoveringId === ver.versionId ? 'animate-spin' : ''}`} />
                          <span>{recoveringId === ver.versionId ? 'Restoring...' : 'Recover Version'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

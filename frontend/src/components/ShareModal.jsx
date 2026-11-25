import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  file, 
  projectId 
}) {
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !file) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await api.shareFile(projectId, file.fileName, expiryMinutes);
      setShareData(res.data);
    } catch (err) {
      console.error('Failed to generate pre-signed share link:', err);
      setError('Unable to generate pre-signed URL. Please check AWS S3 permissions.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareData?.shareUrl) {
      navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetAndClose = () => {
    setShareData(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generate Secure Share Link</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{file.fileName}</p>
            </div>
          </div>
          <button 
            onClick={resetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Pre-signed URLs grant temporary, read-only download access directly from Amazon S3 without granting AWS IAM credentials. The link automatically invalidates when the time expires.
            </p>
          </div>

          {/* Expiry Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
              Select Expiration Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '15 Minutes', value: 15 },
                { label: '1 Hour', value: 60 },
                { label: '24 Hours', value: 1440 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setExpiryMinutes(opt.value); setShareData(null); }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border text-center transition ${
                    expiryMinutes === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button or Result */}
          {!shareData ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{loading ? 'Signing S3 URL...' : 'Generate Pre-Signed S3 Link'}</span>
            </button>
          ) : (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Active & Ready</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-medium">
                  Expires in {expiryMinutes} mins
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={shareData.shareUrl}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-3 pr-20 text-xs font-mono text-slate-800 focus:outline-none select-all"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Direct S3 Signed Download</span>
                <a
                  href={shareData.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-bold"
                >
                  <span>Test Download</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={resetAndClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  X,
  FileText,
  Ban
} from 'lucide-react';
import { api } from '../services/api';

export default function FileSharing({ currentUser }) {
  const [sharedLinks, setSharedLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [permission, setPermission] = useState('Download Access');
  const [expiryHours, setExpiryHours] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [newlyGenerated, setNewlyGenerated] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const pRes = await api.getProjects();
      const pList = pRes.data.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setSelectedProjectId(pList[0].projectId);
        const filesResponse = await api.getFiles(pList[0].projectId);
        const files = filesResponse.data.files || [];
        setFilesMap({ [pList[0].projectId]: files });
        if (files.length > 0) setSelectedFileName(files[0].fileName);
      }
      try {
        const linksResponse = await api.getSharedLinks();
        setSharedLinks(linksResponse.data.sharedLinks || []);
      } catch (error) {
        setLoadError(error.message);
      }
    } catch (error) {
      setLoadError(error.message || 'Failed to load project files.');
    }
  };

  const handleProjectSelect = async (pid) => {
    setSelectedProjectId(pid);
    try {
      const response = await api.getFiles(pid);
      const projFiles = response.data.files || [];
      setFilesMap((existing) => ({ ...existing, [pid]: projFiles }));
      setSelectedFileName(projFiles[0]?.fileName || '');
    } catch (error) {
      setLoadError(error.message || 'Failed to load project files.');
    }
  };

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedFileName) return;
    setGenerating(true);
    try {
      const proj = projects.find(p => p.projectId === selectedProjectId);
      const res = await api.createShareLink({
        projectId: selectedProjectId,
        projectName: proj ? proj.title : 'Project',
        fileName: selectedFileName,
        permission,
        expiryHours
      });
      setNewlyGenerated(res.data);
      const updated = await api.getSharedLinks();
      setSharedLinks(updated.data.sharedLinks || []);
    } catch (error) {
      setLoadError(error.message || 'Failed to create a share link.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (linkId) => {
    if (!window.confirm('Revoke this share link immediately? The temporary token will expire.')) return;
    try {
      await api.revokeShareLink(linkId);
      const updated = await api.getSharedLinks();
      setSharedLinks(updated.data.sharedLinks || []);
    } catch (error) {
      setLoadError(error.message || 'Failed to revoke the share link.');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return iso;
    }
  };

  const filteredLinks = sharedLinks.filter(l => 
    l.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    l.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    l.sharedBy?.toLowerCase().includes(search.toLowerCase())
  );

  const availableFiles = filesMap[selectedProjectId] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Secure File Sharing</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {filteredLinks.length} Active & Past Links
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and manage time-limited Amazon S3 Pre-Signed download URLs without exposing permanent credentials.
          </p>
        </div>

        <button
          onClick={() => { setNewlyGenerated(null); setShowModal(true); }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Generate Share Link</span>
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="status">
          {loadError}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          CloudForge uses Amazon S3 pre-signed URLs embedding cryptographic HMAC-SHA256 signatures and expiration timestamps. Links automatically invalidate after their expiry window, preventing unauthorized persistent access.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shared files or projects..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Shared Links Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">File & Project</th>
              <th scope="col" className="px-5 py-3.5">Shared By</th>
              <th scope="col" className="px-5 py-3.5">Permission</th>
              <th scope="col" className="px-5 py-3.5">Created Date</th>
              <th scope="col" className="px-5 py-3.5">Expiration Date</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                  No share links generated yet. Click 'Generate Share Link' to create one.
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => {
                const isExpired = new Date(link.expirationDate) < new Date() || link.status === 'Expired' || link.status === 'Revoked';
                const statusColor = link.status === 'Revoked' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                    isExpired ? 'bg-red-50 text-red-700 border-red-200' : 
                                    'bg-emerald-50 text-emerald-700 border-emerald-200';
                const statusText = link.status === 'Revoked' ? 'Revoked' : isExpired ? 'Expired' : 'Active';

                return (
                  <tr key={link.linkId} className="hover:bg-sky-50/20 transition">
                    {/* File & Project */}
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 block">{link.fileName}</span>
                          <span className="text-[11px] text-slate-400">{link.projectName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Shared By */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      {link.sharedBy?.split('@')[0]}
                    </td>

                    {/* Permission */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {link.permission}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {formatDate(link.createdDate)}
                    </td>

                    {/* Expiration Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDate(link.expirationDate)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                        <span>{statusText}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!isExpired && (
                          <button
                            onClick={() => copyToClipboard(link.shareUrl, link.linkId)}
                            title="Copy Pre-Signed Share URL"
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 flex items-center space-x-1"
                          >
                            {copiedId === link.linkId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === link.linkId ? 'Copied' : 'Copy Link'}</span>
                          </button>
                        )}
                        {statusText === 'Active' && (
                          <button
                            onClick={() => handleRevoke(link.linkId)}
                            title="Revoke Link"
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Share Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Generate Time-Limited Share Link</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!newlyGenerated ? (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                  >
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select File</label>
                  {availableFiles.length === 0 ? (
                    <p className="text-xs text-red-500">No files found in this project to share.</p>
                  ) : (
                    <select
                      value={selectedFileName}
                      onChange={(e) => setSelectedFileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                    >
                      {availableFiles.map((f) => (
                        <option key={f.fileId} value={f.fileName}>{f.fileName} ({f.folder})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Access Permission</label>
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                    >
                      <option>Download Access</option>
                      <option>View Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Link Expiration</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={168}>7 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || availableFiles.length === 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {generating ? 'Signing URL...' : 'Generate Pre-Signed Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pre-signed S3 download URL created! Valid for {expiryHours} hours.</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={newlyGenerated.shareUrl}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-20 text-xs font-mono text-slate-900 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(newlyGenerated.shareUrl, 'new')}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                  >
                    {copiedId === 'new' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'new' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

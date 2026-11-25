import React, { useState, useEffect } from 'react';
import {
  Share2,
  Search,
  Copy,
  Check,
  Ban,
  X
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function FileSharing({ currentUser, globalSearch = '' }) {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await api.getSharedLinks();
    setSharedLinks(res.data.sharedLinks || []);

    const pRes = await api.getProjects();
    const pList = pRes.data.projects || [];
    setProjects(pList);
    if (pList.length > 0) {
      setSelectedProjectId(pList[0].projectId);
    }

    const db = getMockDb();
    setFilesMap(db.files || {});
    const initialFiles = db.files?.[pList[0]?.projectId] || [];
    if (initialFiles.length > 0) {
      setSelectedFileName(initialFiles[0].fileName);
    }
  };

  const handleProjectSelect = (pid) => {
    setSelectedProjectId(pid);
    const projFiles = filesMap[pid] || [];
    setSelectedFileName(projFiles.length > 0 ? projFiles[0].fileName : '');
  };

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedFileName) return;
    setGenerating(true);
    try {
      const proj = projects.find((p) => p.projectId === selectedProjectId);
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
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (linkId) => {
    if (!window.confirm('Revoke this share link?')) return;
    await api.revokeShareLink(linkId);
    const updated = await api.getSharedLinks();
    setSharedLinks(updated.data.sharedLinks || []);
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

  const effectiveSearch = (search || globalSearch || '').toLowerCase();
  const filteredLinks = sharedLinks.filter(
    (l) =>
      !effectiveSearch ||
      l.fileName?.toLowerCase().includes(effectiveSearch) ||
      l.projectName?.toLowerCase().includes(effectiveSearch) ||
      l.sharedBy?.toLowerCase().includes(effectiveSearch)
  );

  const availableFiles = filesMap[selectedProjectId] || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">File Sharing</h1>
          <p className="text-sm text-slate-500 mt-1">Share your project files securely.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewlyGenerated(null);
            setShowModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Create Share Link</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shared files..."
          className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Shared Links Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">File Name</th>
              <th className="px-5 py-3">Shared With / Link</th>
              <th className="px-5 py-3">Expiry Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                  No shared links yet.
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => {
                const isExpired =
                  link.status === 'Expired' ||
                  link.status === 'Revoked' ||
                  new Date(link.expiresAt) < new Date();
                const statusLabel = link.status === 'Revoked' ? 'Revoked' : isExpired ? 'Expired' : 'Active';

                return (
                  <tr key={link.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0B2545]">{link.fileName}</p>
                      <p className="text-xs text-slate-400">{link.projectName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <p className="font-medium text-[#0B2545]">{link.permission}</p>
                      <p className="text-slate-400 truncate max-w-[200px] font-mono text-[11px]">{link.url}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatDate(link.expiresAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          statusLabel === 'Active'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(link.url, link.id)}
                        disabled={statusLabel !== 'Active'}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50 disabled:opacity-40"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-sky-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{copiedId === link.id ? 'Copied' : 'Copy Link'}</span>
                      </button>
                      {statusLabel === 'Active' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(link.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B2545]">Create Share Link</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newlyGenerated ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">Temporary share link generated:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={newlyGenerated.url}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#0B2545] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newlyGenerated.url, 'new')}
                    className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-medium"
                  >
                    {copiedId === 'new' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                  >
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select File</label>
                  <select
                    value={selectedFileName}
                    onChange={(e) => setSelectedFileName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                  >
                    {availableFiles.map((f) => (
                      <option key={f.fileName} value={f.fileName}>
                        {f.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Access Permission</label>
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                    >
                      <option value="View Only">View Only</option>
                      <option value="Download Access">Download Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={24}>24 Hours</option>
                      <option value={168}>7 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || !selectedFileName}
                    className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

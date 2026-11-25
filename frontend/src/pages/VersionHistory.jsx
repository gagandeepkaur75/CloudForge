import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function VersionHistory({ currentUser, globalSearch = '' }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [versions, setVersions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await api.getProjects();
      const pList = pRes.data.projects || [];
      setProjects(pList);

      const db = getMockDb();
      if (pList.length > 0) {
        const firstProjId = pList[0].projectId;
        setSelectedProjectId(firstProjId);
        const fList = db.files?.[firstProjId] || [];
        setFiles(fList);
        if (fList.length > 0) {
          setSelectedFileName(fList[0].fileName);
          loadVersions(firstProjId, fList[0].fileName);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (pid) => {
    setSelectedProjectId(pid);
    const db = getMockDb();
    const fList = db.files?.[pid] || [];
    setFiles(fList);
    if (fList.length > 0) {
      setSelectedFileName(fList[0].fileName);
      loadVersions(pid, fList[0].fileName);
    } else {
      setSelectedFileName('');
      setVersions([]);
    }
  };

  const handleFileSelect = (fileName) => {
    setSelectedFileName(fileName);
    loadVersions(selectedProjectId, fileName);
  };

  const loadVersions = async (projectId, fileName) => {
    setAlertMsg(null);
    try {
      const res = await api.getVersions(projectId, fileName);
      setVersions(res.data.versions || []);
    } catch (err) {
      console.error('Error fetching versions:', err);
    }
  };

  const handleRestore = async (ver) => {
    if (!window.confirm(`Restore '${selectedFileName}' to ${ver.versionNumber}? A new version will be created.`)) {
      return;
    }

    setRestoringId(ver.versionId);
    setAlertMsg(null);
    try {
      await api.restoreVersion(selectedProjectId, selectedFileName, ver.versionId);
      setAlertMsg({
        type: 'success',
        text: `Restored ${selectedFileName} to ${ver.versionNumber} as a new active version.`
      });
      await loadVersions(selectedProjectId, selectedFileName);
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to restore version.' });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownload = (ver) => {
    alert(`Downloading ${selectedFileName} (${ver.versionNumber}).`);
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
  const filteredFiles = files.filter(
    (f) => !effectiveSearch || f.fileName.toLowerCase().includes(effectiveSearch)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">Version History</h1>
        <p className="text-sm text-slate-500 mt-1">View and restore previous file versions.</p>
      </div>

      {alertMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
            alertMsg.type === 'success'
              ? 'bg-sky-50 text-[#0B2545] border border-sky-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Search & Project Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-[#0B2545] font-medium focus:outline-none focus:border-sky-500"
          aria-label="Filter by project"
        >
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Main Layout: File List + Versions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Simple File List */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 self-start">
          <div className="px-4 py-3 text-xs font-semibold text-slate-500 bg-slate-50 rounded-t-xl">
            Files
          </div>
          {loading ? (
            <div className="p-4 text-xs text-slate-500">Loading...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-4 text-xs text-slate-500">No files found.</div>
          ) : (
            filteredFiles.map((f) => {
              const isSelected = f.fileName === selectedFileName;
              return (
                <button
                  key={f.fileName}
                  type="button"
                  onClick={() => handleFileSelect(f.fileName)}
                  className={`w-full px-4 py-3 text-left text-xs font-medium flex items-center space-x-2.5 transition ${
                    isSelected
                      ? 'bg-sky-50 text-[#0B2545] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{f.fileName}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Version History Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-x-auto self-start">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Modified By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-xs text-slate-500">
                    Select a file to view its version history.
                  </td>
                </tr>
              ) : (
                versions.map((ver, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <tr key={ver.versionId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-[#0B2545]">{ver.versionNumber}</span>
                          {isCurrent && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{ver.modifiedBy}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(ver.timestamp)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDownload(ver)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Download</span>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRestore(ver)}
                            disabled={restoringId === ver.versionId}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{restoringId === ver.versionId ? 'Restoring...' : 'Restore'}</span>
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
      </div>
    </div>
  );
}

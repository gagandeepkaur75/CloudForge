import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  RotateCcw, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  Calendar, 
  User, 
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { api, getMockDb } from '../services/api';
import FilePreviewModal from '../components/FilePreviewModal';

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
  const [previewFile, setPreviewFile] = useState(null);

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
    if (!window.confirm(`Are you sure you want to restore '${selectedFileName}' to historical version ${ver.versionNumber}? A new S3 version will be generated without losing previous versions.`)) {
      return;
    }

    setRestoringId(ver.versionId);
    setAlertMsg(null);
    try {
      const res = await api.restoreVersion(selectedProjectId, selectedFileName, ver.versionId);
      setAlertMsg({
        type: 'success',
        text: `Version ${ver.versionNumber} successfully restored! Created new active S3 Version ID: ${res.data.newVersionId.substring(0, 14)}...`
      });
      await loadVersions(selectedProjectId, selectedFileName);
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Failed to restore historical version.' });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownload = (ver) => {
    alert(`Downloading ${selectedFileName} (${ver.versionNumber}) directly from Amazon S3 version archive.`);
  };

  const handlePreview = (ver) => {
    setPreviewFile({
      fileName: `${selectedFileName} (${ver.versionNumber})`,
      folder: 'Version Archive',
      fileType: selectedFileName.split('.').pop(),
      sizeBytes: ver.sizeBytes,
      uploadedBy: ver.modifiedBy,
      versionCount: versions.length,
      content: `# ${selectedFileName} - Version ${ver.versionNumber}\n# Version ID: ${ver.versionId}\n# Modified By: ${ver.modifiedBy}\n# Notes: ${ver.notes || 'S3 Versioning Snapshot'}`
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const filteredFiles = files.filter(f => !effectiveSearch || f.fileName.toLowerCase().includes(effectiveSearch));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0B2545] tracking-tight flex items-center space-x-2">
          <span>Version History and File Recovery</span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200">
            S3 Versioning
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect immutable S3 object version iterations and execute point-in-time file recovery via atomic <code className="text-[#0B2545] bg-sky-50 px-1 rounded font-mono font-bold">s3:CopyObject</code>.
        </p>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center space-x-2 ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
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
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Search Files in Project</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file names..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Selected File</label>
          <select
            value={selectedFileName}
            onChange={(e) => handleFileSelect(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
          >
            {filteredFiles.map((f) => (
              <option key={f.fileId} value={f.fileName}>{f.fileName} ({f.versionCount || 1} versions)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Version History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Version Timeline for <span className="font-mono text-sky-700">{selectedFileName || 'File'}</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono font-medium">
            {versions.length} versions recorded
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Version</th>
                <th scope="col" className="px-5 py-3.5">S3 Version ID</th>
                <th scope="col" className="px-5 py-3.5">Modified By</th>
                <th scope="col" className="px-5 py-3.5">Modified Date</th>
                <th scope="col" className="px-5 py-3.5">File Size</th>
                <th scope="col" className="px-5 py-3.5">Notes</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                    No historical versions available for this file yet.
                  </td>
                </tr>
              ) : (
                versions.map((ver) => (
                  <tr key={ver.versionId} className={`hover:bg-sky-50/20 transition ${ver.isLatest ? 'bg-sky-50/30' : ''}`}>
                    {/* Version Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          ver.isLatest ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ver.versionNumber}
                        </span>
                        {ver.isLatest && (
                          <span className="text-[11px] font-bold text-sky-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Current</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Version ID */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                      {ver.versionId}
                    </td>

                    {/* Modified By */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {ver.modifiedBy}
                    </td>

                    {/* Modified Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {formatDate(ver.modifiedDate)}
                    </td>

                    {/* File Size */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-medium text-slate-600">
                      {formatBytes(ver.sizeBytes)}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {ver.notes || 'Uploaded via CloudForge'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(ver)}
                          title="Preview Version"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(ver)}
                          title="Download Version"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!ver.isLatest ? (
                          <button
                            onClick={() => handleRestore(ver)}
                            disabled={restoringId === ver.versionId}
                            className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs flex items-center space-x-1 transition disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${restoringId === ver.versionId ? 'animate-spin' : ''}`} />
                            <span>{restoringId === ver.versionId ? 'Restoring...' : 'Restore'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 px-3 py-1">Active</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownload}
      />
    </div>
  );
}

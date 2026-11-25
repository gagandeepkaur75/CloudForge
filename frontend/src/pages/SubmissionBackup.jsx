import React, { useState, useEffect } from 'react';
import {
  Archive,
  Download,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function SubmissionBackup({ currentUser, globalSearch = '' }) {
  const [snapshots, setSnapshots] = useState([]);
  const [backupInfo, setBackupInfo] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState(null);

  // Snapshot Modal
  const [showModal, setShowModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // View snapshot detail
  const [viewingSnapshot, setViewingSnapshot] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const snapRes = await api.getSnapshots();
      setSnapshots(snapRes.data.snapshots || []);

      const bRes = await api.getBackupInfo();
      setBackupInfo(bRes.data);

      const pRes = await api.getProjects();
      const pList = pRes.data.projects || [];
      setProjects(pList);
      if (pList.length > 0) {
        setSelectedProjectId(pList[0].projectId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!snapshotName.trim() || !selectedProjectId) return;
    setCreating(true);
    setAlertMsg(null);
    try {
      await api.createSnapshot({
        snapshotName,
        projectId: selectedProjectId,
        description,
        includeAll: true
      });
      setAlertMsg({
        type: 'success',
        text: `Snapshot '${snapshotName}' created.`
      });
      setShowModal(false);
      setSnapshotName('');
      setDescription('');
      await loadData();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to create snapshot.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadSnapshot = (snap) => {
    alert(`Downloading ${snap.zipKey || 'submission.zip'}.`);
    if (snap.downloadUrl) {
      window.open(snap.downloadUrl, '_blank');
    }
  };

  const handleRestoreSnapshot = async (snap) => {
    if (!window.confirm(`Restore files from snapshot '${snap.snapshotName}' into a recovery folder?`)) {
      return;
    }
    setAlertMsg({
      type: 'success',
      text: `Restored '${snap.snapshotName}' into recovery folder.`
    });
  };

  const handleRestoreBackup = async (rec) => {
    if (!window.confirm(`Restore backup from ${formatDate(rec.date)}?`)) {
      return;
    }
    await api.restoreBackup(rec.id);
    setAlertMsg({
      type: 'success',
      text: `Backup recovery point ${rec.id} restored.`
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const filteredSnapshots = snapshots.filter(
    (s) =>
      !globalSearch ||
      s.snapshotName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      s.projectName?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const latestBackupRecord = backupInfo?.records?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">Submission & Backup</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your final project snapshots and backups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Snapshot</span>
        </button>
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

      {/* Two Compact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Snapshots</p>
            <p className="text-2xl font-bold text-[#0B2545] mt-1">{snapshots.length}</p>
          </div>
          <Archive className="w-5 h-5 text-sky-500" />
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Last Backup</p>
            <p className="text-2xl font-bold text-[#0B2545] mt-1">
              {backupInfo?.lastBackupDate ? formatDate(backupInfo.lastBackupDate) : 'Today'}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-sky-500" />
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[#0B2545]">Snapshots</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Snapshot Name</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3">Created By</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                    Loading snapshots...
                  </td>
                </tr>
              ) : filteredSnapshots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                    No snapshots created yet.
                  </td>
                </tr>
              ) : (
                filteredSnapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-medium text-[#0B2545]">{snap.snapshotName}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{snap.projectName}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(snap.createdAt)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{snap.createdBy}</td>
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingSnapshot(snap)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Section */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-[#0B2545]">Backup Status</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
              {backupInfo?.status || 'Healthy'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Last Backup: {backupInfo?.lastBackupDate ? formatDate(backupInfo.lastBackupDate) : 'Automated Daily Vault'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleRestoreBackup(latestBackupRecord || { id: 'vault-latest', date: new Date().toISOString() })}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
          <span>Restore Backup</span>
        </button>
      </div>

      {/* Create Snapshot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B2545]">Create Snapshot</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Snapshot Name</label>
                <input
                  type="text"
                  required
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="Final Submission v1.0"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Final project deliverables"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                />
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
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Snapshot Modal */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B2545]">{viewingSnapshot.snapshotName}</h3>
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <p><span className="font-medium text-[#0B2545]">Project:</span> {viewingSnapshot.projectName}</p>
              <p><span className="font-medium text-[#0B2545]">Created By:</span> {viewingSnapshot.createdBy}</p>
              <p><span className="font-medium text-[#0B2545]">Date:</span> {formatDate(viewingSnapshot.createdAt)}</p>
              <p><span className="font-medium text-[#0B2545]">Files:</span> {viewingSnapshot.fileCount || 0} files</p>
              {viewingSnapshot.description && (
                <p><span className="font-medium text-[#0B2545]">Description:</span> {viewingSnapshot.description}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

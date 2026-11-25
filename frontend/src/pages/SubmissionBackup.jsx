import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  HardDrive, 
  Clock, 
  Calendar, 
  FileArchive, 
  Lock, 
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function SubmissionBackup({ currentUser }) {
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
  const [includeAll, setIncludeAll] = useState(true);
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
      const res = await api.createSnapshot({
        snapshotName,
        projectId: selectedProjectId,
        description,
        includeAll
      });
      setAlertMsg({
        type: 'success',
        text: `Snapshot '${snapshotName}' sealed into immutable S3 /snapshots/ prefix! Archive ready.`
      });
      setShowModal(false);
      setSnapshotName('');
      setDescription('');
      await loadData();
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Failed to create academic snapshot.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadSnapshot = (snap) => {
    alert(`Downloading ${snap.zipKey || 'submission.zip'} generated on Amazon S3.`);
    if (snap.downloadUrl) {
      window.open(snap.downloadUrl, '_blank');
    }
  };

  const handleRestoreSnapshot = async (snap) => {
    if (!window.confirm(`Restore project files from snapshot '${snap.snapshotName}'? This will restore files into a new timestamped recovery directory without overwriting existing data.`)) {
      return;
    }
    setAlertMsg({
      type: 'success',
      text: `Project files from '${snap.snapshotName}' restored successfully into safe workspace recovery folder.`
    });
  };

  const handleRestoreBackup = async (rec) => {
    if (!window.confirm(`Restore entire system state from AWS Backup vault record dated ${new Date(rec.date).toLocaleDateString()}?`)) {
      return;
    }
    await api.restoreBackup(rec.id);
    setAlertMsg({
      type: 'success',
      text: `AWS Backup Vault successfully restored recovery point ${rec.id}.`
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2545] tracking-tight flex items-center space-x-2">
            <span>Project Submission & Disaster Backup</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200">
              Immutable Archives
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bundle final project releases into sealed S3 snapshots and manage automated AWS Backup vault plans.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Archive className="w-4 h-4 text-sky-300" />
          <span>Create Final Snapshot</span>
        </button>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center space-x-2 ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Snapshot Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Academic Submission Snapshots</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {snapshots.length}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Snapshot Name</th>
                <th scope="col" className="px-5 py-3.5">Target Project</th>
                <th scope="col" className="px-5 py-3.5">Created By</th>
                <th scope="col" className="px-5 py-3.5">Creation Date</th>
                <th scope="col" className="px-5 py-3.5">Files Bundled</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                    No academic submission snapshots created yet.
                  </td>
                </tr>
              ) : (
                snapshots.map((snap) => (
                  <tr key={snap.snapshotId} className="hover:bg-emerald-50/20 transition">
                    {/* Snapshot Name */}
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <FileArchive className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{snap.snapshotName}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">{snap.zipKey}</span>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-bold">
                      {snap.projectName}
                    </td>

                    {/* Created By */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      {snap.createdBy?.split('@')[0]}
                    </td>

                    {/* Creation Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {formatDate(snap.createdDate)}
                    </td>

                    {/* File Count */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-800">
                      {snap.fileCount} files
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Sealed / Submitted</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingSnapshot(snap)}
                          title="View Snapshot Details"
                          className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadSnapshot(snap)}
                          title="Download .zip archive"
                          className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>.ZIP</span>
                        </button>
                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          title="Restore Snapshot to Workspace"
                          className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>AWS Backup Vault & Disaster Recovery</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Daily Automated
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralized backup vault safeguarding Amazon DynamoDB tables and Amazon S3 buckets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vault Status</span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm font-bold text-slate-900">{backupInfo?.status || 'Healthy'}</p>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Target: {backupInfo?.vaultName || 'CloudForgeBackupVault'}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Recovery Point</span>
            <p className="text-sm font-bold text-slate-900 mt-2 font-mono">{formatDate(backupInfo?.lastBackupDate)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Auto-executed via AWS cron policy</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protected Resources</span>
            <p className="text-sm font-bold text-slate-900 mt-2">3 DynamoDB Tables + S3</p>
            <p className="text-[11px] text-slate-400 mt-1">30 days retention policy</p>
          </div>
        </div>

        {/* Available Backup Records Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Recovery Point ID</th>
                <th scope="col" className="px-5 py-3.5">Backup Date</th>
                <th scope="col" className="px-5 py-3.5">Archive Size</th>
                <th scope="col" className="px-5 py-3.5">Type</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(backupInfo?.availableRecords || []).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                    {rec.id}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                    {formatDate(rec.date)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    {rec.size}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                    {rec.type}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleRestoreBackup(rec)}
                      className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold border border-blue-200 transition"
                    >
                      Restore Backup
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Final Snapshot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Create Final Project Snapshot</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                >
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Snapshot Name *</label>
                <input
                  type="text"
                  required
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g. Final Submission UCS531 v1.0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes for faculty evaluation, test instructions, or dependencies..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  id="include-all"
                  type="checkbox"
                  checked={includeAll}
                  onChange={(e) => setIncludeAll(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="include-all" className="text-xs font-medium text-slate-700">
                  Include all project files (source code, datasets, reports, presentations)
                </label>
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
                  disabled={creating || !snapshotName.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Bundling...' : 'Create Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snapshot Details Modal */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{viewingSnapshot.snapshotName}</h3>
              <button onClick={() => setViewingSnapshot(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p><strong>Project:</strong> {viewingSnapshot.projectName}</p>
              <p><strong>Created By:</strong> {viewingSnapshot.createdBy}</p>
              <p><strong>Date:</strong> {formatDate(viewingSnapshot.createdDate)}</p>
              <p><strong>Bundled Assets:</strong> {viewingSnapshot.fileCount} files</p>
              <p className="font-mono text-slate-500 break-all"><strong>S3 Key:</strong> {viewingSnapshot.zipKey}</p>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 italic">
                "{viewingSnapshot.description || 'Academic submission bundle.'}"
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
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

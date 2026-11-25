import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  UploadCloud,
  FolderKanban,
  FileText,
  Users,
  HardDrive,
  ArrowRight
} from 'lucide-react';
import { api, getMockDb } from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';

export default function DashboardOverview({
  currentUser,
  globalSearch = '',
  onSelectProject,
  onNavigateTab
}) {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects();
      const projList = res.data.projects || [];
      setProjects(projList);

      const db = getMockDb();
      setFilesMap(db.files || {});
      setActivities(db.activities || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data) => {
    await api.createProject(data);
    await loadDashboardData();
  };

  const firstName = (currentUser?.name || 'User').split(' ')[0];
  const totalProjects = projects.length;
  const totalFiles = Object.values(filesMap).reduce((sum, list) => sum + list.length, 0);
  const totalStorageBytes = projects.reduce((acc, p) => acc + (p.totalStorageBytes || 0), 0);

  const allContributors = new Set();
  projects.forEach((p) => {
    if (p.members) {
      p.members.forEach((m) => allContributors.add(typeof m === 'string' ? m : m.email));
    }
  });

  const maxStorageBytes = 100 * 1024 * 1024; // 100 MB
  const storagePercentage = Math.min(100, Math.round((totalStorageBytes / maxStorageBytes) * 100));

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const recentProjects = projects
    .filter(
      (p) =>
        !globalSearch ||
        p.title?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(globalSearch.toLowerCase())
    )
    .slice(0, 3);

  const recentActivities = activities.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your projects and files in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (projects.length > 0) onSelectProject(projects[0]);
              else onNavigateTab('projects');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-sky-50 text-[#0B2545] border border-slate-200 text-sm font-medium transition"
          >
            <UploadCloud className="w-4 h-4 text-sky-500" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-[#0B2545]">{totalProjects}</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Files</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-[#0B2545]">{totalFiles}</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Team Members</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-[#0B2545]">{allContributors.size || 3}</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Storage Used</span>
            <HardDrive className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-[#0B2545]">{formatBytes(totalStorageBytes)}</p>
        </div>
      </div>

      {/* Storage Progress Section */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-sm mb-2.5">
          <span className="font-medium text-[#0B2545]">
            {formatBytes(totalStorageBytes)} of 100 MB used
          </span>
          <span className="font-semibold text-sky-600">{storagePercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>

      {/* Recent Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B2545]">Recent Projects</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Loading projects...
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              No projects found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((p) => {
                const isSubmitted = p.snapshotStatus === 'SUBMITTED' || p.status === 'Submitted';
                return (
                  <div
                    key={p.projectId}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-sm font-semibold text-[#0B2545] truncate">{p.title}</h3>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            isSubmitted
                              ? 'bg-[#0B2545] text-white'
                              : 'bg-sky-50 text-sky-700'
                          }`}
                        >
                          {isSubmitted ? 'Submitted' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Updated {formatDate(p.lastModified || p.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProject(p)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium shrink-0 transition"
                    >
                      Open Project
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B2545]">Recent Activity</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('activity')}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No recent activity.</div>
            ) : (
              recentActivities.map((act, idx) => (
                <div key={act.id || idx} className="p-4 text-xs space-y-1">
                  <p className="text-[#0B2545] font-medium leading-snug">
                    <span className="font-semibold">{act.actor}</span> — {act.details}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatDate(act.timestamp)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}

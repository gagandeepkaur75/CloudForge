import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Layers, 
  HardDrive, 
  Users, 
  Archive, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Sparkles,
  PlusCircle,
  X,
  FileText,
  UploadCloud,
  UserPlus,
  Camera,
  FolderKanban,
  FileCode2,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { authService } from '../services/auth';
import CreateProjectModal from '../components/CreateProjectModal';

export default function DashboardOverview({ 
  currentUser, 
  onSelectProject, 
  onNavigateTab,
  onOpenUpload,
  onOpenInvite,
  onOpenSnapshot
}) {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dashboardAvailable, setDashboardAvailable] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    setDashboardAvailable(false);
    setLoadError('');
    setProjects([]);
    setFilesMap({});
    setActivities([]);

    if (authService.isMockMode()) {
      setLoadError('Demo mode is active. Sample workspace data is hidden; connect the real backend to view projects and files.');
      setLoading(false);
      return;
    }

    if (!authService.getApiUrl()) {
      setLoadError('The CloudForge backend is not configured. Set VITE_API_URL to the deployed API Gateway URL to load real workspace data.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.getProjects();
      const projList = res.data.projects || [];
      const projectData = await Promise.all(projList.map(async (project) => {
        const [filesResponse, activityResponse] = await Promise.all([
          api.getFiles(project.projectId),
          api.getActivityLogs(project.projectId)
        ]);
        return {
          projectId: project.projectId,
          files: filesResponse.data.files || [],
          activities: (activityResponse.data.activities || []).map((activity) => ({
            ...activity,
            projectId: project.projectId,
            projectName: project.title
          }))
        };
      }));

      setProjects(projList);
      setFilesMap(Object.fromEntries(projectData.map(({ projectId, files }) => [projectId, files])));
      setActivities(projectData.flatMap(({ activities }) => activities));
      setDashboardAvailable(true);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setLoadError(err.response?.data?.detail || err.message || 'Failed to load workspace data from the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data) => {
    await api.createProject(data);
    await loadDashboardData();
  };

  // Calculations for summary cards
  const totalProjects = projects.length;
  const allFiles = Object.entries(filesMap).flatMap(([projectId, files]) =>
    files.map((file) => ({ ...file, projectId }))
  );
  const totalFiles = allFiles.length;
  const totalStorageBytes = allFiles.reduce((total, file) => total + (file.sizeBytes || 0), 0);
  const allContributors = new Set();
  projects.forEach(p => {
    if (p.members) p.members.forEach(m => allContributors.add(typeof m === 'string' ? m : m.email));
  });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Welcome Heading & Quick Actions */}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Welcome back, <span className="text-sky-600">{currentUser?.name || 'Researcher'}</span>!
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {currentUser?.role || 'Admin'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Centralized Academic Workspace • Cloud Computing (UCS531)
          </p>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Workspace overview
          </span>
        </div>

        {/* Quick Action Buttons */}
        {dashboardAvailable && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex min-h-10 items-center justify-center space-x-1.5 whitespace-nowrap rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 sm:px-3.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => {
              if (projects.length > 0) onSelectProject(projects[0]);
              else onNavigateTab('projects');
            }}
            className="flex min-h-10 items-center justify-center space-x-1.5 whitespace-nowrap rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 sm:px-3.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => onNavigateTab('team')}
            className="flex min-h-10 items-center justify-center space-x-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:px-3.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>Invite Member</span>
          </button>
          <button
            onClick={() => onNavigateTab('submission')}
            className="flex min-h-10 items-center justify-center space-x-1.5 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:px-3.5"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-600" />
            <span>Create Snapshot</span>
          </button>
        </div>}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500" role="status">
          Loading workspace data…
        </div>
      ) : !dashboardAvailable ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8" role="status">
          <h2 className="text-lg font-bold text-slate-900">Workspace data unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{loadError}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            No sample project or file counts are shown. Once the authenticated backend is configured, this dashboard will load project and file metadata from it.
          </p>
        </div>
      ) : (
      <>
      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">{totalProjects}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Active workspaces</p>
        </div>

        {/* Card 2: Total Files */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Files</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileCode2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">{totalFiles}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Source code, data & reports</p>
        </div>

        {/* Card 3: Team Members */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Members</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">{allContributors.size}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Student collaborators</p>
        </div>

        {/* Card 4: Storage Used */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listed File Size</span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-sky-600 mt-2 font-mono">{formatBytes(totalStorageBytes)}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Across listed files</p>
          </div>
      </div>

      {/* 3. Main Split: Recent Projects (Left) + Recent Activities (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Recent Projects</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {projects.length}
              </span>
            </h2>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No projects are available for this account.
            </p>
          ) : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((p) => {
              const fileCount = (filesMap[p.projectId] || []).length;
              const memberCount = p.members?.length || 1;
              const isSubmitted = p.snapshotStatus === 'SUBMITTED';

              return (
                <div
                  key={p.projectId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                        {p.category || 'Workspace'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSubmitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {p.status || (isSubmitted ? 'Submitted' : 'In Progress')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'Collaborative engineering workspace.'}
                    </p>

                    <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500 font-medium">
                      <span>Owner: <strong className="text-slate-700 font-semibold">{p.ownerEmail?.split('@')[0]}</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>{fileCount} files</span>
                      <span>•</span>
                      <span>{memberCount} members</span>
                    </div>

                    <button
                      onClick={() => onSelectProject(p)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-500 hover:text-white text-sky-700 text-xs font-bold transition flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>}

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Files</h2>
            {allFiles.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No files are listed in your accessible projects.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {allFiles
                  .map((file) => ({
                    ...file,
                    projectName: projects.find((project) => project.projectId === file.projectId)?.title
                      || projects.find((project) => (filesMap[project.projectId] || []).includes(file))?.title
                      || 'Project'
                  }))
                  .slice(0, 5)
                  .map((file, index) => (
                    <div key={file.fileId || `${file.projectName}-${file.fileName}-${index}`} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{file.fileName}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{file.projectName}{file.folder ? ` · ${file.folder}` : ''}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">{formatBytes(file.sizeBytes || 0)}</span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent Activities Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Recent Activities</span>
            </h2>
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800"
            >
              View Full Logs
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 max-h-[480px] overflow-y-auto">
            {activities.slice(0, 6).map((act, idx) => (
              <div key={act.id || idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-sky-50/30 transition text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">{act.actor}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(act.timestamp)}</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{act.details}</p>
                <span className="text-[10px] text-sky-600 font-medium block">{act.projectName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
      </>
      )}
    </div>
  );
}

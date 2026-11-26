import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  MoreVertical, 
  ArrowRight, 
  Clock, 
  Calendar, 
  Users, 
  FileCode2, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Lock, 
  Globe 
} from 'lucide-react';
import { api } from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';

export default function MyProjects({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [operationError, setOperationError] = useState('');

  // Edit modal
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setOperationError('');
    try {
      const res = await api.getProjects();
      const projectList = res.data.projects || [];
      setProjects(projectList);
      const projectFiles = await Promise.all(projectList.map(async (project) => {
        const filesResponse = await api.getFiles(project.projectId);
        return [project.projectId, filesResponse.data.files || []];
      }));
      setFilesMap(Object.fromEntries(projectFiles));
    } catch (error) {
      console.error('Failed to load projects:', error);
      setOperationError(error.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    await api.createProject(data);
    await loadProjects();
  };

  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project workspace and all its versioned files?')) return;
    setOperationError('');
    try {
      await api.deleteProject(projectId);
      setActiveMenuId(null);
      await loadProjects();
    } catch (error) {
      setOperationError(error.message || 'Project deletion failed.');
    }
  };

  const handleOpenEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDesc(project.description || '');
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setOperationError('');
    try {
      await api.updateProject(editingProject.projectId, { title: editTitle, description: editDesc });
      setEditingProject(null);
      await loadProjects();
    } catch (error) {
      setOperationError(error.message || 'Project update failed.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' ? true : 
                          statusFilter === 'Submitted' ? p.snapshotStatus === 'SUBMITTED' || p.status === 'Submitted' :
                          p.snapshotStatus !== 'SUBMITTED' && p.status !== 'Submitted';
    return matchesSearch && matchesStatus;
  });

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      {operationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {operationError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>My Projects</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {filteredProjects.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your collaborative project workspaces, deliverables, and team access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          {['All', 'In Progress', 'Submitted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No project workspaces match your search</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter, or create a new project workspace.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const fileCount = (filesMap[p.projectId] || []).length;
            const memberCount = p.members?.length || 1;
            const isSubmitted = p.snapshotStatus === 'SUBMITTED' || p.status === 'Submitted';

            return (
              <div
                key={p.projectId}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Category, Status & Menu */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                      {p.category || 'Workspace'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSubmitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {isSubmitted ? 'Submitted' : 'In Progress'}
                      </span>

                      {/* 3-dot dropdown menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === p.projectId ? null : p.projectId);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === p.projectId && (
                          <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                            <button
                              onClick={(e) => handleOpenEdit(p, e)}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(p.projectId, e)}
                              className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center space-x-1.5 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description || 'Collaborative engineering workspace.'}
                  </p>

                  {/* Owner and Visibility */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Owner: <strong className="text-slate-700 font-semibold">{p.ownerEmail?.split('@')[0]}</strong></span>
                    <span className="flex items-center space-x-1 text-[11px] text-slate-400">
                      {p.visibility === 'Private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      <span>{p.visibility || 'Team Shared'}</span>
                    </span>
                  </div>

                  {/* Timestamps */}
                  <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Created: {formatDate(p.createdAt)}</div>
                    <div>Modified: {formatDate(p.lastModified || p.createdAt)}</div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fileCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{memberCount}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProject(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1 shadow-2xs"
                  >
                    <span>Open Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Project Details</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

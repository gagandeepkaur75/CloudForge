import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';

export default function MyProjects({ globalSearch = '', onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Edit modal
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects();
      setProjects(res.data.projects || []);
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
    if (!window.confirm('Delete this project workspace and all its files?')) return;
    await api.deleteProject(projectId);
    setActiveMenuId(null);
    await loadProjects();
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
    await api.updateProject(editingProject.projectId, { title: editTitle, description: editDesc });
    setEditingProject(null);
    await loadProjects();
  };

  const effectiveSearch = (search || globalSearch || '').toLowerCase();
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !effectiveSearch ||
      p.title.toLowerCase().includes(effectiveSearch) ||
      (p.description && p.description.toLowerCase().includes(effectiveSearch));
    const isSubmitted = p.snapshotStatus === 'SUBMITTED' || p.status === 'Submitted';
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Submitted'
        ? isSubmitted
        : !isSubmitted;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      onClick={() => activeMenuId && setActiveMenuId(null)}
    >
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">My Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all your projects in one place.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          {['All', 'In Progress', 'Submitted'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects 2-Column Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8">
          <p className="text-sm font-medium text-[#0B2545]">No projects found</p>
          <p className="text-xs text-slate-500 mt-1">Create a new project or adjust your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((p) => {
            const isSubmitted = p.snapshotStatus === 'SUBMITTED' || p.status === 'Submitted';

            return (
              <div
                key={p.projectId}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition flex flex-col justify-between relative"
              >
                <div>
                  {/* Title, Status, Three-dot Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-base font-semibold text-[#0B2545] truncate">{p.title}</h3>
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
                      <p className="text-sm text-slate-500 mt-1.5 truncate">
                        {p.description || 'Collaborative project workspace.'}
                      </p>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === p.projectId ? null : p.projectId);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100"
                        aria-label="Project options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === p.projectId && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-xs">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(p, e)}
                            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(p.projectId, e)}
                            className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Owner, Updated Date, Open Project */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span className="font-medium text-[#0B2545]">{p.ownerEmail?.split('@')[0] || 'Owner'}</span>
                    <span className="mx-1.5">•</span>
                    <span>{formatDate(p.lastModified || p.createdAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium transition"
                  >
                    Open Project
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B2545]">Edit Project</h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium"
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

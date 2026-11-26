import React, { useState } from 'react';
import { X, FolderPlus, Tag, Eye } from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud Architecture');
  const [visibility, setVisibility] = useState('Team Shared');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onCreate({ title, description, category, visibility });
      setTitle('');
      setDescription('');
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Project creation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">{error}</div>}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Key-Value Store with Raft"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
              Project Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of project deliverables and goals..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
              >
                <option>Cloud Architecture</option>
                <option>AI & Machine Learning</option>
                <option>Distributed Systems</option>
                <option>Web Development</option>
                <option>Data Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
              >
                <option>Team Shared</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

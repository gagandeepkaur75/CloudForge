import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Shield,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function InviteModal({
  isOpen,
  onClose,
  projectId,
  onMemberInvited
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Contributor');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await api.inviteMember(projectId, email, role);
      setStatusMsg({ type: 'success', text: `${email} was added to the project as ${role}. They can access it after signing in with this email.` });
      setEmail('');
      if (onMemberInvited) onMemberInvited();
    } catch (err) {
      console.error('Failed to invite member:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Failed to add project member.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Invite Project Member</h3>
              <p className="text-xs text-slate-500">UCS531 Student Collaborator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
              University Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@thapar.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
              Assigned Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Contributor', desc: 'Upload, delete and share files' },
                { id: 'Editor', desc: 'Edit project files and recover versions' },
                { id: 'Viewer', desc: 'View project files and history' },
                { id: 'Admin', desc: 'Manage members and create snapshots' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    role === r.id
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>{r.id}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding...' : 'Add Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

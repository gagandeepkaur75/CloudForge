import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function TeamMembers({ currentUser, globalSearch = '' }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects();
      const projList = res.data.projects || [];
      setProjects(projList);
      if (projList.length > 0) {
        setSelectedProjectId(projList[0].projectId);
        setMembers(projList[0].members || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (pid) => {
    setSelectedProjectId(pid);
    const p = projects.find((x) => x.projectId === pid);
    if (p) setMembers(p.members || []);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setAlertMsg(null);
    try {
      await api.inviteMember(selectedProjectId, inviteEmail, inviteRole);
      setAlertMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
      setShowInviteModal(false);

      const db = getMockDb();
      const p = db.projects.find((x) => x.projectId === selectedProjectId);
      if (p) setMembers(p.members || []);
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to invite collaborator.' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (email, newRole) => {
    await api.updateMemberRole(selectedProjectId, email, newRole);
    setMembers(members.map((m) => (m.email === email ? { ...m, role: newRole } : m)));
    setAlertMsg({ type: 'success', text: `Updated ${email} to ${newRole}.` });
  };

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`Remove ${email} from this project?`)) return;
    await api.removeMember(selectedProjectId, email);
    setMembers(members.filter((m) => m.email !== email));
    setAlertMsg({ type: 'success', text: `Removed ${email}.` });
  };

  const effectiveSearch = (search || globalSearch || '').toLowerCase();
  const filteredMembers = members.filter(
    (m) =>
      !effectiveSearch ||
      m.name?.toLowerCase().includes(effectiveSearch) ||
      m.email?.toLowerCase().includes(effectiveSearch) ||
      m.role?.toLowerCase().includes(effectiveSearch)
  );

  const getInitials = (m) => {
    if (m.avatar) return m.avatar;
    const base = m.name || m.email || 'U';
    return base
      .split(' ')
      .map((s) => s[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">Team Members</h1>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {filteredMembers.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
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
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Search & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-[#0B2545] font-medium focus:outline-none focus:border-sky-500"
          aria-label="Select project"
        >
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Member</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                  Loading members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                  No members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
                <tr key={m.email} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {getInitials(m)}
                      </div>
                      <span className="font-medium text-[#0B2545]">{m.name || m.email.split('@')[0]}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={m.role || 'Editor'}
                      onChange={(e) => handleRoleChange(m.email, e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-[#0B2545] focus:outline-none focus:border-sky-500"
                      aria-label={`Role for ${m.email}`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        m.status === 'Pending'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {m.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remove member"
                      aria-label={`Remove ${m.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B2545]">Invite Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@thapar.edu"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
                >
                  <option value="Admin">Admin — Full project control</option>
                  <option value="Editor">Editor — Upload, edit & share</option>
                  <option value="Viewer">Viewer — View & download</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

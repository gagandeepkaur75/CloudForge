import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Search, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Mail, 
  Calendar, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function TeamMembers({ currentUser }) {
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
    const p = projects.find(x => x.projectId === pid);
    if (p) setMembers(p.members || []);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setAlertMsg(null);
    try {
      await api.inviteMember(selectedProjectId, inviteEmail, inviteRole);
      setAlertMsg({ type: 'success', text: `Invitation sent to ${inviteEmail} as ${inviteRole}!` });
      setInviteEmail('');
      setShowInviteModal(false);

      // Refresh members
      const db = getMockDb();
      const p = db.projects.find(x => x.projectId === selectedProjectId);
      if (p) setMembers(p.members || []);
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Failed to invite collaborator.' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (email, newRole) => {
    await api.updateMemberRole(selectedProjectId, email, newRole);
    setMembers(members.map(m => m.email === email ? { ...m, role: newRole } : m));
    setAlertMsg({ type: 'success', text: `Updated ${email}'s role to ${newRole}.` });
  };

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`Remove ${email} from this project workspace?`)) return;
    await api.removeMember(selectedProjectId, email);
    setMembers(members.filter(m => m.email !== email));
    setAlertMsg({ type: 'success', text: `Removed ${email} from the workspace.` });
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Editor':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Viewer':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Team Members and Permissions</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {filteredMembers.length} Members
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student roles, role-based access control (RBAC), and team project invitations.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {alertMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2 ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Role Definitions Explanation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h4 className="text-xs font-bold text-slate-900">Admin Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Full project control, member invitations, file deletions, permission governance, and final submission snapshot generation.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <h4 className="text-xs font-bold text-slate-900">Editor Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Can upload code & datasets, edit project files, restore historical S3 versions, and create temporary sharing links.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <h4 className="text-xs font-bold text-slate-900">Viewer Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Read-only access to inspect documents, preview code, view activity streams, and download permitted assets.
          </p>
        </div>
      </div>

      {/* Workspace Selector and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Active Workspace:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectSelect(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
          >
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">Member Name</th>
              <th scope="col" className="px-5 py-3.5">Email Address</th>
              <th scope="col" className="px-5 py-3.5">Assigned Role</th>
              <th scope="col" className="px-5 py-3.5">Joined Date</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((m) => (
              <tr key={m.email} className="hover:bg-sky-50/20 transition">
                {/* Member Name with Avatar */}
                <td className="px-5 py-4 font-medium text-slate-900 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-2xs">
                    {m.avatar || m.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Cognito Identity</span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-600">
                  {m.email}
                </td>

                {/* Role with Dropdown Modifier */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.email, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${getRoleBadge(m.role)}`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </td>

                {/* Joined Date */}
                <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                  {m.joinedDate || '2026-11-01'}
                </td>

                {/* Status */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>{m.status || 'Active'}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleRemoveMember(m.email)}
                    title="Remove Member from Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Invite Student Collaborator</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Student University Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@thapar.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assign Permission Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Admin', 'Editor', 'Viewer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition ${
                        inviteRole === r
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
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

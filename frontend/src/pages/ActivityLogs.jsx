import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  UploadCloud, 
  RotateCcw, 
  Share2, 
  Archive, 
  UserPlus, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  Download, 
  Shield, 
  Clock, 
  User 
} from 'lucide-react';
import { api, getMockDb } from '../services/api';

export default function ActivityLogs({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const db = getMockDb();
      setActivities(db.activities || []);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'FILE_UPLOADED':
        return { label: 'File Uploaded', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: UploadCloud };
      case 'FILE_DELETED':
        return { label: 'File Deleted', bg: 'bg-red-50 text-red-700 border-red-200', icon: Trash2 };
      case 'FILE_UPDATED':
        return { label: 'File Updated', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Edit3 };
      case 'FILE_DOWNLOADED':
        return { label: 'File Downloaded', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Download };
      case 'VERSION_RESTORED':
        return { label: 'Version Restored', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: RotateCcw };
      case 'FILE_SHARED':
        return { label: 'File Shared', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Share2 };
      case 'SNAPSHOT_CREATED':
        return { label: 'Snapshot Created', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Archive };
      case 'MEMBER_INVITED':
        return { label: 'Member Invited', bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: UserPlus };
      case 'PERMISSION_CHANGED':
        return { label: 'Permission Changed', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield };
      case 'PROJECT_CREATED':
        return { label: 'Project Created', bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: FolderPlus };
      default:
        return { label: action || 'Activity', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Activity };
    }
  };

  const allUsers = Array.from(new Set(activities.map(a => a.actor).filter(Boolean)));

  const filteredLogs = activities.filter((act) => {
    const matchesSearch = act.details?.toLowerCase().includes(search.toLowerCase()) || 
                          act.projectName?.toLowerCase().includes(search.toLowerCase()) ||
                          act.fileName?.toLowerCase().includes(search.toLowerCase());
    const matchesUser = userFilter === 'All' ? true : act.actor === userFilter;
    const matchesType = typeFilter === 'All' ? true : act.action === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const actDate = new Date(act.timestamp);
      const now = new Date();
      if (dateFilter === 'Today') {
        matchesDate = now.getTime() - actDate.getTime() < 86400000;
      } else if (dateFilter === 'Last 7 Days') {
        matchesDate = now.getTime() - actDate.getTime() < 86400000 * 7;
      } else if (dateFilter === 'Last 30 Days') {
        matchesDate = now.getTime() - actDate.getTime() < 86400000 * 30;
      }
    }

    return matchesSearch && matchesUser && matchesType && matchesDate;
  });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Activity Logs</span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {filteredLogs.length} Events
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time audit trail powered by Amazon DynamoDB, EventBridge, and SQS event notifications.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Search Activity</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, file..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Filter by User</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Users</option>
            {allUsers.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Activity Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Activities</option>
            <option value="PROJECT_CREATED">Project Created</option>
            <option value="FILE_UPLOADED">File Uploaded</option>
            <option value="FILE_DOWNLOADED">File Downloaded</option>
            <option value="FILE_DELETED">File Deleted</option>
            <option value="FILE_UPDATED">File Updated</option>
            <option value="MEMBER_INVITED">Member Invited</option>
            <option value="PERMISSION_CHANGED">Permission Changed</option>
            <option value="FILE_SHARED">File Shared</option>
            <option value="VERSION_RESTORED">Version Restored</option>
            <option value="SNAPSHOT_CREATED">Snapshot Created</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Date Range</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Time</option>
            <option value="Today">Today (24h)</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Activities Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">User & Actor</th>
              <th scope="col" className="px-5 py-3.5">Activity Action</th>
              <th scope="col" className="px-5 py-3.5">Description</th>
              <th scope="col" className="px-5 py-3.5">Related Project</th>
              <th scope="col" className="px-5 py-3.5">Related File</th>
              <th scope="col" className="px-5 py-3.5 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                  No activity logs matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((act, idx) => {
                const badge = getActionBadge(act.action);
                const Icon = badge.icon;
                const avatar = act.actor?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

                return (
                  <tr key={act.id || idx} className="hover:bg-sky-50/20 transition">
                    {/* User */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                          {avatar}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{act.actor}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{act.actorEmail || 'student'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-sm font-medium">
                      {act.details}
                    </td>

                    {/* Project */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {act.projectName || '-'}
                    </td>

                    {/* Related File */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                      {act.fileName || '-'}
                    </td>

                    {/* Date Time */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs text-slate-400 font-mono">
                      {formatDate(act.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

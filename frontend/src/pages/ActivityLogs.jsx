import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getMockDb } from '../services/api';

export default function ActivityLogs({ currentUser, globalSearch = '' }) {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const db = getMockDb();
      setActivities(db.activities || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const allUsers = Array.from(new Set(activities.map((a) => a.actor).filter(Boolean)));

  const effectiveSearch = (search || globalSearch || '').toLowerCase();
  const filteredLogs = activities.filter((act) => {
    const matchesSearch =
      !effectiveSearch ||
      act.details?.toLowerCase().includes(effectiveSearch) ||
      act.actor?.toLowerCase().includes(effectiveSearch) ||
      act.projectName?.toLowerCase().includes(effectiveSearch) ||
      act.fileName?.toLowerCase().includes(effectiveSearch);
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
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const resetFilters = () => {
    setSearch('');
    setUserFilter('All');
    setTypeFilter('All');
    setDateFilter('All');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">Activity Logs</h1>
        <p className="text-sm text-slate-500 mt-1">See recent project activities.</p>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={resetFilters}
          className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
            userFilter === 'All' && typeFilter === 'All' && dateFilter === 'All' && !search
              ? 'bg-[#0B2545] text-white border-[#0B2545]'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Activities
        </button>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-[#0B2545] font-medium focus:outline-none focus:border-sky-500"
          aria-label="Filter by user"
        >
          <option value="All">All Users</option>
          {allUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-[#0B2545] font-medium focus:outline-none focus:border-sky-500"
          aria-label="Filter by activity type"
        >
          <option value="All">All Types</option>
          <option value="PROJECT_CREATED">Project Created</option>
          <option value="FILE_UPLOADED">File Uploaded</option>
          <option value="FILE_UPDATED">File Updated</option>
          <option value="FILE_DOWNLOADED">File Downloaded</option>
          <option value="FILE_DELETED">File Deleted</option>
          <option value="FILE_SHARED">File Shared</option>
          <option value="VERSION_RESTORED">Version Restored</option>
          <option value="MEMBER_INVITED">Member Invited</option>
          <option value="PERMISSION_CHANGED">Permission Changed</option>
          <option value="SNAPSHOT_CREATED">Snapshot Created</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-[#0B2545] font-medium focus:outline-none focus:border-sky-500"
          aria-label="Filter by date"
        >
          <option value="All">All Dates</option>
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
      </div>

      {/* Clean Vertical List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading activities...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No activities found.</div>
        ) : (
          filteredLogs.map((act, idx) => (
            <div key={act.id || idx} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {getInitials(act.actor)}
                </div>
                <p className="text-sm text-[#0B2545] truncate">
                  <span className="font-semibold">{act.actor || 'User'}</span>{' '}
                  <span className="text-slate-600">{act.details}</span>
                </p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{formatDate(act.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

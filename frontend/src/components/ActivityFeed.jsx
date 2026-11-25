import React from 'react';
import { 
  Activity, 
  UploadCloud, 
  RotateCcw, 
  Share2, 
  Archive, 
  UserPlus, 
  FolderPlus, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

export default function ActivityFeed({ 
  activities = [], 
  onRefresh, 
  isRefreshing = false 
}) {
  const getActionBadge = (action) => {
    switch (action) {
      case 'FILE_UPLOADED':
        return {
          icon: <UploadCloud className="w-3.5 h-3.5 text-blue-600" />,
          label: 'File Uploaded',
          bg: 'bg-blue-50 border-blue-200 text-blue-700'
        };
      case 'VERSION_RECOVERED':
        return {
          icon: <RotateCcw className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Version Recovered',
          bg: 'bg-amber-50 border-amber-200 text-amber-700'
        };
      case 'LINK_SHARED':
        return {
          icon: <Share2 className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Link Shared',
          bg: 'bg-purple-50 border-purple-200 text-purple-700'
        };
      case 'SNAPSHOT_CREATED':
        return {
          icon: <Archive className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Snapshot Created',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700'
        };
      case 'MEMBER_ADDED':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-teal-600" />,
          label: 'Member Added',
          bg: 'bg-teal-50 border-teal-200 text-teal-700'
        };
      case 'PROJECT_CREATED':
        return {
          icon: <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Project Created',
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700'
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
          label: action || 'Activity',
          bg: 'bg-slate-100 border-slate-200 text-slate-700'
        };
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now - past;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Real-Time Event Stream</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Refresh activity logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[500px]">
        {activities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No activity events recorded yet.
          </div>
        ) : (
          <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act, index) => {
              const badge = getActionBadge(act.action);
              return (
                <div key={act.timestamp || index} className="relative group">
                  {/* Bullet */}
                  <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-white"></div>

                  <div className="bg-slate-50/80 hover:bg-blue-50/40 p-3.5 rounded-2xl border border-slate-200 hover:border-blue-200 transition duration-150">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1 shrink-0 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRelativeTime(act.timestamp)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                      {act.details}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="truncate max-w-[180px]">By: {act.actor}</span>
                      <span>
                        {act.timestamp ? act.timestamp.substring(11, 19) + ' UTC' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between font-mono font-medium">
        <span>S3 ➔ EventBridge ➔ SQS ➔ Lambda</span>
        <span className="text-emerald-700 flex items-center space-x-1 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LIVE PIPELINE</span>
        </span>
      </div>
    </div>
  );
}

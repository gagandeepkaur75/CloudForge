import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users2,
  Share2,
  History,
  Activity,
  Archive,
  Settings,
  Cloud,
  HardDrive,
  X
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'My Projects', icon: FolderKanban },
  { id: 'team', label: 'Team Members', icon: Users2 },
  { id: 'sharing', label: 'File Sharing', icon: Share2 },
  { id: 'versions', label: 'Version History', icon: History },
  { id: 'activity', label: 'Activity Logs', icon: Activity },
  { id: 'submission', label: 'Submission & Backup', icon: Archive },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  totalStorageBytes = 0
}) {
  const maxStorageBytes = 100 * 1024 * 1024; // 100 MB
  const storagePercentage = Math.min(100, Math.round((totalStorageBytes / maxStorageBytes) * 100));

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0B2545] text-slate-200 flex flex-col border-r border-blue-950 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center space-x-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Cloud<span className="text-sky-400">Forge</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-300 hover:text-white lg:hidden rounded-lg hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Compact S3 Storage Indicator */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>S3 Storage</span>
            </span>
            <span className="text-sky-300 font-medium">{storagePercentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {formatBytes(totalStorageBytes)} of 100 MB
          </p>
        </div>
      </aside>
    </>
  );
}

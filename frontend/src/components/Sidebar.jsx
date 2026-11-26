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
  totalStorageBytes = 19630000 
}) {
  const maxStorageBytes = 100 * 1024 * 1024; // 100 MB quota for student teams
  const storagePercentage = Math.min(100, Math.round((totalStorageBytes / maxStorageBytes) * 100));

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* Persistent Left Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1426] text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo / Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">Cloud<span className="text-sky-400">Forge</span></span>
              <span className="block text-[10px] text-sky-400/80 font-mono tracking-wider font-semibold">SAAS WORKSPACE</span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-bold border-l-4 border-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Storage Widget Card */}
        <div className="p-4 m-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>S3 Storage</span>
            </span>
            <span className="text-[11px] text-sky-400 font-mono font-bold">{storagePercentage}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div 
              className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>{formatBytes(totalStorageBytes)}</span>
            <span>of 100 MB</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 text-center border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
          UCS531 • Cloud Computing
        </div>
      </aside>
    </>
  );
}

import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  LogOut, 
  Settings, 
  User, 
  ChevronDown, 
  Home,
} from 'lucide-react';

export default function TopNavbar({ 
  currentUser, 
  onToggleMobileSidebar, 
  onLogout, 
  onNavigateTab,
  onGoHome,
  searchQuery,
  onSearchChange
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [];
  const unreadCount = 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search projects, files, members..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <Bell className="w-4 h-4" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} new)</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.length ? notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs flex items-start space-x-2.5 ${n.unread ? 'bg-sky-50/40' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium">{n.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{n.time}</span>
                    </div>
                  </div>
                )) : <p className="p-4 text-xs text-slate-500">No notifications available.</p>}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {currentUser?.avatar || currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">{currentUser?.name || 'Student'}</p>
              <p className="text-[10px] font-semibold text-slate-500">{currentUser?.role || 'Member'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2 divide-y divide-slate-100">
              <div className="px-4 py-2.5">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{currentUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  {currentUser?.role || 'Member'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigateTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                {onGoHome && (
                  <button
                    onClick={() => {
                      onGoHome();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>Public Landing Page</span>
                  </button>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

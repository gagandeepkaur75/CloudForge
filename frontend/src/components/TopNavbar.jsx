import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Home,
  Check
} from 'lucide-react';
import { authService, DEMO_USERS } from '../services/auth';

export default function TopNavbar({
  currentUser,
  onToggleMobileSidebar,
  onLogout,
  onUserChange,
  onNavigateTab,
  onGoHome,
  searchQuery,
  onSearchChange
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "serverless_pipeline.py v4 uploaded", time: '10m ago', unread: true },
    { id: 2, text: "Puneet Singh restored system_architecture_spec.pdf", time: '1h ago', unread: true },
    { id: 3, text: "Aditya Gupta joined as Editor", time: '1d ago', unread: false }
  ]);

  const isMock = authService.isMockMode();

  const handleRoleSwitch = (user) => {
    localStorage.setItem('cloudforge_auth_user', JSON.stringify(user));
    if (onUserChange) onUserChange(user);
    setShowProfileMenu(false);
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile menu & Search bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-sm text-[#0B2545] placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right: Cloud Environment, Notifications, User Profile */}
      <div className="flex items-center space-x-3">
        {/* Cloud Environment Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-100 text-xs font-medium text-[#0B2545]">
          <span className={`w-2 h-2 rounded-full ${isMock ? 'bg-sky-500' : 'bg-emerald-500'}`} />
          <span>{isMock ? 'Local Mode' : 'AWS Cloud'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:text-[#0B2545] hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0B2545]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-sky-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-2.5 text-xs ${n.unread ? 'bg-sky-50/40' : ''}`}>
                    <p className="text-[#0B2545]">{n.text}</p>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0B2545] flex items-center justify-center font-semibold text-xs text-white">
              {currentUser?.avatar || currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium text-[#0B2545]">
              {currentUser?.name || 'User'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1.5 divide-y divide-slate-100">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[#0B2545]">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
              </div>

              <div className="py-1">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleRoleSwitch(u)}
                    className={`w-full px-4 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentUser?.email === u.email ? 'text-sky-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>{u.name}</span>
                    {currentUser?.email === u.email && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </button>
                ))}
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </button>

                {onGoHome && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoHome();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>Home</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full px-4 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

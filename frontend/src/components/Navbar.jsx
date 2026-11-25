import React from 'react';
import { 
  Cloud, 
  Shield, 
  User, 
  LogOut, 
  Users, 
  Database,
  Radio,
  CheckCircle2,
  Home,
  ChevronDown
} from 'lucide-react';
import { authService, DEMO_USERS } from '../services/auth';

export default function Navbar({ currentUser, onUserChange, onLogout, onGoHome }) {
  const isMock = authService.isMockMode();

  const handleRoleSwitch = (user) => {
    localStorage.setItem('cloudforge_auth_user', JSON.stringify(user));
    if (onUserChange) onUserChange(user);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Home */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={onGoHome}
            className="flex items-center space-x-3 cursor-pointer group"
            title="Return to CloudForge Homepage"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900">Cloud<span className="text-blue-600">Forge</span></span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  AWS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">UCS531 Collaborative Workspace</p>
            </div>
          </div>

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
        </div>

        {/* Right side controls & user profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Cloud Mode Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium">
            <Radio className={`w-3 h-3 ${isMock ? 'text-amber-500 animate-pulse' : 'text-emerald-500 animate-pulse'}`} />
            <span className="text-slate-700 font-medium">{isMock ? 'Local Mock Active' : 'AWS Cloud Connected'}</span>
          </div>

          {/* Quick Member Switcher (for UCS531 Demo testing) */}
          <div className="relative group">
            <button 
              title="Switch demo persona for testing RBAC"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Switch Persona</span>
              <ChevronDown className="w-3 h-3 text-blue-600" />
            </button>
            <div className="absolute right-0 mt-2 w-64 py-2 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Team Member (UCS531)
              </div>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleRoleSwitch(u)}
                  className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-blue-50/70 transition ${
                    currentUser?.email === u.email ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.role} • {u.rollNo}</p>
                  </div>
                  {currentUser?.email === u.email && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current User Badge */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {currentUser.avatar || currentUser.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser.role === 'ProjectLead' ? 'bg-blue-600' : 'bg-indigo-600'}`}></span>
                  <span className="text-[10px] font-semibold text-slate-500">{currentUser.role}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

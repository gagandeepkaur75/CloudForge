import React from 'react';
import { Cloud, LogOut, Home } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, onGoHome }) {
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
          {/* Current User Badge */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {currentUser.avatar || currentUser.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
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

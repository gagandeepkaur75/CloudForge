import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { authService } from '../services/auth';
import { getMockDb } from '../services/api';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

export default function SettingsPage({ currentUser, onUserChange, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Account / Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [snapshotAlerts, setSnapshotAlerts] = useState(true);

  // Storage
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    try {
      const db = getMockDb();
      const total = (db.projects || []).reduce((acc, p) => acc + (p.totalStorageBytes || 0), 0);
      setUsedBytes(total);
    } catch {
      setUsedBytes(0);
    }
  }, []);

  const maxBytes = 100 * 1024 * 1024;
  const pct = Math.min(100, Math.round((usedBytes / maxBytes) * 100));

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = authService.updateUserProfile({ name, email });
    if (onUserChange) onUserChange(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPassword || newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    const res = authService.changePassword(oldPassword, newPassword);
    setPwdMsg({ type: 'success', text: res.message });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, account, storage, and security.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-sky-500 text-[#0B2545]'
                  : 'border-transparent text-slate-500 hover:text-[#0B2545]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-[#0B2545] text-white font-bold text-lg flex items-center justify-center">
                {currentUser?.avatar || name.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0B2545]">{name}</p>
                <p className="text-xs text-slate-500">{currentUser?.role || 'Admin'}</p>
              </div>
            </div>

            {profileSaved && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-[#0B2545] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Profile updated.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium"
            >
              Edit Profile
            </button>
          </form>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6 max-w-md">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0B2545]">Change Password</h3>
              {pwdMsg && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    pwdMsg.type === 'success'
                      ? 'bg-sky-50 text-[#0B2545] border border-sky-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {pwdMsg.text}
                </div>
              )}
              <input
                type="password"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-medium"
              >
                Update Password
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-semibold text-[#0B2545]">Notifications</h3>
              <label className="flex items-center justify-between text-xs text-slate-700">
                <span>Email activity notifications</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-700">
                <span>Snapshot creation alerts</span>
                <input
                  type="checkbox"
                  checked={snapshotAlerts}
                  onChange={(e) => setSnapshotAlerts(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#0B2545]">Storage Used</span>
              <span className="font-semibold text-sky-600">{formatBytes(usedBytes)} / 100 MB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {pct}% used • {formatBytes(Math.max(0, maxBytes - usedBytes))} available on Amazon S3.
            </p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 max-w-md text-xs text-slate-600">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-[#0B2545]">Authentication Provider</span>
              <span>{authService.isMockMode() ? 'Local Session Engine' : 'Amazon Cognito'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-[#0B2545]">Role-Based Access</span>
              <span>{currentUser?.role || 'Admin'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-[#0B2545]">S3 Pre-Signed URLs</span>
              <span className="text-sky-600 font-medium">Enabled</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

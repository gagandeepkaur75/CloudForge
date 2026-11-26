import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  HardDrive, 
  ShieldCheck, 
  Bell, 
  Save, 
  CheckCircle2, 
  LogOut,
  Smartphone,
  Laptop
} from 'lucide-react';
import { authService } from '../services/auth';

export default function SettingsPage({ currentUser, onUserChange, onLogout }) {
  // Profile settings state
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sqsAlerts, setSqsAlerts] = useState(true);
  const [snapshotAlerts, setSnapshotAlerts] = useState(true);

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
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    const res = authService.changePassword(oldPassword, newPassword);
    setPwdMsg({ type: 'success', text: res.message });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your student profile, Amazon Cognito security credentials, S3 storage allocation, and notifications.
        </p>
      </div>

      {/* 1. Profile Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Profile Settings</h3>
            <p className="text-xs text-slate-500">Your student identity displayed to project team members.</p>
          </div>
        </div>

        {profileSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-md shadow-sky-500/20">
              {currentUser?.avatar || name.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{name}</p>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Account & Security Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Account Credentials & Cognito Auth</h3>
            <p className="text-xs text-slate-500">Update your Amazon Cognito authentication password.</p>
          </div>
        </div>

        {pwdMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            pwdMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">New Password (8+ chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* 3. Storage Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Amazon S3 Storage Allocation</h3>
            <p className="text-xs text-slate-500">Cloud object storage breakdown and version quota.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Quota</span>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">100.0 MB</p>
            <span className="text-[10px] text-slate-500">Free University Tier</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Used Storage</span>
            <p className="text-xl font-black text-sky-600 mt-1 font-mono">19.6 MB</p>
            <span className="text-[10px] text-slate-500">Versioned Assets</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Available Storage</span>
            <p className="text-xl font-black text-emerald-600 mt-1 font-mono">80.4 MB</p>
            <span className="text-[10px] text-slate-500">Remaining Buffer</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Overall S3 Allocation</span>
            <span className="font-mono text-sky-600">19.6%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-400 to-blue-600 h-3 rounded-full" style={{ width: '19.6%' }}></div>
          </div>
        </div>
      </div>

      {/* 4. Notification Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
            <p className="text-xs text-slate-500">Configure real-time event pipeline dispatch triggers.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-800">Email Notifications on File Overwrite</p>
              <p className="text-[11px] text-slate-500">Receive alerts when a collaborator overwrites or restores an S3 version.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-800">Amazon SQS Background Processing Alerts</p>
              <p className="text-[11px] text-slate-500">Notify upon successful EventBridge queue routing and metadata indexing.</p>
            </div>
            <input
              type="checkbox"
              checked={sqsAlerts}
              onChange={(e) => setSqsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-800">Academic Submission Snapshots Confirmation</p>
              <p className="text-[11px] text-slate-500">Notify all team members when the Project Lead seals the final submission snapshot.</p>
            </div>
            <input
              type="checkbox"
              checked={snapshotAlerts}
              onChange={(e) => setSnapshotAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600"
            />
          </label>
        </div>
      </div>

      {/* 5. Security & Active Sessions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Active Sessions</h3>
            <p className="text-xs text-slate-500">Connected authentication tokens and authenticated devices.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Device / Browser</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Auth Identity</th>
                <th className="px-4 py-3">Session State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="px-4 py-3 flex items-center space-x-2">
                  <Laptop className="w-4 h-4 text-slate-500" />
                  <span>Chrome on Windows (Current Session)</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">192.168.1.73 (Local)</td>
                <td className="px-4 py-3 font-mono text-blue-600">Cognito User Pool ID Token</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of All Sessions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  HardDrive, 
  ShieldCheck, 
  Bell, 
  Save, 
  CheckCircle2, 
  LogOut,
} from 'lucide-react';
import { authService } from '../services/auth';

export default function SettingsPage({ currentUser, onUserChange, onLogout }) {
  // Profile settings state
  const [name, setName] = useState(currentUser?.name || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sqsAlerts, setSqsAlerts] = useState(true);
  const [snapshotAlerts, setSnapshotAlerts] = useState(true);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      const updated = await authService.updateUserProfile({ name });
      if (onUserChange) onUserChange(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      setProfileError(error.message || 'Profile update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
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
    setPasswordLoading(true);
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      setPwdMsg({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPwdMsg({ type: 'error', text: error.message || 'Password update failed.' });
    } finally {
      setPasswordLoading(false);
    }
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
        {profileError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold" role="alert">
            {profileError}
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
                {currentUser?.role || 'Member'}
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
                value={currentUser?.email || ''}
                disabled
                title="Email changes require an additional Cognito verification flow."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
              <p className="mt-1 text-[10px] text-slate-500">Email changes require a separate Cognito verification flow and are currently disabled.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
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
              disabled={passwordLoading}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
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
            <h3 className="text-base font-bold text-slate-900">Amazon S3 Storage</h3>
            <p className="text-xs text-slate-500">Storage usage and quotas are not currently reported by the API.</p>
          </div>
        </div>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
          The previous quota figures were sample values. No storage quota or usage is shown until a real metrics API is available.
        </p>
      </div>

      {/* 4. Notification Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
            <p className="text-xs text-slate-500">These controls are not connected to a notification service and changes are not saved.</p>
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
            <p className="text-xs text-slate-500">Session details are not collected by this application.</p>
          </div>
        </div>

        <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
          The current browser session uses Cognito tokens. This page does not display device history or IP addresses.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

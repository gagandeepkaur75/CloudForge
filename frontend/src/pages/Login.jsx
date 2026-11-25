import React, { useState } from 'react';
import {
  Cloud,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { authService, DEMO_USERS } from '../services/auth';

export default function Login({ onLoginSuccess, onGoHome }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        setLoading(false);
        return;
      }
    }

    try {
      let user;
      if (isSignUp) {
        user = await authService.signUp(email, password, name, 'Editor');
        setSuccessMsg('Account created. Signing in...');
      } else {
        user = await authService.signIn(email, password);
      }
      setTimeout(() => {
        onLoginSuccess(user);
      }, 300);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setLoading(true);
    setError('');
    try {
      const user = await authService.signIn(demoUser.email, 'Password123!');
      onLoginSuccess(user);
    } catch {
      setError('Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setSuccessMsg(`Reset link sent to ${forgotEmail}.`);
    setForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 relative">
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="absolute top-6 left-6 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B2545] hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Logo & Welcome */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#0B2545]">
            <Cloud className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-xl font-bold text-[#0B2545]">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-xs text-slate-500">
            {isSignUp ? 'Sign up to start collaborating on CloudForge' : 'Sign in to your CloudForge workspace'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-[#0B2545] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gagandeep Kaur"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@thapar.edu"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-xs text-sky-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {!isSignUp && (
            <label className="flex items-center space-x-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Remember me</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMsg('');
            }}
            className="text-xs font-medium text-sky-600 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Create a new account'}
          </button>
        </div>

        {/* Optional Demo Login */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center mb-2">Optional Demo Accounts</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => handleQuickLogin(u)}
                disabled={loading}
                className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-sky-50 border border-slate-200 text-[11px] font-medium text-[#0B2545] transition"
              >
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0B2545]">Reset Password</h3>
              <button
                type="button"
                onClick={() => setForgotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0B2545] focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#0B2545] text-white text-xs font-medium"
              >
                Send Reset Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Cloud, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { authService, DEMO_USERS } from '../services/auth';

export default function Login({ onLoginSuccess, onGoHome }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Editor');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [mockMode, setMockMode] = useState(authService.isMockMode());

  const handleToggleMock = () => {
    const nextVal = !mockMode;
    setMockMode(nextVal);
    authService.setMockMode(nextVal);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Validation
    if (!email || !password) {
      setError('Please provide all required fields.');
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
        setError('Passwords do not match. Please re-enter.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
    }

    try {
      let user;
      if (isSignUp) {
        user = await authService.signUp(email, password, name, role);
        setSuccessMsg('Account created successfully! Signing in...');
      } else {
        user = await authService.signIn(email, password);
      }
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
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
    } catch (err) {
      setError('Quick sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setSuccessMsg(`Password reset instructions sent to ${forgotEmail} via Amazon Cognito.`);
    setForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-white to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-300/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back to Home Button */}
      {onGoHome && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onGoHome}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-xs font-semibold border border-slate-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
        </div>
      )}

      {/* Logo & Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B2545] to-sky-500 shadow-xl shadow-sky-500/25 mb-4">
          <Cloud className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-3xl font-black text-[#0B2545] tracking-tight">Cloud<span className="text-sky-500">Forge</span></h2>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          {isSignUp ? 'Create your collaborative student workspace account' : 'Welcome back! Sign in to your workspace'}
        </p>
        <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-700 font-semibold font-mono">
          <span>UCS531 • Cloud Computing Capstone</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
          
          {/* Quick Demo Switch Section */}
          <div className="mb-6 p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Quick Team Demo Login</span>
              </span>
              <button 
                onClick={handleToggleMock} 
                className="text-[11px] text-slate-500 flex items-center space-x-1 hover:text-sky-700 font-medium"
                title="Toggle between Live AWS API Gateway and Local Mock Mode"
              >
                <span>{mockMode ? 'Mock Engine' : 'Live AWS'}</span>
                {mockMode ? (
                  <ToggleRight className="w-4 h-4 text-sky-500" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            </div>
            
            <div className="space-y-1.5">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-xl bg-white hover:bg-sky-50 hover:border-sky-300 border border-slate-200 text-left flex items-center justify-between text-xs transition group shadow-2xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-500 group-hover:text-white font-extrabold flex items-center justify-center text-[10px] transition">
                      {u.avatar}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-sky-700 transition">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({u.role})</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-500 group-hover:translate-x-0.5 font-bold transition">Sign in →</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold">Or Email Credentials</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Gagandeep Kaur"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                University Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gkaur10_be24@thapar.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Password *
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                  Default Assigned Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Admin', 'Editor', 'Viewer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition ${
                        role === r
                          ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 font-medium">
                  Remember me on this browser
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-bold shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create CloudForge Account' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition"
            >
              {isSignUp ? 'Already registered? Sign in here' : "Need a student account? Create one"}
            </button>
          </div>
        </div>

        {/* Thapar University & UCS531 Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">Thapar Institute of Engineering and Technology</p>
          <p>Faculty Advisor: Dr. Anil Singh</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
            <p className="text-xs text-slate-500">
              Enter your student email address and an Amazon Cognito verification code will be dispatched.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="student@thapar.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

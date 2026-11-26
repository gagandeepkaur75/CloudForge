import React, { useState } from 'react';
import { 
  Cloud, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { authService } from '../services/auth';

export default function Login({ onLoginSuccess, onGoHome }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupConfirmationRequired, setSignupConfirmationRequired] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState('request');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Validation
    if (!email || (!signupConfirmationRequired && !password)) {
      setError('Please provide all required fields.');
      setLoading(false);
      return;
    }

    if (signupConfirmationRequired) {
      if (!confirmationCode.trim()) {
        setError('Enter the confirmation code sent to your email.');
        setLoading(false);
        return;
      }
    } else if (isSignUp) {
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
      if (signupConfirmationRequired) {
        await authService.confirmSignUp(email, confirmationCode);
        setSignupConfirmationRequired(false);
        setConfirmationCode('');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg('Email confirmed. Sign in with your email and password.');
      } else if (isSignUp) {
        await authService.signUp(email, password, name);
        setSignupConfirmationRequired(true);
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg('Account created. Enter the confirmation code sent to your email.');
      } else {
        const user = await authService.signIn(email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setForgotMessage('');
    try {
      if (forgotStep === 'request') {
        await authService.forgotPassword(forgotEmail);
        setForgotStep('confirm');
        setForgotMessage('A password reset code was sent if this account is eligible.');
      } else {
        await authService.confirmForgotPassword(forgotEmail, forgotCode, forgotNewPassword);
        setForgotModal(false);
        setForgotStep('request');
        setForgotCode('');
        setForgotNewPassword('');
        setSuccessMsg('Password reset completed. Sign in with your new password.');
      }
    } catch (err) {
      setForgotMessage(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-white to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 shadow-xl shadow-sky-500/25 mb-4">
          <Cloud className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cloud<span className="text-sky-500">Forge</span></h2>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          {signupConfirmationRequired ? 'Confirm your email address' : isSignUp ? 'Create your collaborative student workspace account' : 'Welcome back! Sign in to your workspace'}
        </p>
        <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-700 font-semibold font-mono">
          <span>UCS531 • Cloud Computing Capstone</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
          
          <p className="mb-5 text-center text-xs text-slate-500">Sign in securely with your CloudForge account.</p>

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
            {isSignUp && !signupConfirmationRequired && (
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
                  disabled={signupConfirmationRequired}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            {signupConfirmationRequired ? (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                  Email Confirmation Code *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            ) : <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Password *
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep('request');
                      setForgotMessage('');
                      setForgotModal(true);
                    }}
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
            </div>}

            {isSignUp && !signupConfirmationRequired && (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
            >
              <span>{loading ? 'Processing...' : signupConfirmationRequired ? 'Confirm Email' : isSignUp ? 'Create CloudForge Account' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                if (signupConfirmationRequired) return;
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition"
            >
              {signupConfirmationRequired ? 'Check your email for the confirmation code' : isSignUp ? 'Already registered? Sign in here' : "Need a student account? Create one"}
            </button>
          </div>
        </div>

        {/* Thapar University & UCS531 Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">Thapar Institute of Engineering and Technology</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
            <p className="text-xs text-slate-500">
              {forgotStep === 'request' ? 'Enter your email address to request a Cognito password reset code.' : 'Enter the code sent to your email and choose a new password.'}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                disabled={forgotStep === 'confirm'}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="student@thapar.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
              {forgotStep === 'confirm' && (
                <>
                  <input
                    type="text"
                    required
                    autoComplete="one-time-code"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="Verification code"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </>
              )}
              {forgotMessage && <p className="text-xs text-slate-600" role="status">{forgotMessage}</p>}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModal(false);
                    setForgotStep('request');
                    setForgotMessage('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {loading ? 'Processing...' : forgotStep === 'request' ? 'Send Reset Code' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

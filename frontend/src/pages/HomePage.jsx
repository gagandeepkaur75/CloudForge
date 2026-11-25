import React from 'react';
import {
  Cloud,
  ArrowRight,
  HardDrive,
  Users,
  History,
  Share2
} from 'lucide-react';
import { DEMO_USERS } from '../services/auth';

const FEATURES = [
  {
    title: 'Cloud File Storage',
    description: 'Upload and organize code, datasets, reports, and slides in structured project folders.',
    icon: HardDrive
  },
  {
    title: 'Team Collaboration',
    description: 'Invite team members and manage Admin, Editor, and Viewer permissions cleanly.',
    icon: Users
  },
  {
    title: 'Version History',
    description: 'Keep every file revision automatically and restore any previous version with one click.',
    icon: History
  },
  {
    title: 'Secure File Sharing',
    description: 'Generate time-limited sharing links with controlled view or download permissions.',
    icon: Share2
  }
];

const ARCHITECTURE_LAYERS = [
  { step: '1', name: 'Client & Users', detail: 'Team members with role-based access' },
  { step: '2', name: 'React Frontend', detail: 'Minimal SaaS dashboard on S3 / Amplify' },
  { step: '3', name: 'Cognito & API Gateway', detail: 'JWT auth + FastAPI AWS Lambda' },
  { step: '4', name: 'S3 & DynamoDB', detail: 'Versioned file storage & metadata tables' },
  { step: '5', name: 'EventBridge & SQS', detail: 'Async activity logging & CloudWatch' }
];

export default function HomePage({ onNavigateLogin, onQuickLogin }) {
  return (
    <div className="min-h-screen bg-white text-[#0B2545] flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center space-x-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B2545] flex items-center justify-center">
              <Cloud className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0B2545]">
              Cloud<span className="text-sky-500">Forge</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0B2545] transition">Features</a>
            <a href="#architecture" className="hover:text-[#0B2545] transition">Architecture</a>
            <a href="#team" className="hover:text-[#0B2545] transition">Team</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onNavigateLogin('login')}
              className="text-sm font-medium text-slate-600 hover:text-[#0B2545] px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigateLogin('login')}
              className="px-4 py-2 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-sky-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            AWS SERVERLESS WORKSPACE
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#0B2545] tracking-tight leading-tight">
            Your Projects. One Cloud Workspace.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Store, manage and collaborate on your project files securely in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateLogin('login')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-sm font-medium transition"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-[#0B2545] border border-slate-200 text-sm font-medium transition"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Section (4 Simple Cards) */}
      <section id="features" className="py-16 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#0B2545]">Core Features</h2>
            <p className="text-sm text-slate-500 mt-1">Everything student teams need to build and submit together.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition space-y-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B2545]">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-16 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#0B2545]">AWS Serverless Architecture</h2>
            <p className="text-sm text-slate-500 mt-1">Five decoupled layers for reliability and speed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {ARCHITECTURE_LAYERS.map((layer) => (
              <div
                key={layer.step}
                className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2"
              >
                <span className="inline-flex w-6 h-6 rounded-md bg-[#0B2545] text-sky-300 text-xs font-semibold items-center justify-center">
                  {layer.step}
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-[#0B2545]">{layer.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{layer.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Team Section */}
      <section id="team" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#0B2545]">Project Team</h2>
            <p className="text-sm text-slate-500 mt-1">
              UCS531 Cloud Computing • Thapar Institute of Engineering & Technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DEMO_USERS.map((member) => (
              <div
                key={member.rollNo}
                className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B2545] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {member.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#0B2545] truncate">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.role} • {member.rollNo}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onQuickLogin(member)}
                  className="w-full py-2 rounded-lg bg-sky-50 hover:bg-[#0B2545] text-[#0B2545] hover:text-white text-xs font-medium transition"
                >
                  Open as {member.name.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-[#0B2545]">CloudForge • UCS531 Cloud Computing</span>
          <span>Faculty Advisor: Dr. Anil Singh</span>
        </div>
      </footer>
    </div>
  );
}

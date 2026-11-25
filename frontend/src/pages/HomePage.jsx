import React from 'react';
import { 
  Cloud, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  HardDrive, 
  History, 
  Share2, 
  Archive, 
  Zap, 
  Lock, 
  Layers, 
  Database, 
  Users, 
  ExternalLink,
  Cpu,
  Sparkles,
  Terminal,
  Activity,
  FileText,
  Code2
} from 'lucide-react';
import { DEMO_USERS } from '../services/auth';

export default function HomePage({ onNavigateLogin, onQuickLogin }) {
  return (
    <div className="min-h-screen bg-white text-[#0B2545]">
      
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP ANNOUNCEMENT BAR & NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-[#0B2545] text-white text-xs py-2 px-4 text-center font-medium shadow-sm border-b border-sky-400/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <span className="bg-sky-400/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">UCS531</span>
          <span>Cloud Computing Academic Project • Thapar Institute of Engineering & Technology</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0B2545] to-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-[#0B2545]">Cloud<span className="text-sky-500">Forge</span></span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200 font-mono">
                  AWS SERVERLESS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Collaborative Student Engineering Workspace</p>
            </div>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#0B2545]/80">
            <a href="#features" className="hover:text-sky-600 transition">Features</a>
            <a href="#architecture" className="hover:text-sky-600 transition">5-Layer Architecture</a>
            <a href="#team" className="hover:text-sky-600 transition">Project Team</a>
            <a href="#demo" className="hover:text-sky-600 transition">Live Demo</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-4 py-2 text-sm font-semibold text-[#0B2545] hover:text-sky-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white font-semibold text-sm shadow-md shadow-sky-500/20 border border-sky-400/20 transition duration-150 flex items-center space-x-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. HERO SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-gradient-to-b from-sky-50/60 via-white to-white">
        {/* Soft background sky blue orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-300/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0B2545] text-xs font-semibold shadow-xs mb-6">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>UCS531 Cloud Computing Capstone Project</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B2545] tracking-tight leading-[1.15]">
              Collaborative Project Workspace for <span className="blue-gradient-text">Student Engineers</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              A 100% serverless, event-driven AWS cloud platform designed to eliminate lost file versions, enforce role-based access, stream real-time audit logs, and seal immutable academic submission snapshots.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigateLogin('login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white font-bold text-base shadow-xl shadow-sky-500/20 transition duration-150 flex items-center justify-center space-x-2"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-5 h-5 text-sky-300" />
              </button>
              <a
                href="#architecture"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0B2545] font-bold text-base border border-sky-200 shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Layers className="w-5 h-5 text-sky-500" />
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Key Value Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#0B2545]">
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-sky-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>Direct S3 Pre-Signed Uploads</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-sky-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>Multi-Version S3 Recovery</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-sky-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>EventBridge + SQS Pipeline</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-sky-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>One-Click Academic Snapshot</span>
              </div>
            </div>
          </div>

          {/* Interactive UI Hero Card Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-sky-200 shadow-2xl shadow-sky-500/10 p-4 sm:p-6 relative">
            <div className="bg-sky-50/40 border border-sky-100 rounded-2xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-[#0B2545] px-4 py-3 border-b border-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 font-mono text-xs text-sky-200">https://cloudforge.workspace/dashboard</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-sky-400/20 text-sky-300 border border-sky-400/30 font-mono">
                  ● AWS CLOUD CONNECTED
                </span>
              </div>

              {/* Preview Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Workspaces</span>
                  <p className="text-2xl font-black text-[#0B2545] mt-1 font-mono">2 Active</p>
                  <span className="text-[11px] text-sky-600 font-semibold">UCS531 Team 04</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total S3 Storage</span>
                  <p className="text-2xl font-black text-sky-600 mt-1 font-mono">15.4 MB</p>
                  <span className="text-[11px] text-slate-500">Versioned in S3</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Cognito Members</span>
                  <p className="text-2xl font-black text-[#0B2545] mt-1 font-mono">3 Students</p>
                  <span className="text-[11px] text-sky-600 font-semibold">RBAC Active</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Submission State</span>
                  <p className="text-2xl font-black text-[#0B2545] mt-1 font-mono">SEALED</p>
                  <span className="text-[11px] text-sky-600 font-semibold">Immutable /snapshots/</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CORE CAPABILITIES (WHITE & BLUE CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 bg-white border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight mt-3">
              Engineered to Resolve Every Team Vulnerability
            </h2>
            <p className="mt-3 text-base text-slate-600">
              From destructive overwriting to eleventh-hour submission chaos, CloudForge guarantees academic deliverables remain protected and verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                S3 Multi-Versioning & Recovery
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Every file upload retains its historical ancestor with unique Version IDs. Accidental overwrites are restored with a single click via atomic <code className="text-[#0B2545] bg-sky-50 px-1 py-0.5 rounded text-xs font-mono border border-sky-100">s3:CopyObject</code>.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                Zero-Bottleneck Pre-Signed PUT
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Files transfer directly from the browser to Amazon S3 using time-limited Pre-Signed URLs (valid 300s). Bypasses server memory limits and handles multi-gigabyte datasets with zero lag.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                EventBridge + SQS Pipeline
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                S3 events route through Amazon EventBridge to a durable SQS queue. Background Lambda workers index metadata and record audit logs into DynamoDB without slowing client responses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                Time-Limited Secure Sharing
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Generate temporary pre-signed download links with selectable expirations (15 mins, 1 hour, or 24 hours). Share reports with external evaluators without compromising project credentials.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                Academic Submission Snapshots
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Project Leads can seal the project at deadline. All current files are copied into an immutable S3 prefix <code className="text-[#0B2545] bg-sky-50 px-1 py-0.5 rounded text-xs font-mono border border-sky-100">/snapshots/</code> with an automated bundled <code className="text-[#0B2545] bg-sky-50 px-1 py-0.5 rounded text-xs font-mono border border-sky-100">.zip</code> archive.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-2xl bg-white border border-sky-100 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0B2545] flex items-center justify-center mb-5 group-hover:bg-[#0B2545] group-hover:text-sky-300 transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-sky-600 transition">
                Cognito RBAC & AWS Backup
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Granular authorization distinguishes <span className="font-semibold text-[#0B2545]">ProjectLead</span> from <span className="font-semibold text-sky-700">Contributor</span>. Daily AWS Backup vault plans protect S3 and DynamoDB against accidental deletion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. 5-LAYER CLOUD ARCHITECTURE DIAGRAM */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-20 bg-sky-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight mt-3">
              5-Layer Decoupled Cloud Architecture
            </h2>
            <p className="mt-3 text-base text-slate-600">
              How data and events seamlessly travel across the AWS serverless stack.
            </p>
          </div>

          {/* Interactive Layer Flow */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Layer 1 */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-sky-300 flex items-center justify-center font-bold font-mono">
                  L1
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B2545]">User & Client Tier</h4>
                  <p className="text-xs text-slate-500">Student Team Members with ProjectLead and Contributor roles</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200 self-start sm:self-auto">
                Web Browsers / HTTPS
              </span>
            </div>

            {/* Layer 2 */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold font-mono">
                  L2
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B2545]">Frontend Presentation Tier</h4>
                  <p className="text-xs text-slate-500">React.js Single Page Application, Tailwind CSS, Lucide icons</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                AWS Amplify / S3 Hosting
              </span>
            </div>

            {/* Layer 3 */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-sky-300 flex items-center justify-center font-bold font-mono">
                  L3
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B2545]">Authentication & API Tier</h4>
                  <p className="text-xs text-slate-500">Cognito User Pool JWT Authorizer ➔ Amazon API Gateway ➔ FastAPI Lambda</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200 self-start sm:self-auto">
                Cognito JWT + AWS Lambda
              </span>
            </div>

            {/* Layer 4 */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold font-mono">
                  L4
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B2545]">Storage & Database Tier</h4>
                  <p className="text-xs text-slate-500">Amazon S3 (Versioning + CORS) & 3 DynamoDB Metadata Tables</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                S3 Versioning + DynamoDB
              </span>
            </div>

            {/* Layer 5 */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-400 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-sky-300 flex items-center justify-center font-bold font-mono">
                  L5
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B2545]">Event Processing & Observability Tier</h4>
                  <p className="text-xs text-slate-500">EventBridge ➔ SQS Queue ➔ Background Event Worker Lambda ➔ CloudWatch</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-sky-50 text-[#0B2545] border border-sky-200 self-start sm:self-auto">
                EventBridge + SQS + Lambda
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ACADEMIC TEAM & COURSE DETAILS */}
      {/* ------------------------------------------------------------------ */}
      <section id="team" className="py-20 bg-white border-t border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Project Creators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight mt-3">
              Course UCS531 Development Team
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Department of Computer Science and Engineering • Thapar Institute of Engineering and Technology
            </p>
            <p className="text-xs font-semibold text-sky-600 mt-1">
              Faculty Advisor: Dr. Anil Singh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DEMO_USERS.map((student) => (
              <div 
                key={student.rollNo}
                className="p-6 rounded-2xl bg-sky-50/40 border border-sky-100 hover:border-sky-400 hover:shadow-lg transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B2545] text-sky-300 font-extrabold text-base flex items-center justify-center shadow-md shadow-sky-500/20">
                      {student.avatar}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      student.role === 'ProjectLead' 
                        ? 'bg-[#0B2545] text-sky-300 border-[#0B2545]' 
                        : 'bg-sky-100 text-[#0B2545] border-sky-200'
                    }`}>
                      {student.role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0B2545]">{student.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Roll No: {student.rollNo}</p>
                  <p className="text-xs text-slate-600 mt-2 truncate font-mono">{student.email}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-sky-100">
                  <button
                    onClick={() => onQuickLogin(student)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#0B2545] hover:text-white text-[#0B2545] border border-sky-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <span>Instant Login as {student.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. READY FOR EVALUATION CTA */}
      {/* ------------------------------------------------------------------ */}
      <section id="demo" className="py-16 bg-gradient-to-r from-[#0B2545] via-[#13315C] to-[#0B2545] text-white border-t border-sky-400/20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Test the <span className="text-sky-300">CloudForge</span> Workspace?
          </h2>
          <p className="text-base text-sky-100 max-w-2xl mx-auto">
            Experience direct S3 uploads, multi-versioning, temporary sharing, and academic submission snapshots.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-[#0B2545] font-bold text-base shadow-xl transition"
            >
              Launch Live Workspace
            </button>
            <button
              onClick={() => onQuickLogin(DEMO_USERS[0])}
              className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-[#0B2545] font-bold text-base shadow-lg transition"
            >
              Sign In as Lead (Gagandeep Kaur)
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. FOOTER */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-[#081C36] text-sky-200/70 py-12 border-t border-blue-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">CloudForge Platform</p>
              <p className="text-sky-300/80">AWS Serverless Collaborative Project Workspace</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-white font-medium">Cloud Computing (UCS531) • Thapar Institute of Engineering & Technology</p>
            <p className="font-mono text-sky-300/70">Gagandeep Kaur (1024170063) • Puneet Singh (1024170066) • Aditya Gupta (1024170204)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

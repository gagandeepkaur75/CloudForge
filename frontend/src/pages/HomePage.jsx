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

export default function HomePage({ onNavigateLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-slate-50 text-slate-800">
      
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP ANNOUNCEMENT BAR & NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs py-2 px-4 text-center font-medium shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">UCS531</span>
          <span>Cloud Computing Academic Project • Thapar Institute of Engineering & Technology</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">Cloud<span className="text-blue-600">Forge</span></span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  AWS ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Collaborative Student Engineering Workspace</p>
            </div>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#architecture" className="hover:text-blue-600 transition">5-Layer Architecture</a>
            <a href="#team" className="hover:text-blue-600 transition">Project Team</a>
            <a href="#get-started" className="hover:text-blue-600 transition">Get Started</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition duration-150 flex items-center space-x-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. HERO SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Soft background blue orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>UCS531 Cloud Computing Capstone Project</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Collaborative Project Workspace for <span className="blue-gradient-text">Student Engineers</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              A collaborative workspace with a serverless AWS architecture design for file history, project access controls, activity logs, and submission archives. AWS deployment status has not been verified.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigateLogin('login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition duration-150 flex items-center justify-center space-x-2"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#architecture"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Key Value Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Direct S3 Pre-Signed Uploads</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Multi-Version S3 Recovery</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>EventBridge + SQS Pipeline</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>One-Click Academic Snapshot</span>
              </div>
            </div>
          </div>

          {/* Interactive UI Hero Card Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-blue-200/80 shadow-2xl shadow-blue-500/10 p-4 sm:p-6 relative">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 font-mono text-xs text-slate-500">https://cloudforge.workspace/dashboard</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                  DESIGN PREVIEW · STATUS UNVERIFIED
                </span>
              </div>

              {/* Preview Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">Workspaces</span>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">Projects</p>
                  <span className="text-[11px] text-blue-600 font-medium">Project workspaces</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">File Storage</span>
                  <p className="text-2xl font-black text-blue-600 mt-1 font-mono">Amazon S3</p>
                  <span className="text-[11px] text-slate-500">AWS configuration unverified</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">Authentication</span>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">Cognito</p>
                  <span className="text-[11px] text-amber-600 font-medium">AWS configuration unverified</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">Snapshots</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">ZIP Archive</p>
                  <span className="text-[11px] text-slate-500">S3 Object Lock not configured</span>
                </div>
                <p className="px-6 pb-5 text-xs text-slate-500">This is a product preview, not live account data. AWS deployment and connection status have not been verified.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CORE CAPABILITIES (WHITE & BLUE CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 bg-white border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Engineered to Resolve Every Team Vulnerability
            </h2>
            <p className="mt-3 text-base text-slate-600">
              From destructive overwriting to eleventh-hour submission chaos, CloudForge guarantees academic deliverables remain protected and verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                S3 Multi-Versioning & Recovery
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Every file upload retains its historical ancestor with unique Version IDs. Accidental overwrites are restored with a single click via atomic <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-xs font-mono">s3:CopyObject</code>.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                Zero-Bottleneck Pre-Signed PUT
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Files transfer directly from the browser to Amazon S3 using time-limited Pre-Signed URLs (valid 300s). Bypasses server memory limits and handles multi-gigabyte datasets with zero lag.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                EventBridge + SQS Pipeline
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                S3 events route through Amazon EventBridge to a durable SQS queue. Background Lambda workers index metadata and record audit logs into DynamoDB without slowing client responses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                Time-Limited Secure Sharing
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Generate temporary pre-signed download links with selectable expirations (15 mins, 1 hour, or 24 hours). Share reports with external evaluators without compromising project credentials.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                Academic Submission Snapshots
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Once AWS is configured, project admins can create a ZIP archive of current files in a timestamped S3 prefix. Object Lock and immutable retention are not configured.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                Cognito Authentication & Project Access
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                After AWS configuration, Cognito will authenticate users and project membership will control API access. AWS Backup automation is not implemented.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. 5-LAYER CLOUD ARCHITECTURE DIAGRAM */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              5-Layer Decoupled Cloud Architecture
            </h2>
            <p className="mt-3 text-base text-slate-600">
              How data and events seamlessly travel across the AWS serverless stack.
            </p>
          </div>

          {/* Interactive Layer Flow */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Layer 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold font-mono">
                  L1
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">User & Client Tier</h4>
                  <p className="text-xs text-slate-500">Project members with Admin, Editor, Contributor, or Viewer roles</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                Web Browsers / HTTPS
              </span>
            </div>

            {/* Layer 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center font-bold font-mono">
                  L2
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Frontend Presentation Tier</h4>
                  <p className="text-xs text-slate-500">React.js Single Page Application, Tailwind CSS, Lucide icons</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 self-start sm:self-auto">
                Vercel (current frontend host)
              </span>
            </div>

            {/* Layer 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold font-mono">
                  L3
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Authentication & API Tier</h4>
                  <p className="text-xs text-slate-500">Target: Cognito JWT authorizer ➔ Amazon API Gateway ➔ FastAPI Lambda</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                Deployment pending
              </span>
            </div>

            {/* Layer 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold font-mono">
                  L4
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Storage & Database Tier</h4>
                  <p className="text-xs text-slate-500">Amazon S3 (Versioning + CORS) & 3 DynamoDB Metadata Tables</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                S3 Versioning + DynamoDB
              </span>
            </div>

            {/* Layer 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold font-mono">
                  L5
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Event Processing & Observability Tier</h4>
                  <p className="text-xs text-slate-500">EventBridge ➔ SQS Queue ➔ Background Event Worker Lambda ➔ CloudWatch</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 self-start sm:self-auto">
                EventBridge + SQS + Lambda
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ACADEMIC TEAM & COURSE DETAILS */}
      {/* ------------------------------------------------------------------ */}
      <section id="team" className="py-20 bg-white border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Project Creators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Course UCS531 Development Team
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Department of Computer Science and Engineering • Thapar Institute of Engineering and Technology
            </p>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-blue-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Sign in with your own account</h3>
            <p className="mt-2 text-sm text-slate-600">Team access is designed around authenticated accounts and project permissions. Demo accounts and instant-login shortcuts are not available.</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. READY FOR EVALUATION CTA */}
      {/* ------------------------------------------------------------------ */}
      <section id="get-started" className="py-16 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Explore the CloudForge Workspace
          </h2>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Cloud features become available after the AWS backend and account configuration are in place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateLogin('login')}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-base shadow-xl transition"
            >
              Launch Live Workspace
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. FOOTER */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">CloudForge Platform</p>
              <p className="text-slate-400">AWS Serverless Collaborative Project Workspace</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-slate-300 font-medium">Cloud Computing (UCS531) • Thapar Institute of Engineering & Technology</p>
            <p className="font-mono text-slate-500">Gagandeep Kaur (1024170063) • Puneet Singh (1024170066) • Aditya Gupta (1024170204)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import MyProjects from './pages/MyProjects';
import ProjectWorkspace from './pages/ProjectWorkspace';
import TeamMembers from './pages/TeamMembers';
import FileSharing from './pages/FileSharing';
import VersionHistory from './pages/VersionHistory';
import ActivityLogs from './pages/ActivityLogs';
import SubmissionBackup from './pages/SubmissionBackup';
import SettingsPage from './pages/SettingsPage';
import { authService } from './services/auth';
import { getMockDb } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'login' | 'app'
  const [activeTab, setActiveTab] = useState('dashboard'); // sidebar tabs
  const [selectedProject, setSelectedProject] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);

  const refreshStorage = () => {
    try {
      const db = getMockDb();
      const total = (db.projects || []).reduce((acc, p) => acc + (p.totalStorageBytes || 0), 0);
      setTotalStorageBytes(total);
    } catch {
      setTotalStorageBytes(0);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    refreshStorage();
    setInitialized(true);
  }, [activeTab, currentView]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('app');
    setActiveTab('dashboard');
    setSelectedProject(null);
  };

  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
    setSelectedProject(null);
    setCurrentView('home');
  };

  const handleUserChange = (newUser) => {
    setCurrentUser(newUser);
  };

  const handleQuickLoginFromHome = async (demoUser) => {
    try {
      const user = await authService.signIn(demoUser.email, 'Password123!');
      setCurrentUser(user);
      setCurrentView('app');
      setActiveTab('dashboard');
      setSelectedProject(null);
    } catch (e) {
      console.error('Quick login failed', e);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActiveTab('workspace');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-[#0B2545] rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Landing Page View
  if (currentView === 'home') {
    return (
      <HomePage
        onNavigateLogin={() => {
          if (currentUser) {
            setCurrentView('app');
          } else {
            setCurrentView('login');
          }
        }}
        onQuickLogin={handleQuickLoginFromHome}
      />
    );
  }

  // 2. Login & Sign Up View
  if (currentView === 'login' || !currentUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoHome={() => setCurrentView('home')}
      />
    );
  }

  // 3. SaaS Dashboard Application Shell with Persistent Left Sidebar & Top Navbar
  return (
    <div className="min-h-screen bg-white text-[#0B2545] flex font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={activeTab === 'workspace' ? 'projects' : activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'workspace') setSelectedProject(null);
        }}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalStorageBytes={totalStorageBytes}
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 bg-slate-50/60">
        {/* Top Navigation Bar */}
        <TopNavbar
          currentUser={currentUser}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onLogout={handleLogout}
          onUserChange={handleUserChange}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setSelectedProject(null);
          }}
          onGoHome={() => setCurrentView('home')}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Dynamic Page Routing */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              currentUser={currentUser}
              globalSearch={globalSearch}
              onSelectProject={handleSelectProject}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'projects' && (
            <MyProjects
              globalSearch={globalSearch}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeTab === 'workspace' && (
            <ProjectWorkspace
              project={selectedProject || { projectId: 'proj-ucs531-team04', title: 'CloudForge Serverless Workspace', description: 'Academic project workspace.' }}
              currentUser={currentUser}
              globalSearch={globalSearch}
              onBack={() => {
                setSelectedProject(null);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'team' && (
            <TeamMembers
              currentUser={currentUser}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'sharing' && (
            <FileSharing
              currentUser={currentUser}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'versions' && (
            <VersionHistory
              currentUser={currentUser}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityLogs
              currentUser={currentUser}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'submission' && (
            <SubmissionBackup
              currentUser={currentUser}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              onUserChange={handleUserChange}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>CloudForge</span>
            <button onClick={() => setCurrentView('home')} className="text-sky-600 hover:underline font-medium">
              Landing Page
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

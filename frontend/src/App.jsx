import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import PublicSite from './pages/PublicSite';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentView, setCurrentView] = useState(() => window.location.pathname === '/login' ? 'login' : ['/dashboard', '/workspace'].includes(window.location.pathname) ? 'app' : 'home');
  const [publicPage, setPublicPage] = useState(() => window.location.pathname || '/');
  const [activeTab, setActiveTab] = useState('dashboard'); // sidebar tabs
  const [selectedProject, setSelectedProject] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    const restoreAuthentication = async () => {
      let restoredUser = null;
      try {
        restoredUser = await authService.restoreSession();
      } catch (error) {
        console.error('Unable to restore the Cognito session:', error);
      }

      if (!active) return;
      setCurrentUser(restoredUser);
      if (['/dashboard', '/workspace'].includes(window.location.pathname) && !restoredUser) {
        window.history.replaceState({}, '', '/login');
        setCurrentView('login');
      }
      setInitialized(true);
    };

    restoreAuthentication();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname || '/';
      if (path === '/login') setCurrentView('login');
      else if (path === '/dashboard' || path === '/workspace') {
        if (currentUser) setCurrentView('app');
        else {
          window.history.replaceState({}, '', '/login');
          setCurrentView('login');
        }
      }
      else { setPublicPage(path); setCurrentView('home'); }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentUser]);

  const navigate = (path, authenticated = Boolean(currentUser)) => {
    const requestedPath = path || '/';
    const requiresAuthentication = ['/dashboard', '/workspace'].includes(requestedPath);
    const nextPath = requiresAuthentication && !authenticated ? '/login' : requestedPath;
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    if (nextPath === '/login') setCurrentView('login');
    else if (nextPath === '/dashboard' || nextPath === '/workspace') setCurrentView('app');
    else { setPublicPage(nextPath); setCurrentView('home'); }
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    navigate('/dashboard', true);
    setActiveTab('dashboard');
    setSelectedProject(null);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Cognito global sign-out failed; the local session was cleared.', error);
    } finally {
      setCurrentUser(null);
      setSelectedProject(null);
      navigate('/');
    }
  };

  const handleUserChange = (newUser) => {
    setCurrentUser(newUser);
  };


  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActiveTab('workspace');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Public information pages have their own routes; the authenticated workspace stays separate.
  if (currentView === 'home') {
    return <PublicSite page={publicPage} navigate={navigate} />;
  }

  // Login & Sign Up View
  if (currentView === 'login' || !currentUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoHome={() => navigate('/')}
      />
    );
  }

  // 3. SaaS Dashboard Application Shell with Persistent Left Sidebar & Top Navbar
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={activeTab === 'workspace' ? 'projects' : activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'workspace') setSelectedProject(null);
        }}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation Bar */}
        <TopNavbar
          currentUser={currentUser}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onLogout={handleLogout}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setSelectedProject(null);
          }}
          onGoHome={() => navigate('/')}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Dynamic Page Routing */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              currentUser={currentUser}
              onSelectProject={handleSelectProject}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'projects' && (
            <MyProjects
              onSelectProject={handleSelectProject}
            />
          )}

          {activeTab === 'workspace' && selectedProject && (
            <ProjectWorkspace
              project={selectedProject}
              currentUser={currentUser}
              onBack={() => {
                setSelectedProject(null);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'workspace' && !selectedProject && (
            <MyProjects onSelectProject={handleSelectProject} />
          )}

          {activeTab === 'team' && (
            <TeamMembers
              currentUser={currentUser}
            />
          )}

          {activeTab === 'sharing' && (
            <FileSharing
              currentUser={currentUser}
            />
          )}

          {activeTab === 'versions' && (
            <VersionHistory
              currentUser={currentUser}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityLogs
              currentUser={currentUser}
            />
          )}

          {activeTab === 'submission' && (
            <SubmissionBackup
              currentUser={currentUser}
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
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-semibold text-slate-700">CloudForge • Advanced Cloud-Based Collaborative Project Workspace</p>
            <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
              <span>UCS531 Cloud Computing</span>
              <span>•</span>
              <button onClick={() => navigate('/')} className="text-sky-600 hover:underline">
                Public Landing Page
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

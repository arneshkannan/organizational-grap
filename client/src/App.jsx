import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { api } from './api/client.js';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ReportsHistoryPage from './pages/ReportsHistoryPage.jsx';

import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import ProjectSidePanel from './components/ProjectSidePanel.jsx';
import AssignProjectModal from './components/AssignProjectModal.jsx';
import UploadReportModal from './components/UploadReportModal.jsx';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('graph'); // default to core feature
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetProject, setUploadTargetProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);

  // Fetch projects list for modals
  const loadProjects = async () => {
    if (!user) return;
    try {
      const res = await api.get('/projects');
      setAllProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load projects for modal:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-400">Loading OrgGraph Knowledge Engine...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleOpenUploadForProject = (project) => {
    setUploadTargetProject(project);
    setIsUploadModalOpen(true);
  };

  const pageTitles = {
    dashboard: { title: 'Executive Overview', subtitle: 'Organizational Project Tracking Metrics' },
    graph: { title: 'Knowledge Graph Visualization', subtitle: 'Self-Updating Hierarchical Organizational Network' },
    projects: { title: 'Portfolio Projects', subtitle: 'Detailed Departmental Task & Pipeline Directory' },
    reports: { title: 'Report Archive', subtitle: 'Extracted Deliverables & Document Downloads' },
  };

  const currentMeta = pageTitles[activePage] || pageTitles.graph;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAssignModal={() => setIsAssignModalOpen(true)}
        onOpenUploadModal={() => {
          setUploadTargetProject(null);
          setIsUploadModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onSelectProject={(id) => setSelectedProjectId(id)}
        />

        <main className="flex-1 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigateToGraph={() => setActivePage('graph')}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
              onOpenUploadModal={() => {
                setUploadTargetProject(null);
                setIsUploadModalOpen(true);
              }}
            />
          )}

          {activePage === 'graph' && (
            <KnowledgeGraphPage
              onSelectProject={(id) => setSelectedProjectId(id)}
              selectedProjectId={selectedProjectId}
            />
          )}

          {activePage === 'projects' && (
            <ProjectsPage
              onSelectProject={(id) => setSelectedProjectId(id)}
              onNavigateToGraph={() => setActivePage('graph')}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
              onOpenUploadModal={() => {
                setUploadTargetProject(null);
                setIsUploadModalOpen(true);
              }}
            />
          )}

          {activePage === 'reports' && (
            <ReportsHistoryPage
              onSelectProject={(id) => setSelectedProjectId(id)}
            />
          )}
        </main>
      </div>

      {/* Slide-over Project Detail Panel */}
      <ProjectSidePanel
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
        onUploadNewReport={handleOpenUploadForProject}
      />

      {/* Assign Project Modal (Manager Only) */}
      <AssignProjectModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onProjectCreated={() => {
          loadProjects();
        }}
      />

      {/* Upload Progress Report Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadTargetProject(null);
        }}
        projects={allProjects}
        initialProjectId={uploadTargetProject?.id}
        onReportSubmitted={() => {
          loadProjects();
        }}
      />
    </div>
  );
}

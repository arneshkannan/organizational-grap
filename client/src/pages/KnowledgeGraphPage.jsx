import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Search,
  Filter,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Target,
  ShieldAlert,
  Loader2,
  ChevronDown,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

import OrgNode from '../components/graph/OrgNode.jsx';
import DeptNode from '../components/graph/DeptNode.jsx';
import TeamNode from '../components/graph/TeamNode.jsx';
import ProjectNode from '../components/graph/ProjectNode.jsx';
import StageNode from '../components/graph/StageNode.jsx';
import BlockerNode from '../components/graph/BlockerNode.jsx';
import GraphLegend from '../components/graph/GraphLegend.jsx';
import { getLayoutedElements } from '../components/graph/layout.js';
import { api } from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nodeTypes = {
  orgNode: OrgNode,
  deptNode: DeptNode,
  teamNode: TeamNode,
  projectNode: ProjectNode,
  stageNode: StageNode,
  blockerNode: BlockerNode,
};

function GraphCanvas({ onSelectProject, selectedProjectId }) {
  const { user } = useAuth();
  const { addListener } = useSocket();
  const reactFlowInstance = useReactFlow();

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(user?.role === 'EMPLOYEE' ? user.departmentId : 'ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeStageNodes, setIncludeStageNodes] = useState(false); // Default to clean, clear view!
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const isManager = user?.role === 'MANAGER';

  // Load departments list for filter
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await api.get('/departments');
        setDepartments(res.departments || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, []);

  // Fetch graph data from backend
  const fetchGraph = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedDept && selectedDept !== 'ALL') queryParams.append('departmentId', selectedDept);
      if (selectedStatus && selectedStatus !== 'ALL') queryParams.append('status', selectedStatus);
      if (searchQuery && searchQuery.trim() !== '') queryParams.append('search', searchQuery.trim());
      queryParams.append('includeStageNodes', includeStageNodes ? 'true' : 'false');

      const url = `/graph?${queryParams.toString()}`;
      const data = await api.get(url);

      if (data.nodes && data.edges) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          data.nodes,
          data.edges,
          'TB'
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Auto center with comfortable padding & readable scale
        setTimeout(() => {
          reactFlowInstance.fitView({
            padding: 0.18,
            duration: 800,
            maxZoom: 1.0, // Prevents over-zooming while guaranteeing large readable cards
          });
        }, 120);
      }
    } catch (err) {
      console.error('Error loading graph:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedStatus, searchQuery, includeStageNodes, reactFlowInstance, setNodes, setEdges]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchGraph();
  }, [fetchGraph]);

  // Real-time updates subscription via WebSocket
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'REPORT_PROCESSED' || event.type === 'PROJECT_CREATED' || event.type === 'PROJECT_DELETED') {
        fetchGraph();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addListener, fetchGraph]);

  // Quick zoom to a specific project
  const focusOnProject = (projectId) => {
    const matchedNode = nodes.find(
      (n) => n.type === 'projectNode' && (n.data?.id === projectId || n.id === `proj-${projectId}`)
    );
    if (matchedNode) {
      reactFlowInstance.setCenter(matchedNode.position.x + 160, matchedNode.position.y + 105, {
        zoom: 1.05,
        duration: 900,
      });
    }
  };

  // Focus on At-Risk or Delayed projects
  const focusOnProblems = () => {
    const problemNode = nodes.find(
      (n) => n.type === 'projectNode' && (n.data?.status === 'DELAYED' || n.data?.status === 'AT_RISK')
    );
    if (problemNode) {
      reactFlowInstance.setCenter(problemNode.position.x + 160, problemNode.position.y + 105, {
        zoom: 1.1,
        duration: 900,
      });
    } else {
      reactFlowInstance.fitView({ padding: 0.2, duration: 600 });
    }
  };

  // Reset to crisp 100% zoom
  const resetTo100Percent = () => {
    const orgNode = nodes.find((n) => n.type === 'orgNode') || nodes[0];
    if (orgNode) {
      reactFlowInstance.setCenter(orgNode.position.x + 160, orgNode.position.y + 150, {
        zoom: 0.95,
        duration: 700,
      });
    } else {
      reactFlowInstance.zoomTo(1.0, { duration: 500 });
    }
  };

  // Search input handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length > 1) {
      const matchedNode = nodes.find(
        (n) => n.type === 'projectNode' && n.data?.name?.toLowerCase().includes(val.toLowerCase())
      );
      if (matchedNode) {
        reactFlowInstance.setCenter(matchedNode.position.x + 160, matchedNode.position.y + 105, {
          zoom: 1.1,
          duration: 800,
        });
      }
    }
  };

  const onNodeClick = useCallback(
    (event, node) => {
      if (node.type === 'projectNode') {
        onSelectProject(node.data.id);
      } else if (node.type === 'stageNode' && node.data?.projectId) {
        onSelectProject(node.data.projectId);
      } else if (node.type === 'blockerNode' && node.data?.projectId) {
        onSelectProject(node.data.projectId);
      } else if (node.type === 'deptNode' && isManager) {
        // Clicking a department node isolates that department for crystal-clear focus!
        setSelectedDept(node.data.id);
      }
    },
    [onSelectProject, isManager]
  );

  // List of all project nodes in view for the jump selector
  const projectNodes = nodes.filter((n) => n.type === 'projectNode');

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      
      {/* Top Floating Master Control Center */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-2 pointer-events-none">
        
        {/* Row 1: Search, Department Quick Tabs & Health Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Controls */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/95 dark:bg-slate-900/95 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md">
            
            {/* Search Input */}
            <div className="relative w-52 md:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search project..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Health Filter */}
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 pr-1 py-1 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ON_TRACK">🟢 On Track</option>
                <option value="AT_RISK">🟡 At Risk</option>
                <option value="DELAYED">🔴 Delayed</option>
                <option value="COMPLETED">🔵 Completed</option>
              </select>
            </div>

            {/* View Mode Switcher (Clean Overview vs Deep Pipeline) */}
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIncludeStageNodes(!includeStageNodes)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  includeStageNodes
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    : 'bg-brand-500/10 text-brand-500 border border-brand-500/30'
                }`}
                title={includeStageNodes ? "Switch to High-Clarity Compact View" : "Expand all 40 stage milestone nodes"}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{includeStageNodes ? '🔬 Deep Pipeline View' : '🎯 Clean Overview (Recommended)'}</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => {
                setLoading(true);
                fetchGraph();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-500 transition-colors"
              title="Refresh Graph"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
            </button>
          </div>

          {/* Right: Quick Action Buttons (Jump to Problems & Zoom Presets) */}
          <div className="flex items-center gap-2 pointer-events-auto bg-white/95 dark:bg-slate-900/95 p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md">
            
            {/* Quick jump to at-risk button */}
            <button
              onClick={focusOnProblems}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
              title="Center on At-Risk or Delayed Projects"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Spot Blockers</span>
            </button>

            {/* Reset to 100% Crisp Zoom */}
            <button
              onClick={resetTo100Percent}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              title="Reset to 100% Crisp Human-Readable Zoom"
            >
              <Target className="w-3.5 h-3.5 text-brand-500" />
              <span>100% Zoom</span>
            </button>

            {/* Fit View */}
            <button
              onClick={() => reactFlowInstance.fitView({ padding: 0.18, duration: 600, maxZoom: 1.0 })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              title="Fit Full Hierarchy on Screen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Fit Screen</span>
            </button>
          </div>
        </div>

        {/* Row 2: Department Focus Tabs (Single-click department isolation for ultra-crisp view!) */}
        {isManager && (
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm w-fit">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Focus Department:
            </span>

            <button
              onClick={() => setSelectedDept('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedDept === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              🏢 All Departments (8)
            </button>

            {departments.map((d) => {
              const isActive = selectedDept === d.id;
              const emoji =
                d.name === 'Engineering' ? '💻' :
                d.name === 'Marketing' ? '📣' :
                d.name === 'HR' ? '👥' :
                d.name === 'Finance' ? '💰' : '⚙️';

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {emoji} {d.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center">
          <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            <span>Calculating High-Clarity Hierarchical Graph Layout...</span>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.35}
        maxZoom={2.2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1.2} color="currentColor" className="text-slate-300 dark:text-slate-800" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'orgNode') return '#6366f1';
            if (n.type === 'deptNode') return '#3b82f6';
            if (n.type === 'teamNode') return '#0ea5e9';
            if (n.type === 'projectNode') {
              if (n.data?.status === 'ON_TRACK') return '#10b981';
              if (n.data?.status === 'AT_RISK') return '#f59e0b';
              if (n.data?.status === 'DELAYED') return '#f43f5e';
              return '#3b82f6';
            }
            if (n.type === 'blockerNode') return '#ef4444';
            return '#94a3b8';
          }}
          position="bottom-right"
          className="!bottom-20 !right-5"
          maskColor="rgba(15, 23, 42, 0.4)"
        />
      </ReactFlow>

      {/* Floating Semantics Legend */}
      <GraphLegend />
    </div>
  );
}

export default function KnowledgeGraphPage(props) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  );
}

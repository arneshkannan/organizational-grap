import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sparkles,
  Layers,
  Maximize2,
  HelpCircle,
  Loader2,
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

        // Small delay to ensure render before fitting view
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
        }, 100);
      }
    } catch (err) {
      console.error('Error loading graph:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedStatus, searchQuery, reactFlowInstance, setNodes, setEdges]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchGraph();
  }, [fetchGraph]);

  // Real-time updates subscription via WebSocket
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'REPORT_PROCESSED' || event.type === 'PROJECT_CREATED') {
        console.log('⚡ Real-time WebSocket event received: updating Knowledge Graph live without reload!');
        fetchGraph();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addListener, fetchGraph]);

  // Search input centering on matching project node
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length > 1) {
      const matchedNode = nodes.find(
        (n) => n.type === 'projectNode' && n.data?.name?.toLowerCase().includes(val.toLowerCase())
      );
      if (matchedNode) {
        reactFlowInstance.setCenter(matchedNode.position.x + 160, matchedNode.position.y + 100, {
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
      }
    },
    [onSelectProject]
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Top Filter & Search Controls Floating Bar */}
      <div className="absolute top-5 left-5 right-5 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Search & Filter inputs */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto bg-white/95 dark:bg-slate-900/95 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md">
          
          {/* Search Project */}
          <div className="relative w-56 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search project name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Filter (Only for manager, employee is locked to own dept) */}
          {isManager && (
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 pr-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Health Status Filter */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 pr-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Health Statuses</option>
              <option value="ON_TRACK">On Track (Green)</option>
              <option value="AT_RISK">At Risk (Amber)</option>
              <option value="DELAYED">Delayed (Red)</option>
              <option value="COMPLETED">Completed (Blue)</option>
            </select>
          </div>

          {/* Re-layout / Refresh Button */}
          <button
            onClick={() => {
              setLoading(true);
              fetchGraph();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-500 transition-colors"
            title="Refresh & Relayout Graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>

        {/* Right: Reset Fit Button */}
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center space-x-2">
          <button
            onClick={() => reactFlowInstance.fitView({ padding: 0.2, duration: 600 })}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-brand-500" />
            <span>Center Graph</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center">
          <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            <span>Calculating Hierarchical Dagre Layout...</span>
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
        minZoom={0.15}
        maxZoom={1.8}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1.2} color="currentColor" className="text-slate-300 dark:text-slate-800" />
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

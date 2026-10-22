import prisma from '../prisma.js';

export async function getGraphData(filters = {}) {
  const { departmentId, status, search } = filters;

  // Build project query filters
  const projectWhere = {};
  if (departmentId && departmentId !== 'ALL') {
    projectWhere.departmentId = departmentId;
  }
  if (status && status !== 'ALL') {
    projectWhere.status = status;
  }
  if (search && search.trim() !== '') {
    projectWhere.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ];
  }

  // Fetch departments, teams, projects, stages, blockers, latest reports
  const departments = await prisma.department.findMany({
    include: {
      teams: {
        include: {
          projects: {
            where: projectWhere,
            include: {
              stages: { orderBy: { order: 'asc' } },
              blockers: { where: { resolved: false } },
              reports: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          }
        }
      }
    }
  });

  // Global counts for metrics
  const allProjects = await prisma.project.findMany({
    select: { id: true, status: true, departmentId: true }
  });

  const totalProjects = allProjects.length;
  const onTrackCount = allProjects.filter(p => p.status === 'ON_TRACK').length;
  const atRiskCount = allProjects.filter(p => p.status === 'AT_RISK').length;
  const delayedCount = allProjects.filter(p => p.status === 'DELAYED').length;
  const completedCount = allProjects.filter(p => p.status === 'COMPLETED').length;

  const nodes = [];
  const edges = [];

  // Root Organization Node
  nodes.push({
    id: 'org-root',
    type: 'orgNode',
    data: {
      label: 'OrgGraph Enterprise',
      totalProjects,
      onTrackCount,
      atRiskCount,
      delayedCount,
      completedCount,
    },
    position: { x: 0, y: 0 }
  });

  // Traverse hierarchy
  for (const dept of departments) {
    // Only include department if it has matching projects or if no project search filter is active
    const deptProjectsCount = dept.teams.reduce((acc, t) => acc + t.projects.length, 0);
    
    // When filtering by search or status, skip empty departments
    if ((status && status !== 'ALL' || search) && deptProjectsCount === 0) {
      continue;
    }

    const deptNodeId = `dept-${dept.id}`;
    nodes.push({
      id: deptNodeId,
      type: 'deptNode',
      data: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        projectCount: deptProjectsCount,
      },
      position: { x: 0, y: 0 }
    });

    edges.push({
      id: `e-org-${dept.id}`,
      source: 'org-root',
      target: deptNodeId,
      label: 'HAS_DEPARTMENT',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 }
    });

    for (const team of dept.teams) {
      if ((status && status !== 'ALL' || search) && team.projects.length === 0) {
        continue;
      }

      const teamNodeId = `team-${team.id}`;
      nodes.push({
        id: teamNodeId,
        type: 'teamNode',
        data: {
          id: team.id,
          name: team.name,
          departmentName: dept.name,
          projectCount: team.projects.length,
        },
        position: { x: 0, y: 0 }
      });

      edges.push({
        id: `e-dept-team-${team.id}`,
        source: deptNodeId,
        target: teamNodeId,
        label: 'HAS_TEAM',
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });

      for (const proj of team.projects) {
        const projNodeId = `proj-${proj.id}`;
        const latestReport = proj.reports && proj.reports.length > 0 ? proj.reports[0] : null;

        nodes.push({
          id: projNodeId,
          type: 'projectNode',
          data: {
            id: proj.id,
            name: proj.name,
            description: proj.description,
            progress: proj.progress,
            status: proj.status,
            priority: proj.priority,
            currentStage: proj.currentStage,
            deadline: proj.deadline,
            lastUpdated: proj.lastUpdated,
            departmentId: dept.id,
            departmentName: dept.name,
            teamId: team.id,
            teamName: team.name,
            summary: latestReport ? latestReport.summary : 'No reports filed yet.',
            blockers: proj.blockers.map(b => b.description),
            stages: proj.stages,
            latestReportId: latestReport ? latestReport.id : null,
          },
          position: { x: 0, y: 0 }
        });

        edges.push({
          id: `e-team-proj-${proj.id}`,
          source: teamNodeId,
          target: projNodeId,
          label: 'ASSIGNED_TO',
          type: 'smoothstep',
          style: { stroke: '#0ea5e9', strokeWidth: 2 }
        });

        // Connected Stage Pipeline Nodes
        for (const stg of proj.stages) {
          const stageNodeId = `stage-${proj.id}-${stg.name}`;
          const isCurrent = stg.status === 'CURRENT';
          const isCompleted = stg.status === 'COMPLETED';

          nodes.push({
            id: stageNodeId,
            type: 'stageNode',
            data: {
              id: stg.id,
              projectId: proj.id,
              name: stg.name,
              order: stg.order,
              status: stg.status,
              completedAt: stg.completedAt,
            },
            position: { x: 0, y: 0 }
          });

          edges.push({
            id: `e-proj-stage-${proj.id}-${stg.name}`,
            source: projNodeId,
            target: stageNodeId,
            label: isCurrent ? 'CURRENTLY_IN_STAGE' : (isCompleted ? 'COMPLETED_STAGE' : 'PLANNED_STAGE'),
            type: 'smoothstep',
            animated: isCurrent,
            style: {
              stroke: isCurrent ? '#f59e0b' : (isCompleted ? '#10b981' : '#94a3b8'),
              strokeWidth: isCurrent ? 3 : 1.5,
              strokeDasharray: isCompleted || isCurrent ? undefined : '5,5'
            }
          });
        }

        // Active Blocker Nodes
        for (const blk of proj.blockers) {
          const blockerNodeId = `blocker-${blk.id}`;
          nodes.push({
            id: blockerNodeId,
            type: 'blockerNode',
            data: {
              id: blk.id,
              projectId: proj.id,
              description: blk.description,
              severity: blk.severity,
              createdAt: blk.createdAt,
            },
            position: { x: 0, y: 0 }
          });

          edges.push({
            id: `e-proj-blocker-${blk.id}`,
            source: projNodeId,
            target: blockerNodeId,
            label: 'BLOCKED_BY',
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#ef4444', strokeWidth: 2 }
          });
        }
      }
    }
  }

  return {
    nodes,
    edges,
    metrics: {
      totalProjects,
      onTrackCount,
      atRiskCount,
      delayedCount,
      completedCount,
    }
  };
}

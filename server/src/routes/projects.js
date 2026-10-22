import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';

const router = express.Router();
const STAGES = ['Planning', 'Development', 'Testing', 'Review', 'Deployed'];

// Helper to build default 5 stages
function createProjectStages(projectId) {
  return STAGES.map((name, idx) => ({
    projectId,
    name,
    order: idx + 1,
    status: idx === 0 ? 'CURRENT' : 'PENDING',
    completedAt: null
  }));
}

// Get projects (manager gets all or filtered; employee gets scoped to their department/team)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { departmentId, status, search } = req.query;
    const where = {};

    if (req.user.role === 'EMPLOYEE') {
      where.departmentId = req.user.departmentId;
      if (req.user.teamId) {
        where.teamId = req.user.teamId;
      }
    } else if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
        stages: { orderBy: { order: 'asc' } },
        blockers: { where: { resolved: false } },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, summary: true, createdAt: true }
        }
      },
      orderBy: { lastUpdated: 'desc' }
    });

    return res.json({ projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// Get single project details with full report history
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        department: true,
        team: true,
        stages: { orderBy: { order: 'asc' } },
        blockers: { orderBy: { createdAt: 'desc' } },
        reports: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Role check: if employee, ensure they belong to this project's department
    if (req.user.role === 'EMPLOYEE' && project.departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'Access denied to projects outside your department.' });
    }

    return res.json({ project });
  } catch (err) {
    console.error('Error fetching project detail:', err);
    return res.status(500).json({ error: 'Failed to fetch project detail.' });
  }
});

// Create project (Manager only)
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, description, departmentId, teamId, deadline, priority } = req.body;

    if (!name || !departmentId || !teamId || !deadline) {
      return res.status(400).json({ error: 'Name, department, team, and deadline are required.' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        departmentId,
        teamId,
        deadline: new Date(deadline),
        priority: priority || 'MEDIUM',
        status: 'ON_TRACK',
        progress: 0,
        currentStage: 'Planning',
        lastUpdated: new Date()
      }
    });

    // Automatically create 5 stage pipeline
    const stages = createProjectStages(project.id);
    for (const stg of stages) {
      await prisma.stage.create({ data: stg });
    }

    // Broadcast graph update via WebSocket if available
    if (req.app.locals.broadcastGraphUpdate) {
      req.app.locals.broadcastGraphUpdate('PROJECT_CREATED', { projectId: project.id, name: project.name });
    }

    const createdProjectWithRelations = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        department: true,
        team: true,
        stages: { orderBy: { order: 'asc' } }
      }
    });

    return res.status(201).json({ project: createdProjectWithRelations });
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

export default router;

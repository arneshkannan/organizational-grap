import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getGraphData } from '../services/graphService.js';

const router = express.Router();

// Get knowledge graph nodes and edges
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { departmentId, status, search } = req.query;

    // Employees can only view their own department graph
    let effectiveDepartmentId = departmentId;
    if (req.user.role === 'EMPLOYEE') {
      effectiveDepartmentId = req.user.departmentId;
    }

    const graph = await getGraphData({
      departmentId: effectiveDepartmentId,
      status,
      search
    });

    return res.json(graph);
  } catch (err) {
    console.error('Error generating graph:', err);
    return res.status(500).json({ error: 'Failed to generate knowledge graph data.' });
  }
});

export default router;

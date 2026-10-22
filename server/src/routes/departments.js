import express from 'express';
import prisma from '../prisma.js';

const router = express.Router();

// Get all departments with their teams
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        teams: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ departments });
  } catch (err) {
    console.error('Error fetching departments:', err);
    return res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

export default router;

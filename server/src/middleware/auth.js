import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'orggraph-jwt-super-secret-key-2026-secure';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          department: true,
          team: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error('Auth middleware database error:', dbErr);
      return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
  });
}

export function requireManager(req, res, next) {
  if (!req.user || req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Access denied. Manager role required.' });
  }
  next();
}

export function requireDepartmentAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Managers have access to all departments
  if (req.user.role === 'MANAGER') {
    return next();
  }

  const requestedDeptId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
  if (requestedDeptId && req.user.departmentId !== requestedDeptId) {
    return res.status(403).json({ error: 'Access denied to department other than your assigned department.' });
  }

  next();
}

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orggraph-jwt-super-secret-key-2026-secure';

// Login route with Role & Department enforcement
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, departmentId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        department: true,
        team: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role check
    if (role && user.role !== role) {
      return res.status(403).json({
        error: `User is registered as ${user.role}, but attempted login as ${role}. Please select the correct role tab.`
      });
    }

    // Employee department restriction check
    if (user.role === 'EMPLOYEE' && departmentId) {
      if (user.departmentId !== departmentId) {
        return res.status(403).json({
          error: `Access denied. You belong to the ${user.department?.name || 'different'} department, not the selected department.`
        });
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        teamId: user.teamId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name || null,
        teamId: user.teamId,
        teamName: user.team?.name || null,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Google Organization SSO login
router.post('/google-login', async (req, res) => {
  try {
    const { role, departmentId, email } = req.body;
    let user = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { department: true, team: true }
      });
    }

    if (!user) {
      if (role === 'MANAGER') {
        user = await prisma.user.findFirst({
          where: { role: 'MANAGER' },
          include: { department: true, team: true }
        });
      } else {
        if (!departmentId) {
          return res.status(400).json({ error: 'Please select your department to sign in.' });
        }
        user = await prisma.user.findFirst({
          where: { role: 'EMPLOYEE', departmentId },
          include: { department: true, team: true }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'No organizational account found for the selected department/role.' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        teamId: user.teamId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name || null,
        teamId: user.teamId,
        teamName: user.team?.name || null,
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: 'Internal server error during Google SSO.' });
  }
});

// Current user profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      departmentId: req.user.departmentId,
      departmentName: req.user.department?.name || null,
      teamId: req.user.teamId,
      teamName: req.user.team?.name || null,
    }
  });
});

// List employees for assignment
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const { departmentId } = req.query;
    const where = { role: 'EMPLOYEE' };
    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ employees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

export default router;

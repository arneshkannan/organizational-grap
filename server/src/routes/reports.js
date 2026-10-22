import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { parseDocumentFile } from '../services/documentParser.js';
import { analyzeReportWithGemini } from '../services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Please upload a PDF, DOCX, or TXT file.`));
    }
  }
});

const router = express.Router();
const STAGES = ['Planning', 'Development', 'Testing', 'Review', 'Deployed'];

// Upload report (file or text form)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { projectId, currentStage: formStage, progress: formProgress, blockers: formBlockers, nextSteps: formNextSteps, rawText: formRawText } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        department: true,
        team: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Role check: employees can only report on their assigned department
    if (req.user.role === 'EMPLOYEE' && project.departmentId !== req.user.departmentId) {
      return res.status(403).json({ error: 'You are only authorized to upload reports for your department.' });
    }

    let reportText = '';
    let fileName = null;
    let fileUrl = null;

    if (req.file) {
      fileName = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
      reportText = await parseDocumentFile(req.file.path, req.file.originalname);
    } else if (formRawText && formRawText.trim() !== '') {
      reportText = formRawText.trim();
    } else {
      // Synthesize from text form fields
      reportText = `PROJECT STATUS REPORT
Project: ${project.name}
Author: ${req.user.name}
Department: ${project.department.name}
Team: ${project.team.name}
Date: ${new Date().toLocaleDateString()}

Current Stage: ${formStage || project.currentStage}
Reported Progress: ${formProgress || project.progress}%

Blockers:
${formBlockers && formBlockers.trim() ? formBlockers : 'None'}

Next Steps / Milestones:
${formNextSteps && formNextSteps.trim() ? formNextSteps : 'Continue scheduled sprint tasks.'}
`;
    }

    if (!reportText || reportText.trim().length === 0) {
      return res.status(400).json({ error: 'Uploaded report content is empty.' });
    }

    // Process through Gemini Generative AI (or heuristic fallback)
    console.log(`🤖 Analyzing report for project "${project.name}" with Gemini AI...`);
    const aiAnalysis = await analyzeReportWithGemini(reportText, project.name);
    console.log(`✨ AI extraction complete: Stage=${aiAnalysis.stage}, Progress=${aiAnalysis.progress}%, Status=${aiAnalysis.status}`);

    // If the employee explicitly entered form values and AI returned defaults, respect explicit user inputs
    const resolvedStage = formStage && STAGES.includes(formStage) ? formStage : aiAnalysis.stage;
    const resolvedProgress = formProgress !== undefined && formProgress !== '' ? parseInt(formProgress, 10) : aiAnalysis.progress;
    const resolvedStatus = aiAnalysis.status;

    // Save report in database
    const createdReport = await prisma.report.create({
      data: {
        projectId: project.id,
        authorId: req.user.id,
        stage: resolvedStage,
        progress: resolvedProgress,
        summary: aiAnalysis.summary,
        completedTasks: JSON.stringify(aiAnalysis.completedTasks),
        risks: JSON.stringify(aiAnalysis.risks),
        peopleMentioned: JSON.stringify(aiAnalysis.peopleMentioned),
        nextMilestone: aiAnalysis.nextMilestone,
        rawText: reportText,
        fileName,
        fileUrl
      }
    });

    // Update project state
    await prisma.project.update({
      where: { id: project.id },
      data: {
        currentStage: resolvedStage,
        progress: resolvedProgress,
        status: resolvedStatus,
        lastUpdated: new Date()
      }
    });

    // Update project stages pipeline
    const targetStageIndex = STAGES.indexOf(resolvedStage);
    for (let i = 0; i < STAGES.length; i++) {
      const stgName = STAGES[i];
      let stageStatus = 'PENDING';
      let completedAt = null;

      if (i < targetStageIndex) {
        stageStatus = 'COMPLETED';
        completedAt = new Date();
      } else if (i === targetStageIndex) {
        stageStatus = resolvedProgress >= 100 && resolvedStage === 'Deployed' ? 'COMPLETED' : 'CURRENT';
        if (stageStatus === 'COMPLETED') completedAt = new Date();
      }

      await prisma.stage.upsert({
        where: {
          projectId_name: {
            projectId: project.id,
            name: stgName
          }
        },
        create: {
          projectId: project.id,
          name: stgName,
          order: i + 1,
          status: stageStatus,
          completedAt
        },
        update: {
          status: stageStatus,
          completedAt
        }
      });
    }

    // Save active blockers if extracted
    if (aiAnalysis.blockers && aiAnalysis.blockers.length > 0) {
      for (const blockerText of aiAnalysis.blockers) {
        if (blockerText && blockerText.trim().length > 3 && !blockerText.toLowerCase().startsWith('none')) {
          await prisma.blocker.create({
            data: {
              projectId: project.id,
              reportId: createdReport.id,
              description: blockerText.trim(),
              severity: resolvedStatus === 'DELAYED' ? 'BLOCKING' : 'HIGH',
              resolved: false
            }
          });
        }
      }
    } else if (resolvedStatus === 'ON_TRACK') {
      // If project has recovered to on-track, mark older blockers as resolved
      await prisma.blocker.updateMany({
        where: { projectId: project.id, resolved: false },
        data: { resolved: true }
      });
    }

    // Emit live WebSocket update to all active managers
    if (req.app.locals.broadcastGraphUpdate) {
      req.app.locals.broadcastGraphUpdate('REPORT_PROCESSED', {
        projectId: project.id,
        projectName: project.name,
        departmentName: project.department.name,
        teamName: project.team.name,
        authorName: req.user.name,
        stage: resolvedStage,
        progress: resolvedProgress,
        status: resolvedStatus,
        summary: aiAnalysis.summary,
        reportId: createdReport.id,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(201).json({
      message: 'Report uploaded and knowledge graph updated successfully.',
      report: createdReport,
      analysis: aiAnalysis,
      project: {
        id: project.id,
        name: project.name,
        stage: resolvedStage,
        progress: resolvedProgress,
        status: resolvedStatus
      }
    });
  } catch (err) {
    console.error('Error uploading/processing report:', err);
    return res.status(500).json({ error: `Report processing failed: ${err.message}` });
  }
});

// Get report history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }

    // If employee, limit to their own reports or department
    if (req.user.role === 'EMPLOYEE') {
      where.OR = [
        { authorId: req.user.id },
        { project: { departmentId: req.user.departmentId } }
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } }
          }
        },
        author: {
          select: { id: true, name: true, email: true, role: true }
        },
        blockers: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ reports });
  } catch (err) {
    console.error('Error fetching report history:', err);
    return res.status(500).json({ error: 'Failed to fetch report history.' });
  }
});

// Download original report file
router.get('/download/:fileName', authenticateToken, (req, res) => {
  const { fileName } = req.params;
  const safeFileName = path.basename(fileName);
  const filePath = path.join(UPLOADS_DIR, safeFileName);

  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  } else {
    return res.status(404).json({ error: 'File not found on server.' });
  }
});

export default router;

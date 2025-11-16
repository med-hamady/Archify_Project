import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration de multer pour les PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  }
});

// Validation schemas
const createCoursePdfSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional()
});

const updateCoursePdfSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional()
});

// GET /api/course-pdfs/subject/:subjectId - Récupérer tous les PDFs d'une matière
router.get('/subject/:subjectId', requireAuth, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const coursePdfs = await prisma.coursePdf.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' }
    });

    res.json({
      success: true,
      coursePdfs
    });
  } catch (error) {
    console.error('Error fetching course PDFs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des cours'
    });
  }
});

// POST /api/course-pdfs - Créer un nouveau cours PDF (Admin uniquement)
router.post('/', requireAuth, requireAdmin, upload.single('pdf'), async (req: any, res) => {
  try {
    console.log('📄 ===== UPLOAD COURSE PDF REQUEST =====');
    console.log('📄 File:', req.file);
    console.log('📄 Body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier PDF fourni'
      });
    }

    // Parse orderIndex if provided as string
    const bodyData = {
      ...req.body,
      orderIndex: req.body.orderIndex ? parseInt(req.body.orderIndex) : undefined
    };

    const validation = createCoursePdfSchema.safeParse(bodyData);
    if (!validation.success) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.issues
      });
    }

    const { subjectId, title, description, orderIndex } = validation.data;

    // Create course PDF entry
    const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    const coursePdf = await prisma.coursePdf.create({
      data: {
        subjectId,
        title,
        description: description || null,
        pdfUrl,
        orderIndex: orderIndex ?? 0
      }
    });

    console.log('✅ Course PDF created:', coursePdf);

    res.status(201).json({
      success: true,
      coursePdf
    });
  } catch (error) {
    console.error('❌ Error creating course PDF:', error);
    // Delete uploaded file if database creation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du cours'
    });
  }
});

// PUT /api/course-pdfs/:id - Mettre à jour un cours PDF (Admin uniquement)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const validation = updateCoursePdfSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.error.issues
      });
    }

    const coursePdf = await prisma.coursePdf.update({
      where: { id },
      data: validation.data
    });

    res.json({
      success: true,
      coursePdf
    });
  } catch (error) {
    console.error('Error updating course PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du cours'
    });
  }
});

// DELETE /api/course-pdfs/:id - Supprimer un cours PDF (Admin uniquement)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const coursePdf = await prisma.coursePdf.findUnique({
      where: { id }
    });

    if (!coursePdf) {
      return res.status(404).json({
        success: false,
        error: 'Cours non trouvé'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', coursePdf.pdfUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.coursePdf.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Cours supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting course PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du cours'
    });
  }
});

export default router;

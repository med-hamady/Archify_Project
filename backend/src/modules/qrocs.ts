import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from './auth';
import { imageUpload, getFileUrl, deleteFile } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createQrocSchema = z.object({
  subjectId: z.string(),
  question: z.string().min(3, 'La question doit contenir au moins 3 caractères'),
  questionImageUrl: z.string().nullable().optional(),
  answer: z.string().min(1, 'La réponse est requise'),
  answerImageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional()
});

const updateQrocSchema = z.object({
  subjectId: z.string().optional(),
  question: z.string().min(3).optional(),
  questionImageUrl: z.string().nullable().optional(),
  answer: z.string().min(1).optional(),
  answerImageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional()
});

// GET /api/qrocs/subject/:subjectId - Get all QROCs for a subject (optionally filtered by category)
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { category } = req.query;

    const whereClause: any = { subjectId };
    if (category && typeof category === 'string') {
      whereClause.category = category;
    }

    const qrocs = await prisma.qroc.findMany({
      where: whereClause,
      orderBy: { orderIndex: 'asc' }
    });

    res.json({
      success: true,
      qrocs
    });
  } catch (error: any) {
    console.error('Error fetching QROCs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des QROCs'
    });
  }
});

// GET /api/qrocs/subject/:subjectId/categories - Get all unique categories (chapters) for a subject
router.get('/subject/:subjectId/categories', async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Get all unique categories with their QROC counts
    const qrocs = await prisma.qroc.findMany({
      where: { subjectId },
      select: { category: true }
    });

    // Group by category and count
    const categoryMap = new Map<string, number>();
    qrocs.forEach(qroc => {
      const cat = qroc.category || 'Sans catégorie';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    // Convert to array of objects
    const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count
    }));

    res.json({
      success: true,
      categories,
      totalCount: qrocs.length
    });
  } catch (error: any) {
    console.error('Error fetching QROC categories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories'
    });
  }
});

// GET /api/qrocs/subject/:subjectId/count - Get QROC count for a subject
router.get('/subject/:subjectId/count', async (req, res) => {
  try {
    const { subjectId } = req.params;

    const count = await prisma.qroc.count({
      where: { subjectId }
    });

    res.json({
      success: true,
      count
    });
  } catch (error: any) {
    console.error('Error counting QROCs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du comptage des QROCs'
    });
  }
});

// GET /api/qrocs/:id - Get a specific QROC
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const qroc = await prisma.qroc.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semester: true
          }
        }
      }
    });

    if (!qroc) {
      return res.status(404).json({
        success: false,
        error: 'QROC non trouvé'
      });
    }

    res.json({
      success: true,
      qroc
    });
  } catch (error: any) {
    console.error('Error fetching QROC:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du QROC'
    });
  }
});

// POST /api/qrocs - Create a new QROC (Admin only)
router.post('/', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const validatedData = createQrocSchema.parse(req.body);

    const qroc = await prisma.qroc.create({
      data: {
        subjectId: validatedData.subjectId,
        question: validatedData.question,
        questionImageUrl: validatedData.questionImageUrl,
        answer: validatedData.answer,
        answerImageUrl: validatedData.answerImageUrl,
        category: validatedData.category,
        orderIndex: validatedData.orderIndex ?? 0
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semester: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'QROC ajouté avec succès',
      qroc
    });
  } catch (error: any) {
    console.error('Error creating QROC:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du QROC'
    });
  }
});

// PUT /api/qrocs/:id - Update a QROC (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateQrocSchema.parse(req.body);

    // Check if QROC exists
    const existingQroc = await prisma.qroc.findUnique({
      where: { id }
    });

    if (!existingQroc) {
      return res.status(404).json({
        success: false,
        error: 'QROC non trouvé'
      });
    }

    const updatedQroc = await prisma.qroc.update({
      where: { id },
      data: validatedData,
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semester: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'QROC mis à jour avec succès',
      qroc: updatedQroc
    });
  } catch (error: any) {
    console.error('Error updating QROC:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du QROC'
    });
  }
});

// DELETE /api/qrocs/:id - Delete a QROC (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if QROC exists
    const existingQroc = await prisma.qroc.findUnique({
      where: { id }
    });

    if (!existingQroc) {
      return res.status(404).json({
        success: false,
        error: 'QROC non trouvé'
      });
    }

    // Delete associated images if they exist
    if (existingQroc.questionImageUrl) {
      const questionImagePath = path.join(__dirname, '../../', existingQroc.questionImageUrl);
      deleteFile(questionImagePath);
    }
    if (existingQroc.answerImageUrl) {
      const answerImagePath = path.join(__dirname, '../../', existingQroc.answerImageUrl);
      deleteFile(answerImagePath);
    }

    await prisma.qroc.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'QROC supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Error deleting QROC:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du QROC'
    });
  }
});

// POST /api/qrocs/:id/upload-image - Upload image for QROC (Admin only)
router.post('/:id/upload-image', requireAuth, requireAdmin, imageUpload.single('image'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { imageType } = req.body; // 'question' or 'answer'

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image fournie'
      });
    }

    if (!imageType || !['question', 'answer'].includes(imageType)) {
      // Delete uploaded file if imageType is invalid
      if (req.file.path) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: 'Type d\'image invalide. Utilisez "question" ou "answer"'
      });
    }

    // Check if QROC exists
    const existingQroc = await prisma.qroc.findUnique({
      where: { id }
    });

    if (!existingQroc) {
      // Delete uploaded file if QROC doesn't exist
      if (req.file.path) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: 'QROC non trouvé'
      });
    }

    // Delete old image if exists
    const oldImageField = imageType === 'question' ? 'questionImageUrl' : 'answerImageUrl';
    const oldImageUrl = existingQroc[oldImageField];
    if (oldImageUrl) {
      const oldImagePath = path.join(__dirname, '../../', oldImageUrl);
      deleteFile(oldImagePath);
    }

    // Get the new image URL
    const imageUrl = getFileUrl(req.file.path);

    // Update QROC with new image URL
    const updateData = imageType === 'question'
      ? { questionImageUrl: imageUrl }
      : { answerImageUrl: imageUrl };

    const updatedQroc = await prisma.qroc.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semester: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Image ${imageType === 'question' ? 'de la question' : 'de la réponse'} uploadée avec succès`,
      imageUrl,
      qroc: updatedQroc
    });
  } catch (error: any) {
    console.error('Error uploading QROC image:', error);
    // Delete uploaded file on error
    if (req.file?.path) {
      deleteFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload de l\'image'
    });
  }
});

// DELETE /api/qrocs/:id/image/:imageType - Delete image from QROC (Admin only)
router.delete('/:id/image/:imageType', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id, imageType } = req.params;

    if (!['question', 'answer'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        error: 'Type d\'image invalide. Utilisez "question" ou "answer"'
      });
    }

    // Check if QROC exists
    const existingQroc = await prisma.qroc.findUnique({
      where: { id }
    });

    if (!existingQroc) {
      return res.status(404).json({
        success: false,
        error: 'QROC non trouvé'
      });
    }

    // Get and delete the image file
    const imageField = imageType === 'question' ? 'questionImageUrl' : 'answerImageUrl';
    const imageUrl = existingQroc[imageField];

    if (imageUrl) {
      const imagePath = path.join(__dirname, '../../', imageUrl);
      deleteFile(imagePath);
    }

    // Update QROC to remove image URL
    const updateData = imageType === 'question'
      ? { questionImageUrl: null }
      : { answerImageUrl: null };

    const updatedQroc = await prisma.qroc.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semester: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Image ${imageType === 'question' ? 'de la question' : 'de la réponse'} supprimée avec succès`,
      qroc: updatedQroc
    });
  } catch (error: any) {
    console.error('Error deleting QROC image:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'image'
    });
  }
});

export default router;

import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper function to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Validation schemas
const createCourseVideoSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  youtubeUrl: z.string().url('URL YouTube invalide'),
  duration: z.string().optional(),
  orderIndex: z.number().int().min(0).optional()
});

const updateCourseVideoSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  youtubeUrl: z.string().url().optional(),
  duration: z.string().optional(),
  orderIndex: z.number().int().min(0).optional()
});

// GET /api/course-videos/subject/:subjectId - Get all videos for a subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;

    const videos = await prisma.courseVideo.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' }
    });

    res.json({
      success: true,
      courseVideos: videos
    });
  } catch (error: any) {
    console.error('Error fetching course videos:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des vidéos'
    });
  }
});

// GET /api/course-videos/:id - Get a specific video
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.courseVideo.findUnique({
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

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Vidéo non trouvée'
      });
    }

    res.json({
      success: true,
      courseVideo: video
    });
  } catch (error: any) {
    console.error('Error fetching course video:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la vidéo'
    });
  }
});

// POST /api/course-videos - Create a new course video (Admin only)
router.post('/', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const validatedData = createCourseVideoSchema.parse(req.body);

    // Extract YouTube ID from URL
    const youtubeId = extractYouTubeId(validatedData.youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        error: 'URL YouTube invalide. Veuillez fournir une URL YouTube valide.'
      });
    }

    // Generate thumbnail URL
    const thumbnailUrl = getYouTubeThumbnail(youtubeId);

    const video = await prisma.courseVideo.create({
      data: {
        subjectId: validatedData.subjectId,
        title: validatedData.title,
        description: validatedData.description,
        youtubeUrl: validatedData.youtubeUrl,
        youtubeId,
        thumbnailUrl,
        duration: validatedData.duration,
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
      message: 'Vidéo ajoutée avec succès',
      courseVideo: video
    });
  } catch (error: any) {
    console.error('Error creating course video:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la vidéo'
    });
  }
});

// PUT /api/course-videos/:id - Update a course video (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCourseVideoSchema.parse(req.body);

    // Check if video exists
    const existingVideo = await prisma.courseVideo.findUnique({
      where: { id }
    });

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        error: 'Vidéo non trouvée'
      });
    }

    let youtubeId = existingVideo.youtubeId;
    let thumbnailUrl = existingVideo.thumbnailUrl;

    // If YouTube URL is being updated, extract new ID and thumbnail
    if (validatedData.youtubeUrl) {
      const newYoutubeId = extractYouTubeId(validatedData.youtubeUrl);
      if (!newYoutubeId) {
        return res.status(400).json({
          success: false,
          error: 'URL YouTube invalide'
        });
      }
      youtubeId = newYoutubeId;
      thumbnailUrl = getYouTubeThumbnail(newYoutubeId);
    }

    const updatedVideo = await prisma.courseVideo.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.youtubeUrl && { youtubeId, thumbnailUrl })
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

    res.json({
      success: true,
      message: 'Vidéo mise à jour avec succès',
      courseVideo: updatedVideo
    });
  } catch (error: any) {
    console.error('Error updating course video:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la vidéo'
    });
  }
});

// DELETE /api/course-videos/:id - Delete a course video (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if video exists
    const existingVideo = await prisma.courseVideo.findUnique({
      where: { id }
    });

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        error: 'Vidéo non trouvée'
      });
    }

    await prisma.courseVideo.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Vidéo supprimée avec succès'
    });
  } catch (error: any) {
    console.error('Error deleting course video:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la vidéo'
    });
  }
});

export default router;

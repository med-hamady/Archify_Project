"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
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
function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
// Validation schemas
const createCourseVideoSchema = zod_1.z.object({
    subjectId: zod_1.z.string(),
    title: zod_1.z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
    description: zod_1.z.string().optional(),
    youtubeUrl: zod_1.z.string().url('URL YouTube invalide'),
    duration: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
const updateCourseVideoSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    youtubeUrl: zod_1.z.string().url().optional(),
    duration: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching course video:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la vidéo'
        });
    }
});
// POST /api/course-videos - Create a new course video (Admin only)
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating course video:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating course video:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting course video:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de la vidéo'
        });
    }
});
exports.default = router;
//# sourceMappingURL=course-videos.js.map
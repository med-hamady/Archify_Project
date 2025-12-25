"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const upload_1 = require("../middleware/upload");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Validation schemas
const createQrocSchema = zod_1.z.object({
    subjectId: zod_1.z.string(),
    question: zod_1.z.string().min(3, 'La question doit contenir au moins 3 caractères'),
    questionImageUrl: zod_1.z.string().nullable().optional(),
    answer: zod_1.z.string().min(1, 'La réponse est requise'),
    answerImageUrl: zod_1.z.string().nullable().optional(),
    category: zod_1.z.string().nullable().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
const updateQrocSchema = zod_1.z.object({
    subjectId: zod_1.z.string().optional(),
    question: zod_1.z.string().min(3).optional(),
    questionImageUrl: zod_1.z.string().nullable().optional(),
    answer: zod_1.z.string().min(1).optional(),
    answerImageUrl: zod_1.z.string().nullable().optional(),
    category: zod_1.z.string().nullable().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
// GET /api/qrocs/subject/:subjectId - Get all QROCs for a subject
router.get('/subject/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const qrocs = await prisma.qroc.findMany({
            where: { subjectId },
            orderBy: { orderIndex: 'asc' }
        });
        res.json({
            success: true,
            qrocs
        });
    }
    catch (error) {
        console.error('Error fetching QROCs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des QROCs'
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching QROC:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du QROC'
        });
    }
});
// POST /api/qrocs - Create a new QROC (Admin only)
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating QROC:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating QROC:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
            const questionImagePath = path_1.default.join(__dirname, '../../', existingQroc.questionImageUrl);
            (0, upload_1.deleteFile)(questionImagePath);
        }
        if (existingQroc.answerImageUrl) {
            const answerImagePath = path_1.default.join(__dirname, '../../', existingQroc.answerImageUrl);
            (0, upload_1.deleteFile)(answerImagePath);
        }
        await prisma.qroc.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'QROC supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Error deleting QROC:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du QROC'
        });
    }
});
// POST /api/qrocs/:id/upload-image - Upload image for QROC (Admin only)
router.post('/:id/upload-image', auth_1.requireAuth, auth_1.requireAdmin, upload_1.imageUpload.single('image'), async (req, res) => {
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
                (0, upload_1.deleteFile)(req.file.path);
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
                (0, upload_1.deleteFile)(req.file.path);
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
            const oldImagePath = path_1.default.join(__dirname, '../../', oldImageUrl);
            (0, upload_1.deleteFile)(oldImagePath);
        }
        // Get the new image URL
        const imageUrl = (0, upload_1.getFileUrl)(req.file.path);
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
    }
    catch (error) {
        console.error('Error uploading QROC image:', error);
        // Delete uploaded file on error
        if (req.file?.path) {
            (0, upload_1.deleteFile)(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'upload de l\'image'
        });
    }
});
// DELETE /api/qrocs/:id/image/:imageType - Delete image from QROC (Admin only)
router.delete('/:id/image/:imageType', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
            const imagePath = path_1.default.join(__dirname, '../../', imageUrl);
            (0, upload_1.deleteFile)(imagePath);
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
    }
    catch (error) {
        console.error('Error deleting QROC image:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'image'
        });
    }
});
exports.default = router;
//# sourceMappingURL=qrocs.js.map
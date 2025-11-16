"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Configuration de multer pour les PDFs
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/pdfs');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'course-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'));
        }
    }
});
// Validation schemas
const createCoursePdfSchema = zod_1.z.object({
    subjectId: zod_1.z.string(),
    title: zod_1.z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
    description: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
const updateCoursePdfSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    orderIndex: zod_1.z.number().int().min(0).optional()
});
// GET /api/course-pdfs/subject/:subjectId - Récupérer tous les PDFs d'une matière
router.get('/subject/:subjectId', auth_1.requireAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching course PDFs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des cours'
        });
    }
});
// POST /api/course-pdfs - Créer un nouveau cours PDF (Admin uniquement)
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, upload.single('pdf'), async (req, res) => {
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
            fs_1.default.unlinkSync(req.file.path);
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
    }
    catch (error) {
        console.error('❌ Error creating course PDF:', error);
        // Delete uploaded file if database creation fails
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du cours'
        });
    }
});
// PUT /api/course-pdfs/:id - Mettre à jour un cours PDF (Admin uniquement)
router.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating course PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du cours'
        });
    }
});
// DELETE /api/course-pdfs/:id - Supprimer un cours PDF (Admin uniquement)
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
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
        const filePath = path_1.default.join(__dirname, '../../', coursePdf.pdfUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete from database
        await prisma.coursePdf.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Cours supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Error deleting course PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du cours'
        });
    }
});
exports.default = router;
//# sourceMappingURL=course-pdfs.js.map
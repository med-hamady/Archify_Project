"use strict";
/**
 * Admin Badge Management Routes
 *
 * Routes pour la gestion des badges par les admins
 * - Créer des badges personnalisés avec image
 * - Supprimer des badges
 * - Voir tous les badges
 * - Voir les majors de chaque classe (top 3)
 * - Attribuer/Retirer des badges aux utilisateurs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBadgesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const zod_1 = require("zod");
const cloudinary_1 = require("cloudinary");
// Configuration Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const prisma = new client_1.PrismaClient();
exports.adminBadgesRouter = (0, express_1.Router)();
// ============================================
// VALIDATION SCHEMAS
// ============================================
const createBadgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom doit avoir au moins 2 caractères'),
    description: zod_1.z.string().min(5, 'La description doit avoir au moins 5 caractères'),
    imageData: zod_1.z.string().optional() // Base64 image data
});
const assignBadgeSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    badgeId: zod_1.z.string() // Maintenant on utilise l'ID du badge directement
});
const revokeBadgeSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    badgeId: zod_1.z.string() // Maintenant on utilise l'ID du badge directement
});
// ============================================
// LISTE DES BADGES DISPONIBLES
// ============================================
/**
 * GET /api/admin/badges
 * Liste tous les badges du système
 */
exports.adminBadgesRouter.get('/badges', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const badges = await prisma.badge.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { userBadges: true }
                }
            }
        });
        res.json({
            success: true,
            badges: badges.map(b => ({
                id: b.id,
                name: b.name,
                description: b.description,
                iconUrl: b.iconUrl,
                requirement: b.requirement,
                usersCount: b._count.userBadges,
                createdAt: b.createdAt
            }))
        });
    }
    catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des badges'
        });
    }
});
// ============================================
// CRÉER UN BADGE PERSONNALISÉ
// ============================================
/**
 * POST /api/admin/badges/create
 * Crée un nouveau badge personnalisé avec image
 */
exports.adminBadgesRouter.post('/badges/create', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const validation = createBadgeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { name, description, imageData } = validation.data;
        // Vérifier si un badge avec ce nom existe déjà
        const existingBadge = await prisma.badge.findUnique({
            where: { name }
        });
        if (existingBadge) {
            return res.status(400).json({
                success: false,
                error: 'Un badge avec ce nom existe déjà'
            });
        }
        let iconUrl = null;
        // Upload de l'image vers Cloudinary si fournie
        if (imageData && imageData.startsWith('data:image/')) {
            try {
                const uploadResult = await cloudinary_1.v2.uploader.upload(imageData, {
                    folder: 'facgame/badges',
                    public_id: `badge_${Date.now()}`,
                    transformation: [
                        { width: 200, height: 200, crop: 'fill' },
                        { quality: 'auto' }
                    ]
                });
                iconUrl = uploadResult.secure_url;
            }
            catch (uploadError) {
                console.error('Error uploading badge image:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Erreur lors de l\'upload de l\'image'
                });
            }
        }
        // Créer le badge
        const badge = await prisma.badge.create({
            data: {
                name,
                description,
                iconUrl,
                requirement: 'CUSTOM'
            }
        });
        console.log(`🏆 Badge "${name}" créé par admin ${req.userId}`);
        res.json({
            success: true,
            message: `Badge "${name}" créé avec succès`,
            badge: {
                id: badge.id,
                name: badge.name,
                description: badge.description,
                iconUrl: badge.iconUrl,
                requirement: badge.requirement,
                createdAt: badge.createdAt
            }
        });
    }
    catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du badge'
        });
    }
});
// ============================================
// SUPPRIMER UN BADGE
// ============================================
/**
 * DELETE /api/admin/badges/:id
 * Supprime un badge et retire tous les badges attribués aux utilisateurs
 */
exports.adminBadgesRouter.delete('/badges/:id', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que le badge existe
        const badge = await prisma.badge.findUnique({
            where: { id },
            include: {
                _count: { select: { userBadges: true } }
            }
        });
        if (!badge) {
            return res.status(404).json({
                success: false,
                error: 'Badge non trouvé'
            });
        }
        // Supprimer l'image de Cloudinary si elle existe
        if (badge.iconUrl && badge.iconUrl.includes('cloudinary')) {
            try {
                // Extraire le public_id de l'URL Cloudinary
                const urlParts = badge.iconUrl.split('/');
                const publicIdWithExt = urlParts.slice(-2).join('/').replace('facgame/', '');
                const publicId = 'facgame/' + publicIdWithExt.split('.')[0];
                await cloudinary_1.v2.uploader.destroy(publicId);
            }
            catch (err) {
                console.error('Error deleting badge image from Cloudinary:', err);
            }
        }
        // Supprimer d'abord les UserBadge associés, puis le badge
        await prisma.userBadge.deleteMany({
            where: { badgeId: id }
        });
        await prisma.badge.delete({
            where: { id }
        });
        console.log(`🗑️ Badge "${badge.name}" supprimé par admin ${req.userId}`);
        res.json({
            success: true,
            message: `Badge "${badge.name}" supprimé avec succès`
        });
    }
    catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du badge'
        });
    }
});
// ============================================
// MAJORS PAR CLASSE (LEADERBOARD)
// ============================================
/**
 * GET /api/admin/badges/majors
 * Récupère les top 3 étudiants de chaque classe (PCEM1, PCEM2, PCEP2, DCEM1)
 */
exports.adminBadgesRouter.get('/badges/majors', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const semesters = ['PCEM1', 'PCEM2', 'PCEP2', 'DCEM1'];
        const majorsBySemester = {};
        for (const semester of semesters) {
            const topStudents = await prisma.user.findMany({
                where: {
                    role: 'STUDENT',
                    semester: semester
                },
                orderBy: {
                    xpTotal: 'desc'
                },
                take: 3, // Top 3 seulement
                select: {
                    id: true,
                    name: true,
                    email: true,
                    xpTotal: true,
                    level: true,
                    profilePicture: true,
                    userBadges: {
                        include: {
                            badge: true
                        }
                    }
                }
            });
            majorsBySemester[semester] = topStudents.map((student, index) => ({
                rank: index + 1,
                id: student.id,
                name: student.name,
                email: student.email,
                xpTotal: student.xpTotal,
                level: student.level,
                profilePicture: student.profilePicture,
                badges: student.userBadges.map((ub) => ({
                    id: ub.badge.id,
                    name: ub.badge.name,
                    iconUrl: ub.badge.iconUrl,
                    requirement: ub.badge.requirement
                }))
            }));
        }
        res.json({
            success: true,
            majorsBySemester
        });
    }
    catch (error) {
        console.error('Error fetching majors:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des majors'
        });
    }
});
// ============================================
// ATTRIBUER UN BADGE
// ============================================
/**
 * POST /api/admin/badges/assign
 * Attribue un badge à un utilisateur
 */
exports.adminBadgesRouter.post('/badges/assign', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const validation = assignBadgeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { userId, badgeId } = validation.data;
        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, semester: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // Vérifier que le badge existe
        const badge = await prisma.badge.findUnique({
            where: { id: badgeId }
        });
        if (!badge) {
            return res.status(404).json({
                success: false,
                error: 'Badge non trouvé'
            });
        }
        // Vérifier si l'utilisateur a déjà ce badge
        const existingUserBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId: userId,
                    badgeId: badge.id
                }
            }
        });
        if (existingUserBadge) {
            return res.status(400).json({
                success: false,
                error: 'L\'utilisateur possède déjà ce badge'
            });
        }
        // Attribuer le badge
        const userBadge = await prisma.userBadge.create({
            data: {
                userId: userId,
                badgeId: badge.id
            },
            include: {
                badge: true,
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        console.log(`🏆 Badge "${badge.name}" attribué à ${user.name} par admin ${req.userId}`);
        res.json({
            success: true,
            message: `Badge "${badge.name}" attribué à ${user.name}`,
            userBadge: {
                id: userBadge.id,
                earnedAt: userBadge.earnedAt,
                badge: {
                    id: userBadge.badge.id,
                    name: userBadge.badge.name,
                    description: userBadge.badge.description,
                    iconUrl: userBadge.badge.iconUrl,
                    requirement: userBadge.badge.requirement
                },
                user: {
                    name: userBadge.user.name,
                    email: userBadge.user.email
                }
            }
        });
    }
    catch (error) {
        console.error('Error assigning badge:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'attribution du badge'
        });
    }
});
// ============================================
// RETIRER UN BADGE
// ============================================
/**
 * POST /api/admin/badges/revoke
 * Retire un badge d'un utilisateur
 */
exports.adminBadgesRouter.post('/badges/revoke', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const validation = revokeBadgeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { userId, badgeId } = validation.data;
        // Trouver le badge
        const badge = await prisma.badge.findUnique({
            where: { id: badgeId }
        });
        if (!badge) {
            return res.status(404).json({
                success: false,
                error: 'Badge non trouvé'
            });
        }
        // Vérifier si l'utilisateur a ce badge
        const userBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId: userId,
                    badgeId: badge.id
                }
            },
            include: {
                user: { select: { name: true } }
            }
        });
        if (!userBadge) {
            return res.status(404).json({
                success: false,
                error: 'L\'utilisateur ne possède pas ce badge'
            });
        }
        // Retirer le badge
        await prisma.userBadge.delete({
            where: {
                userId_badgeId: {
                    userId: userId,
                    badgeId: badge.id
                }
            }
        });
        console.log(`🏆 Badge "${badge.name}" retiré de ${userBadge.user.name} par admin ${req.userId}`);
        res.json({
            success: true,
            message: `Badge "${badge.name}" retiré de ${userBadge.user.name}`
        });
    }
    catch (error) {
        console.error('Error revoking badge:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du retrait du badge'
        });
    }
});
// ============================================
// UTILISATEURS AVEC BADGES
// ============================================
/**
 * GET /api/admin/badges/holders
 * Liste tous les utilisateurs qui ont un badge
 */
exports.adminBadgesRouter.get('/badges/holders', auth_1.requireAuth, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const badges = await prisma.badge.findMany({
            include: {
                userBadges: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                semester: true,
                                xpTotal: true,
                                level: true,
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });
        const holders = badges.flatMap(badge => badge.userBadges.map((ub) => ({
            badgeId: badge.id,
            badgeName: badge.name,
            badgeIconUrl: badge.iconUrl,
            badgeRequirement: badge.requirement,
            earnedAt: ub.earnedAt,
            user: ub.user
        })));
        res.json({
            success: true,
            holders
        });
    }
    catch (error) {
        console.error('Error fetching badge holders:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des détenteurs de badges'
        });
    }
});
exports.default = exports.adminBadgesRouter;
//# sourceMappingURL=admin-badges.js.map
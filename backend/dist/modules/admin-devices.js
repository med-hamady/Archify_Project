"use strict";
/**
 * Admin Device Management Module
 *
 * Routes for device management by administrators:
 * - List all users with their authorized devices
 * - Remove specific device from a user
 * - Remove all devices from a user (reset)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDevicesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.adminDevicesRouter = (0, express_1.Router)();
// Validation schemas
const removeDeviceSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
    reason: zod_1.z.string().optional()
});
const removeAllDevicesSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    reason: zod_1.z.string().optional()
});
/**
 * GET /api/admin/devices/users
 * Get all users with their authorized devices
 */
exports.adminDevicesRouter.get('/users', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                semester: true,
                role: true,
                authorizedDevices: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        // Calculate device count and limit for each user
        const usersWithDeviceInfo = users.map(user => ({
            ...user,
            deviceCount: user.authorizedDevices?.length || 0,
            deviceLimit: user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 4 : 2,
            hasReachedLimit: (user.authorizedDevices?.length || 0) >=
                (user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 4 : 2)
        }));
        return res.json({
            success: true,
            users: usersWithDeviceInfo
        });
    }
    catch (error) {
        console.error('[Admin Devices] Error fetching users:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});
/**
 * DELETE /api/admin/devices/remove
 * Remove a specific device from a user
 */
exports.adminDevicesRouter.delete('/remove', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const validation = removeDeviceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { userId, deviceId, reason } = validation.data;
        const adminId = req.userId;
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                authorizedDevices: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // Check if device exists
        const devices = user.authorizedDevices || [];
        if (!devices.includes(deviceId)) {
            return res.status(404).json({
                success: false,
                error: 'Appareil non trouvé pour cet utilisateur'
            });
        }
        // Remove the device
        const updatedDevices = devices.filter(d => d !== deviceId);
        await prisma.user.update({
            where: { id: userId },
            data: { authorizedDevices: updatedDevices }
        });
        console.log(`[Admin Devices] Admin ${adminId} removed device ${deviceId} from user ${userId}. Reason: ${reason || 'N/A'}`);
        return res.json({
            success: true,
            message: 'Appareil supprimé avec succès',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                deviceCount: updatedDevices.length
            }
        });
    }
    catch (error) {
        console.error('[Admin Devices] Error removing device:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'appareil'
        });
    }
});
/**
 * DELETE /api/admin/devices/remove-all
 * Remove all devices from a user (device reset)
 */
exports.adminDevicesRouter.delete('/remove-all', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const validation = removeAllDevicesSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: validation.error.issues
            });
        }
        const { userId, reason } = validation.data;
        const adminId = req.userId;
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                authorizedDevices: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        const deviceCount = user.authorizedDevices?.length || 0;
        // Clear all devices
        await prisma.user.update({
            where: { id: userId },
            data: { authorizedDevices: [] }
        });
        console.log(`[Admin Devices] Admin ${adminId} removed ALL devices (${deviceCount}) from user ${userId}. Reason: ${reason || 'N/A'}`);
        return res.json({
            success: true,
            message: `Tous les appareils (${deviceCount}) ont été supprimés`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                deviceCount: 0
            }
        });
    }
    catch (error) {
        console.error('[Admin Devices] Error removing all devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression des appareils'
        });
    }
});
//# sourceMappingURL=admin-devices.js.map
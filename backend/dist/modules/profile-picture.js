"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilePictureRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const cloudinary_1 = require("cloudinary");
const prisma = new client_1.PrismaClient();
// Configuration Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadProfilePictureSchema = zod_1.z.object({
    imageData: zod_1.z.string(), // Base64 image data
});
exports.profilePictureRouter = (0, express_1.Router)();
// Upload profile picture
exports.profilePictureRouter.post('/picture', auth_1.requireAuth, async (request, reply) => {
    const userId = request.userId;
    try {
        const { imageData } = uploadProfilePictureSchema.parse(request.body);
        // Upload to Cloudinary
        const uploadResult = await cloudinary_1.v2.uploader.upload(imageData, {
            folder: 'facgame/profile-pictures',
            public_id: `user_${userId}`,
            overwrite: true,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
            ],
        });
        // Update user profile picture URL in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePicture: uploadResult.secure_url },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
            },
        });
        return reply.status(200).json({
            success: true,
            message: 'Photo de profil mise à jour avec succès',
            profilePicture: updatedUser.profilePicture,
        });
    }
    catch (error) {
        console.error('Error uploading profile picture:', error);
        return reply.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload de la photo de profil',
        });
    }
});
// Delete profile picture
exports.profilePictureRouter.delete('/picture', auth_1.requireAuth, async (request, reply) => {
    const userId = request.userId;
    try {
        // Get current user to check if they have a profile picture
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePicture: true }
        });
        // Delete from Cloudinary if exists
        if (user?.profilePicture) {
            const publicId = `facgame/profile-pictures/user_${userId}`;
            try {
                await cloudinary_1.v2.uploader.destroy(publicId);
            }
            catch (err) {
                console.error('Error deleting from Cloudinary:', err);
            }
        }
        // Remove from database
        await prisma.user.update({
            where: { id: userId },
            data: { profilePicture: null },
        });
        return reply.status(200).json({
            success: true,
            message: 'Photo de profil supprimée avec succès',
        });
    }
    catch (error) {
        console.error('Error deleting profile picture:', error);
        return reply.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la photo de profil',
        });
    }
});
//# sourceMappingURL=profile-picture.js.map
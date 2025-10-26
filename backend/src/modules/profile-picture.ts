import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadProfilePictureSchema = z.object({
  imageData: z.string(), // Base64 image data
});

export const profilePictureRouter = Router();

// Upload profile picture
profilePictureRouter.post(
  '/picture',
  requireAuth,
  async (request: any, reply) => {
    const userId = request.userId;

    try {
      const { imageData } = uploadProfilePictureSchema.parse(request.body);

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageData, {
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
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return reply.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo de profil',
      });
    }
  }
);

// Delete profile picture
profilePictureRouter.delete(
  '/picture',
  requireAuth,
  async (request: any, reply) => {
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
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
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
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return reply.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la photo de profil',
      });
    }
  }
);

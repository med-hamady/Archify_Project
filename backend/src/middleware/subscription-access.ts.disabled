import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper function to check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<{
  hasSubscription: boolean;
  subscriptionType?: 'VIDEOS_ONLY' | 'DOCUMENTS_ONLY' | 'FULL_ACCESS';
}> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endAt: { gt: new Date() }
    },
    include: {
      plan: true
    }
  });

  if (!subscription) {
    return { hasSubscription: false };
  }

  return {
    hasSubscription: true,
    subscriptionType: subscription.plan.type
  };
}

/**
 * Check if user has access to video content
 * With PREMIUM subscription, user has access to all content
 */
export async function canAccessVideo(userId: string, lessonId?: string): Promise<boolean> {
  const { hasSubscription, subscriptionType } = await hasActiveSubscription(userId);

  if (!hasSubscription) {
    return false;
  }

  // FULL_ACCESS or VIDEOS_ONLY subscription grants access to all videos
  if (subscriptionType === 'FULL_ACCESS' || subscriptionType === 'VIDEOS_ONLY') {
    return true;
  }

  return false;
}

/**
 * Check if user has access to document content
 * With PREMIUM subscription, user has access to all content
 */
export async function canAccessDocument(userId: string, lessonId?: string): Promise<boolean> {
  const { hasSubscription, subscriptionType } = await hasActiveSubscription(userId);

  if (!hasSubscription) {
    return false;
  }

  // FULL_ACCESS or DOCUMENTS_ONLY subscription grants access to all documents
  if (subscriptionType === 'FULL_ACCESS' || subscriptionType === 'DOCUMENTS_ONLY') {
    return true;
  }

  return false;
}

/**
 * Middleware to check if user has access to specific lesson
 * ALL VIDEO LESSONS NOW REQUIRE SUBSCRIPTION (except for admins)
 */
export async function checkLessonAccess(req: any, res: Response, next: NextFunction) {
  try {
    // If user is admin, allow access
    if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
      return next();
    }

    // Get lesson ID from params or query
    const lessonId = req.params.lessonId || req.query.lessonId;

    if (!lessonId) {
      return res.status(400).json({
        error: { code: 'MISSING_LESSON_ID', message: 'Lesson ID is required' }
      });
    }

    // Get lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { isPremium: true }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Lesson not found' }
      });
    }

    // Check user authentication
    if (!req.userId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    // Check subscription based on lesson type
    let hasAccess = false;

    // ALL VIDEO LESSONS REQUIRE SUBSCRIPTION
    if (lesson.type === 'VIDEO') {
      hasAccess = await canAccessVideo(req.userId, lessonId);
    } else if (lesson.type === 'PDF' || lesson.type === 'EXAM') {
      // Documents only require subscription if marked as premium
      if (lesson.requiresDocumentSubscription || lesson.isPremium) {
        hasAccess = await canAccessDocument(req.userId, lessonId);
      } else {
        hasAccess = true; // Free documents
      }
    } else {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Active subscription required to access this content',
          lessonType: lesson.type
        }
      });
    }

    next();
  } catch (err: any) {
    console.error('Error checking lesson access:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal error' }
    });
  }
}

/**
 * Middleware to check video access for direct video file requests
 * ALL VIDEOS NOW REQUIRE SUBSCRIPTION (except for admins)
 */
export async function checkVideoFileAccess(req: any, res: Response, next: NextFunction) {
  try {
    console.log('🔐 ===== CHECKING VIDEO ACCESS =====');
    console.log('  Filename:', req.params.filename);
    console.log('  User ID:', req.userId);
    console.log('  User Role:', req.userRole);

    // If user is admin, allow access
    if (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN') {
      console.log('✅ ACCESS GRANTED - User is ADMIN');
      return next();
    }

    const filename = req.params.filename;

    if (!filename) {
      console.log('❌ ACCESS DENIED - No filename provided');
      return res.status(400).json({
        error: { code: 'MISSING_FILENAME', message: 'Filename is required' }
      });
    }

    // Check if user is authenticated
    if (!req.userId) {
      console.log('❌ ACCESS DENIED - User not authenticated');
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to access this video' }
      });
    }

    // ALL VIDEOS REQUIRE SUBSCRIPTION - Check if user has video access
    console.log('  Checking subscription for user:', req.userId);
    const hasAccess = await canAccessVideo(req.userId);
    console.log('  Has Access Result:', hasAccess);

    if (!hasAccess) {
      console.log('❌ ACCESS DENIED - No active video subscription');
      return res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Active video subscription required to access this content'
        }
      });
    }

    console.log('✅ ACCESS GRANTED - User has active subscription');
    next();
  } catch (err: any) {
    console.error('❌ Error checking video file access:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal error' }
    });
  }
}

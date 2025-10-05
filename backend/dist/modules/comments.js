"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
exports.commentsRouter = (0, express_1.Router)();
// Schemas
const commentCreateSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000),
});
const commentUpdateSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000).optional(),
    status: zod_1.z.enum(['visible', 'hidden', 'reported']).optional(),
});
// GET /lessons/:id/comments - Get comments for a lesson
exports.commentsRouter.get('/lessons/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: {
                    lessonId: id,
                    status: 'visible'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit
            }),
            prisma.comment.count({
                where: {
                    lessonId: id,
                    status: 'visible'
                }
            })
        ]);
        res.json({
            comments: comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                status: comment.status,
                createdAt: comment.createdAt,
                user: comment.user,
                lessonId: comment.lessonId
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        console.error('Error fetching comments:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /lessons/:id/comments - Create a new comment
exports.commentsRouter.post('/lessons/:id/comments', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const body = commentCreateSchema.parse(req.body);
        // Verify lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            select: { id: true, title: true }
        });
        if (!lesson) {
            return res.status(404).json({ error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' } });
        }
        // Check if user has access to comment (basic check - user must be authenticated)
        const comment = await prisma.comment.create({
            data: {
                content: body.content,
                lessonId: id,
                userId: req.userId,
                status: 'visible'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });
        res.status(201).json({
            id: comment.id,
            content: comment.content,
            status: comment.status,
            createdAt: comment.createdAt,
            user: comment.user,
            lessonId: comment.lessonId
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error creating comment:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /comments/:id - Update a comment (Author or Admin only)
exports.commentsRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const body = commentUpdateSchema.parse(req.body);
        // Get the comment to check ownership
        const comment = await prisma.comment.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!comment) {
            return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
        }
        // Check if user is the author or an admin
        if (comment.userId !== req.userId && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Can only edit your own comments' } });
        }
        const updatedComment = await prisma.comment.update({
            where: { id },
            data: body,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });
        res.json({
            id: updatedComment.id,
            content: updatedComment.content,
            status: updatedComment.status,
            createdAt: updatedComment.createdAt,
            user: updatedComment.user,
            lessonId: updatedComment.lessonId
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        }
        console.error('Error updating comment:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// DELETE /comments/:id - Delete a comment (Author or Admin only)
exports.commentsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Get the comment to check ownership
        const comment = await prisma.comment.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!comment) {
            return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
        }
        // Check if user is the author or an admin
        if (comment.userId !== req.userId && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Can only delete your own comments' } });
        }
        await prisma.comment.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting comment:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// POST /comments/:id/report - Report a comment (Authenticated users)
exports.commentsRouter.post('/:id/report', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Get the comment
        const comment = await prisma.comment.findUnique({
            where: { id },
            select: { id: true, userId: true }
        });
        if (!comment) {
            return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
        }
        // Users cannot report their own comments
        if (comment.userId === req.userId) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot report your own comment' } });
        }
        // Update comment status to reported
        await prisma.comment.update({
            where: { id },
            data: { status: 'reported' }
        });
        res.json({ message: 'Comment reported successfully' });
    }
    catch (err) {
        console.error('Error reporting comment:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// GET /admin/comments - Get all comments for moderation (Admin only)
exports.commentsRouter.get('/admin/comments', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    try {
        const status = req.query.status;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.comment.count({ where })
        ]);
        res.json({
            comments: comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                status: comment.status,
                createdAt: comment.createdAt,
                user: comment.user,
                lesson: comment.lesson,
                course: comment.lesson.course
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        console.error('Error fetching comments for moderation:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
// PUT /admin/comments/:id/moderate - Moderate a comment (Admin only)
exports.commentsRouter.put('/admin/comments/:id/moderate', auth_1.requireAuth, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve', 'hide', 'delete'
        const comment = await prisma.comment.findUnique({
            where: { id }
        });
        if (!comment) {
            return res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' } });
        }
        let updateData = {};
        switch (action) {
            case 'approve':
                updateData.status = 'visible';
                break;
            case 'hide':
                updateData.status = 'hidden';
                break;
            case 'delete':
                await prisma.comment.delete({ where: { id } });
                return res.json({ message: 'Comment deleted successfully' });
            default:
                return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Invalid moderation action' } });
        }
        const updatedComment = await prisma.comment.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            id: updatedComment.id,
            content: updatedComment.content,
            status: updatedComment.status,
            createdAt: updatedComment.createdAt,
            user: updatedComment.user,
            lessonId: updatedComment.lessonId
        });
    }
    catch (err) {
        console.error('Error moderating comment:', err);
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
});
//# sourceMappingURL=comments.js.map
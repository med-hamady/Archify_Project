"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const upload_1 = require("../middleware/upload");
const auth_1 = require("./auth");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
exports.videoUploadRouter = (0, express_1.Router)();
// POST /api/video-upload/:id/video - Upload video for a lesson
exports.videoUploadRouter.post('/:id/video', auth_1.requireAuth, upload_1.videoUpload.single('video'), async (req, res) => {
    try {
        const { id: lessonId } = req.params;
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'NO_FILE',
                    message: 'No video file provided'
                }
            });
        }
        // Check if lesson exists and user has permission
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: true }
        });
        if (!lesson) {
            // Delete uploaded file if lesson doesn't exist
            (0, upload_1.deleteFile)(req.file.path);
            return res.status(404).json({
                error: {
                    code: 'LESSON_NOT_FOUND',
                    message: 'Lesson not found'
                }
            });
        }
        // Check if user is admin or course owner
        if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
            // Delete uploaded file if no permission
            (0, upload_1.deleteFile)(req.file.path);
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin access required'
                }
            });
        }
        // Delete old video if exists
        if (lesson.videoUrl) {
            const oldVideoPath = path_1.default.join(__dirname, '../../uploads', lesson.videoUrl);
            (0, upload_1.deleteFile)(oldVideoPath);
        }
        // Update lesson with new video info
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                videoUrl: (0, upload_1.getFileUrl)(req.file.path),
                videoSize: req.file.size,
                videoType: req.file.mimetype,
                uploadedAt: new Date(),
                type: 'VIDEO' // Ensure type is VIDEO
            }
        });
        return res.status(200).json({
            message: 'Video uploaded successfully',
            lesson: {
                id: updatedLesson.id,
                title: updatedLesson.title,
                videoUrl: updatedLesson.videoUrl,
                videoSize: updatedLesson.videoSize,
                videoType: updatedLesson.videoType,
                uploadedAt: updatedLesson.uploadedAt
            }
        });
    }
    catch (error) {
        console.error('Error uploading video:', error);
        // Delete uploaded file on error
        if (req.file) {
            (0, upload_1.deleteFile)(req.file.path);
        }
        return res.status(500).json({
            error: {
                code: 'UPLOAD_ERROR',
                message: 'Failed to upload video'
            }
        });
    }
});
// GET /api/video-upload/:id/video - Get video info for a lesson
exports.videoUploadRouter.get('/:id/video', async (req, res) => {
    try {
        const { id: lessonId } = req.params;
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                title: true,
                videoUrl: true,
                videoSize: true,
                videoType: true,
                uploadedAt: true,
                isPremium: true,
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!lesson) {
            return res.status(404).json({
                error: {
                    code: 'LESSON_NOT_FOUND',
                    message: 'Lesson not found'
                }
            });
        }
        if (!lesson.videoUrl) {
            return res.status(404).json({
                error: {
                    code: 'NO_VIDEO',
                    message: 'No video uploaded for this lesson'
                }
            });
        }
        return res.json({
            lesson: {
                id: lesson.id,
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                videoSize: lesson.videoSize,
                videoType: lesson.videoType,
                uploadedAt: lesson.uploadedAt,
                isPremium: lesson.isPremium,
                course: lesson.course
            }
        });
    }
    catch (error) {
        console.error('Error getting video info:', error);
        return res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to get video info'
            }
        });
    }
});
// DELETE /api/video-upload/:id/video - Delete video for a lesson
exports.videoUploadRouter.delete('/:id/video', auth_1.requireAuth, async (req, res) => {
    try {
        const { id: lessonId } = req.params;
        // Check if user is admin
        if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin access required'
                }
            });
        }
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true, videoUrl: true }
        });
        if (!lesson) {
            return res.status(404).json({
                error: {
                    code: 'LESSON_NOT_FOUND',
                    message: 'Lesson not found'
                }
            });
        }
        if (!lesson.videoUrl) {
            return res.status(404).json({
                error: {
                    code: 'NO_VIDEO',
                    message: 'No video to delete'
                }
            });
        }
        // Delete file from filesystem
        const videoPath = path_1.default.join(__dirname, '../../uploads', lesson.videoUrl);
        const fileDeleted = (0, upload_1.deleteFile)(videoPath);
        // Update database
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                videoUrl: null,
                videoSize: null,
                videoType: null,
                uploadedAt: null
            }
        });
        return res.json({
            message: 'Video deleted successfully',
            fileDeleted: fileDeleted
        });
    }
    catch (error) {
        console.error('Error deleting video:', error);
        return res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Failed to delete video'
            }
        });
    }
});
// GET /api/video-upload/stream/:filename - Stream video file
exports.videoUploadRouter.get('/stream/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const videoPath = path_1.default.join(__dirname, '../../uploads/videos', filename);
        // Check if file exists
        if (!fs_1.default.existsSync(videoPath)) {
            return res.status(404).json({
                error: {
                    code: 'FILE_NOT_FOUND',
                    message: 'Video file not found'
                }
            });
        }
        // Get file stats
        const stat = fs_1.default.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            // Handle range requests for video streaming
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs_1.default.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        }
        else {
            // Handle full file requests
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs_1.default.createReadStream(videoPath).pipe(res);
        }
    }
    catch (error) {
        console.error('Error streaming video:', error);
        return res.status(500).json({
            error: {
                code: 'STREAM_ERROR',
                message: 'Failed to stream video'
            }
        });
    }
});
//# sourceMappingURL=video-upload.js.map
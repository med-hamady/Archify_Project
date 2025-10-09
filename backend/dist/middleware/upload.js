"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.fileUpload = exports.imageUpload = exports.pdfUpload = exports.videoUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directories exist
const uploadDirs = {
    videos: path_1.default.join(__dirname, '../../uploads/videos'),
    pdfs: path_1.default.join(__dirname, '../../uploads/pdfs'),
    images: path_1.default.join(__dirname, '../../uploads/images')
};
// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = uploadDirs.videos; // Default to videos
        if (file.fieldname === 'video') {
            uploadPath = uploadDirs.videos;
        }
        else if (file.fieldname === 'pdf') {
            uploadPath = uploadDirs.pdfs;
        }
        else if (file.fieldname === 'image') {
            uploadPath = uploadDirs.images;
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: lessonId_timestamp_originalname
        const lessonId = req.params.id || 'unknown';
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        const filename = `${lessonId}_${timestamp}${ext}`;
        cb(null, filename);
    }
});
// File filter for video uploads
const videoFilter = (req, file, cb) => {
    const allowedMimes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid video format. Allowed formats: MP4, WebM, OGG, AVI, MOV, WMV, FLV'));
    }
};
// File filter for PDF uploads
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid PDF format. Only PDF files are allowed.'));
    }
};
// File filter for image uploads
const imageFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP'));
    }
};
// Configure multer instances
exports.videoUpload = (0, multer_1.default)({
    storage: storage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit for videos
        files: 1
    }
});
exports.pdfUpload = (0, multer_1.default)({
    storage: storage,
    fileFilter: pdfFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for PDFs
        files: 1
    }
});
exports.imageUpload = (0, multer_1.default)({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for images
        files: 1
    }
});
// Generic upload for any file type
exports.fileUpload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1
    }
});
// Helper function to get file URL
const getFileUrl = (filePath) => {
    const relativePath = filePath.replace(/\\/g, '/');
    return `/uploads/${relativePath.split('uploads/')[1]}`;
};
exports.getFileUrl = getFileUrl;
// Helper function to delete file
const deleteFile = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=upload.js.map
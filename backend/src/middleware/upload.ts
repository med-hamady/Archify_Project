import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = {
  videos: path.join(__dirname, '../../uploads/videos'),
  pdfs: path.join(__dirname, '../../uploads/pdfs'),
  images: path.join(__dirname, '../../uploads/images')
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.videos; // Default to videos
    
    if (file.fieldname === 'video') {
      uploadPath = uploadDirs.videos;
    } else if (file.fieldname === 'pdf') {
      uploadPath = uploadDirs.pdfs;
    } else if (file.fieldname === 'image') {
      uploadPath = uploadDirs.images;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: lessonId_timestamp_originalname
    const lessonId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${lessonId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for video uploads
const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  } else {
    cb(new Error('Invalid video format. Allowed formats: MP4, WebM, OGG, AVI, MOV, WMV, FLV'));
  }
};

// File filter for PDF uploads
const pdfFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid PDF format. Only PDF files are allowed.'));
  }
};

// File filter for image uploads
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP'));
  }
};

// Configure multer instances
export const videoUpload = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    files: 1
  }
});

export const pdfUpload = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for PDFs
    files: 1
  }
});

export const imageUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
    files: 1
  }
});

// Generic upload for any file type
export const fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
});

// Helper function to get file URL
export const getFileUrl = (filePath: string): string => {
  const relativePath = filePath.replace(/\\/g, '/');
  return `/uploads/${relativePath.split('uploads/')[1]}`;
};

// Helper function to delete file
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// utils/upload.js
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import s3 from '../config/s3.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Document formats
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    
    // Text formats
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
    'text/xml',
    'text/css',
    'text/javascript',
    'text/typescript',
    
    // Code files
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
    'application/x-python-code',
    'application/x-php',
    'application/x-java-source',
    'application/x-csharp',
    'application/x-c++src',
    'application/x-csrc',
    'application/x-ruby',
    'application/x-perl',
    'application/x-shell',
    'application/x-yaml',
    'application/yaml',
    
    // Image formats
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/ico',
    'image/heic',
    'image/heif',
    
    // Audio formats
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/m4a',
    'audio/wma',
    'audio/webm',
    
    // Video formats
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/3gp',
    
    // Archive formats
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
    
    // Other formats
    'application/epub+zip',
    'application/x-sqlite3',
    'application/octet-stream'
  ];
  
  // Enhanced file type checking with extension fallback
  const isAllowedMimeType = allowedTypes.includes(file.mimetype);
  const hasNoMimeType = !file.mimetype || file.mimetype === '';
  
  // Check file extension for files without proper MIME type
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const allowedExtensions = [
    // Text and code extensions
    'txt', 'md', 'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'cs', 'rb', 'php', 
    'go', 'rs', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bat', 'yml', 'yaml', 'json', 
    'xml', 'html', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'dart', 'lua', 'pl', 
    'ps1', 'psm1', 'dockerfile', 'makefile', 'cmake', 'gradle', 'toml', 'ini', 'cfg', 
    'conf', 'log', 'gitignore', 'gitattributes', 'editorconfig',
    
    // Document extensions
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp',
    
    // Image extensions
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif',
    
    // Audio extensions
    'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma',
    
    // Video extensions
    'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', '3gp',
    
    // Archive extensions
    'zip', 'rar', 'tar', 'gz', '7z',
    
    // Other extensions
    'epub', 'db', 'sqlite', 'sqlite3'
  ];
  
  const isAllowedExtension = allowedExtensions.includes(fileExtension);
  
  // Allow file if MIME type is allowed, or if extension is allowed, or if no MIME type is set
  if (isAllowedMimeType || isAllowedExtension || hasNoMimeType) {
    console.log(`✅ File accepted: ${file.originalname} (${file.mimetype || 'unknown MIME type'})`);
    cb(null, true);
  } else {
    console.log(`❌ File rejected: ${file.originalname} (${file.mimetype}) - extension: ${fileExtension}`);
    cb(new Error(`Unsupported file type: ${file.mimetype || 'unknown'} (.${fileExtension})`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 350 * 1024 * 1024, // 350MB limit (increased for large video files)
    files: 20 // Allow up to 20 files
  }
});

export const uploadToS3 = async (file, folder = 'uploads') => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${uuidv4()}-${file.originalname}`, // Categorize uploads by folder
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    return data;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error('Failed to upload file to S3.');
  }
};
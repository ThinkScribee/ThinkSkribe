import s3 from '../config/s3.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 🚀 S3 FILE STORAGE UTILITY - BULLETPROOF FILE HANDLING

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'edusage-ai-files';

export const uploadFileToS3 = async (filePath, originalName, mimeType) => {
  try {
    console.log('📤 Uploading to S3:', { filePath, originalName, mimeType });
    
    // Generate unique filename using crypto
    const fileExtension = path.extname(originalName);
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const uniqueFileName = `ai-files/${Date.now()}-${uniqueId}${fileExtension}`;
    
    // Read file
    const fileContent = fs.readFileSync(filePath);
    
    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileContent,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256'
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    console.log('✅ File uploaded to S3:', result.Location);
    
    // Return file metadata for MongoDB
    return {
      id: crypto.randomBytes(8).toString('hex'),
      name: originalName,
      type: mimeType,
      size: fileContent.length,
      s3Key: uniqueFileName,
      s3Location: result.Location,
      uploadedAt: new Date()
    };
    
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

export const getFileFromS3 = async (s3Key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    const result = await s3.getObject(params).promise();
    return result;
  } catch (error) {
    console.error('❌ S3 download error:', error);
    throw new Error(`Failed to get file from S3: ${error.message}`);
  }
};

export const deleteFileFromS3 = async (s3Key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    await s3.deleteObject(params).promise();
    console.log('🗑️ File deleted from S3:', s3Key);
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

export const generateSignedUrl = async (s3Key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn
    };
    
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('❌ S3 signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Utility to clean up local files after S3 upload
export const cleanupLocalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🧹 Local file cleaned up:', filePath);
    }
  } catch (error) {
    console.warn('⚠️ Local file cleanup warning:', error.message);
  }
};

export default {
  uploadFileToS3,
  getFileFromS3,
  deleteFileFromS3,
  generateSignedUrl,
  cleanupLocalFile
};
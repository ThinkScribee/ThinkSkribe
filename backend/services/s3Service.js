import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ==========================================
// S3 SERVICE FOR FILE UPLOADS
// ==========================================

class S3Service {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      signatureVersion: 'v4'
    });

    this.bucketName = process.env.S3_BUCKET_NAME;
    this.urlExpirationTime = 300; // 5 minutes for upload URLs
    this.maxFileSize = 10 * 1024 * 1024; // 10MB max file size

    if (!this.bucketName) {
      console.warn('S3_BUCKET_NAME not configured. File uploads will not work.');
    }
  }

  /**
   * Generate presigned URL for file upload
   * @param {string} userId - User ID for organizing files
   * @param {string} filename - Original filename
   * @param {string} filetype - MIME type
   * @returns {Promise<Object>} Upload URL and file URL
   */
  async generateUploadUrl(userId, filename, filetype) {
    try {
      // Validate inputs
      if (!userId || !filename || !filetype) {
        throw new Error('User ID, filename, and filetype are required');
      }

      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // Generate unique S3 key
      const fileExtension = path.extname(sanitizedFilename);
      const uniqueId = uuidv4();
      const s3Key = `ai-chat/${userId}/${Date.now()}-${uniqueId}${fileExtension}`;

      // Generate presigned URL for upload
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: filetype,
        Expires: this.urlExpirationTime,
        Conditions: [
          ['content-length-range', 0, this.maxFileSize]
        ]
      };

      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', uploadParams);
      
      // Generate the final file URL
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

      return {
        uploadUrl,
        fileUrl,
        s3Key,
        expiresIn: this.urlExpirationTime
      };

    } catch (error) {
      console.error('S3 upload URL generation error:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for file download
   * @param {string} s3Key - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds
   * @returns {Promise<string>} Download URL
   */
  async generateDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const downloadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      const downloadUrl = await this.s3.getSignedUrlPromise('getObject', downloadParams);
      return downloadUrl;

    } catch (error) {
      console.error('S3 download URL generation error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(s3Key) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      await this.s3.deleteObject(deleteParams).promise();
      console.log(`File deleted from S3: ${s3Key}`);
      return true;

    } catch (error) {
      console.error('S3 file deletion error:', error);
      return false;
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} File exists
   */
  async fileExists(s3Key) {
    try {
      const headParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      await this.s3.headObject(headParams).promise();
      return true;

    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      console.error('S3 file existence check error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(s3Key) {
    try {
      const headParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      const metadata = await this.s3.headObject(headParams).promise();
      
      return {
        size: metadata.ContentLength,
        contentType: metadata.ContentType,
        lastModified: metadata.LastModified,
        etag: metadata.ETag,
        metadata: metadata.Metadata
      };

    } catch (error) {
      console.error('S3 metadata retrieval error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Copy file within S3
   * @param {string} sourceKey - Source S3 key
   * @param {string} destinationKey - Destination S3 key
   * @returns {Promise<boolean>} Success status
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const copyParams = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey
      };

      await this.s3.copyObject(copyParams).promise();
      console.log(`File copied: ${sourceKey} -> ${destinationKey}`);
      return true;

    } catch (error) {
      console.error('S3 file copy error:', error);
      return false;
    }
  }

  /**
   * List files for a user
   * @param {string} userId - User ID
   * @param {Object} options - Listing options
   * @returns {Promise<Array>} List of files
   */
  async listUserFiles(userId, options = {}) {
    try {
      const { maxKeys = 100, continuationToken } = options;
      
      const listParams = {
        Bucket: this.bucketName,
        Prefix: `ai-chat/${userId}/`,
        MaxKeys: maxKeys
      };

      if (continuationToken) {
        listParams.ContinuationToken = continuationToken;
      }

      const response = await this.s3.listObjectsV2(listParams).promise();
      
      const files = response.Contents.map(object => ({
        key: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag,
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${object.Key}`
      }));

      return {
        files,
        isTruncated: response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken
      };

    } catch (error) {
      console.error('S3 file listing error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Clean up old files for a user
   * @param {string} userId - User ID
   * @param {number} daysOld - Files older than this many days
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupOldFiles(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { files } = await this.listUserFiles(userId, { maxKeys: 1000 });
      
      const oldFiles = files.filter(file => file.lastModified < cutoffDate);
      
      if (oldFiles.length === 0) {
        return 0;
      }

      // Delete old files in batches
      const deletePromises = oldFiles.map(file => this.deleteFile(file.key));
      await Promise.all(deletePromises);

      console.log(`Cleaned up ${oldFiles.length} old files for user ${userId}`);
      return oldFiles.length;

    } catch (error) {
      console.error('S3 cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get storage usage for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Storage usage info
   */
  async getUserStorageUsage(userId) {
    try {
      const { files } = await this.listUserFiles(userId, { maxKeys: 1000 });
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileCount = files.length;

      return {
        totalSize,
        fileCount,
        readableSize: this.formatFileSize(totalSize)
      };

    } catch (error) {
      console.error('Storage usage calculation error:', error);
      throw new Error(`Failed to calculate storage usage: ${error.message}`);
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Sanitize filename for S3
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    // Remove or replace invalid characters
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
      .substring(0, 100); // Limit length
  }

  /**
   * Format file size to human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate file type
   * @param {string} filetype - MIME type
   * @returns {boolean} Is valid type
   */
  isValidFileType(filetype) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/quicktime'
    ];

    return allowedTypes.includes(filetype);
  }

  /**
   * Get file type category
   * @param {string} filetype - MIME type
   * @returns {string} File category
   */
  getFileCategory(filetype) {
    if (filetype.startsWith('image/')) return 'image';
    if (filetype.startsWith('audio/')) return 'audio';
    if (filetype.startsWith('video/')) return 'video';
    if (filetype.includes('pdf')) return 'document';
    if (filetype.includes('word') || filetype.includes('text')) return 'document';
    return 'other';
  }

  /**
   * Health check for S3 service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Try to list objects to verify connection
      await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        MaxKeys: 1
      }).promise();

      return {
        status: 'healthy',
        bucket: this.bucketName,
        region: process.env.AWS_REGION || 'us-east-1'
      };

    } catch (error) {
      console.error('S3 health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default new S3Service(); 
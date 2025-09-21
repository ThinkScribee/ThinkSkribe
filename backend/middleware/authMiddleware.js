import jwt from 'jsonwebtoken';
import axios from 'axios';

// ==========================================
// AUTHENTICATION MIDDLEWARE
// Validates auth tokens from parent application
// ==========================================

/**
 * Authentication middleware for AI chat routes
 * Validates the auth token and extracts user information
 * 
 * This middleware expects the parent application to provide:
 * - Authorization header with Bearer token
 * - JWT token containing user information
 * 
 * The middleware will attach user info to req.user for use in routes
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format'
      });
    }

    // Verify token based on parent app authentication system
    let decoded;
    
    try {
      // Option 1: JWT verification (if parent app uses JWT)
      if (process.env.PARENT_APP_JWT_SECRET) {
        decoded = jwt.verify(token, process.env.PARENT_APP_JWT_SECRET);
      } 
      // Option 2: Custom token validation (implement based on parent app)
      else if (process.env.PARENT_APP_AUTH_URL) {
        // For token validation via API call to parent app
        decoded = await validateTokenWithParentApp(token);
      }
      // Option 3: Simple token validation (for development/testing)
      else {
        // Basic validation - in production, replace with proper validation
        decoded = validateSimpleToken(token);
      }
      
    } catch (jwtError) {
      console.error('Token verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Extract user information from decoded token
    if (!decoded.userId && !decoded.id && !decoded.sub) {
      return res.status(401).json({
        success: false,
        error: 'Token missing user identification'
      });
    }

    // Attach user info to request object
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      tokenData: decoded
    };

    // Log user activity (optional)
    console.log(`AI Chat access by user: ${req.user.id} - ${req.method} ${req.path}`);

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Validate token with parent application API
 * @param {string} token - Auth token to validate
 * @returns {Promise<Object>} Decoded user data
 */
async function validateTokenWithParentApp(token) {
  
  try {
    const response = await axios.post(
      process.env.PARENT_APP_AUTH_URL + '/validate',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    if (response.data.success && response.data.user) {
      return response.data.user;
    } else {
      throw new Error('Token validation failed');
    }

  } catch (error) {
    console.error('Parent app token validation error:', error.message);
    throw new Error('Token validation failed');
  }
}

/**
 * Simple token validation for development/testing
 * @param {string} token - Auth token to validate
 * @returns {Object} Decoded user data
 */
function validateSimpleToken(token) {
  // This is a simple implementation for development
  // In production, replace with proper token validation
  
  try {
    // Check if token is base64 encoded JSON (simple case)
    if (token.startsWith('eyJ')) {
      // Looks like JWT, try to decode without verification (UNSAFE for production)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
      }
    }
    
    // Check if token is in our simple format: userId:timestamp:signature
    const parts = token.split(':');
    if (parts.length >= 2) {
      const userId = parts[0];
      const timestamp = parseInt(parts[1]);
      
      // Check if token is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - timestamp > maxAge) {
        throw new Error('Token expired');
      }
      
      return {
        userId,
        id: userId,
        tokenTimestamp: timestamp,
        role: 'user'
      };
    }
    
    // Fallback: treat token as user ID for development
    if (token && token.length > 0) {
      console.warn('Using token as direct user ID - NOT SECURE FOR PRODUCTION');
      return {
        userId: token,
        id: token,
        role: 'user',
        development: true
      };
    }
    
    throw new Error('Invalid token format');
    
  } catch (error) {
    throw new Error(`Simple token validation failed: ${error.message}`);
  }
}

/**
 * Optional: Role-based access control middleware
 * @param {string|Array} allowedRoles - Roles that can access the route
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Optional: Permission-based access control middleware
 * @param {string} requiredPermission - Permission required to access route
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: `Permission required: ${requiredPermission}`
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for AI chat
 * @param {string} type - Type of rate limit (e.g., 'aiChat', 'fileUpload')
 * @param {number} windowMs - Time window in seconds
 * @param {number} maxRequests - Maximum requests per window
 * @returns {Function} Middleware function
 */
const rateLimitMiddleware = (type, windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(); // Skip rate limiting if no user
    }

    const key = `${type}:${userId}`;
    const now = Date.now();
    const windowStart = now - (windowMs * 1000);

    // Get user's request history
    let userRequests = requests.get(key) || [];
    
    // Filter out old requests
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded limit
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userRequests[0] - windowStart) / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [k, timestamps] of requests.entries()) {
        const filtered = timestamps.filter(ts => ts > windowStart);
        if (filtered.length === 0) {
          requests.delete(k);
        } else {
          requests.set(k, filtered);
        }
      }
    }

    next();
  };
};

export {
  authMiddleware,
  requireRole,
  requirePermission,
  rateLimitMiddleware
}; 
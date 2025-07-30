const rateLimit = require('express-rate-limit');
const database = require('../config/database');

// Enhanced rate limiting for admin endpoints
const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs for admin endpoints
    message: {
        error: 'Too many admin requests from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60) // minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to include user ID if authenticated
    keyGenerator: (req) => {
        return req.user ? `${req.ip}-${req.user.id}` : req.ip;
    },
    // Skip successful requests for authenticated users
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
    // Custom handler for rate limit exceeded
    handler: async (req, res) => {
        // Log rate limit violation
        try {
            await database.run(
                'INSERT INTO security_logs (event_type, event_data, user_id, user_agent, ip_address, url) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    'rate_limit_exceeded',
                    JSON.stringify({
                        limit: 200,
                        windowMs: 15 * 60 * 1000,
                        endpoint: req.originalUrl
                    }),
                    req.user?.id || null,
                    req.get('User-Agent'),
                    req.ip,
                    req.originalUrl
                ]
            );
        } catch (error) {
            console.error('Error logging rate limit violation:', error);
        }

        res.status(429).json({
            error: 'Too many admin requests from this IP, please try again later.',
            retryAfter: Math.ceil(15 * 60 / 60)
        });
    }
});

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        error: 'Too many login attempts from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: async (req, res) => {
        // Log failed login attempts
        try {
            await database.run(
                'INSERT INTO security_logs (event_type, event_data, user_agent, ip_address, url) VALUES (?, ?, ?, ?, ?)',
                [
                    'auth_rate_limit_exceeded',
                    JSON.stringify({
                        limit: 10,
                        windowMs: 15 * 60 * 1000,
                        endpoint: req.originalUrl,
                        email: req.body?.email || 'unknown'
                    }),
                    req.get('User-Agent'),
                    req.ip,
                    req.originalUrl
                ]
            );
        } catch (error) {
            console.error('Error logging auth rate limit violation:', error);
        }

        res.status(429).json({
            error: 'Too many login attempts from this IP, please try again later.',
            retryAfter: Math.ceil(15 * 60 / 60)
        });
    }
});

// File upload rate limiting
const uploadRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 file uploads per minute
    message: {
        error: 'Too many file uploads from this IP, please try again later.',
        retryAfter: 1
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
        try {
            await database.run(
                'INSERT INTO security_logs (event_type, event_data, user_id, user_agent, ip_address, url) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    'upload_rate_limit_exceeded',
                    JSON.stringify({
                        limit: 10,
                        windowMs: 60 * 1000,
                        endpoint: req.originalUrl
                    }),
                    req.user?.id || null,
                    req.get('User-Agent'),
                    req.ip,
                    req.originalUrl
                ]
            );
        } catch (error) {
            console.error('Error logging upload rate limit violation:', error);
        }

        res.status(429).json({
            error: 'Too many file uploads from this IP, please try again later.',
            retryAfter: 1
        });
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Additional security headers for admin panel
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Prevent caching of sensitive admin data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    next();
};

// Request logging middleware for admin actions
const logAdminAction = async (req, res, next) => {
    // Only log state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after response is sent
            setImmediate(async () => {
                try {
                    const success = res.statusCode >= 200 && res.statusCode < 300;
                    
                    await database.run(
                        'INSERT INTO security_logs (event_type, event_data, user_id, user_agent, ip_address, url) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            'admin_action',
                            JSON.stringify({
                                method: req.method,
                                endpoint: req.originalUrl,
                                success: success,
                                statusCode: res.statusCode,
                                body: req.body ? Object.keys(req.body) : [],
                                files: req.files ? Object.keys(req.files) : []
                            }),
                            req.user?.id || null,
                            req.get('User-Agent'),
                            req.ip,
                            req.originalUrl
                        ]
                    );
                } catch (error) {
                    console.error('Error logging admin action:', error);
                }
            });
            
            originalSend.call(this, data);
        };
    }
    
    next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize string inputs to prevent XSS
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .trim();
    };
    
    // Recursively sanitize object properties
    const sanitizeObject = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };
    
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    next();
};

// File upload security validation
const validateFileUpload = (req, res, next) => {
    if (!req.files && !req.file) {
        return next();
    }
    
    const files = req.files ? Object.values(req.files).flat() : [req.file];
    
    for (const file of files) {
        if (!file) continue;
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return res.status(413).json({
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
            });
        }
        
        // Check filename for security
        const filename = file.originalname;
        if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
            return res.status(400).json({
                error: 'Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed.'
            });
        }
        
        // Check for double extensions
        if ((filename.match(/\./g) || []).length > 1) {
            return res.status(400).json({
                error: 'Invalid filename. Multiple extensions are not allowed.'
            });
        }
    }
    
    next();
};

module.exports = {
    adminRateLimit,
    authRateLimit,
    uploadRateLimit,
    securityHeaders,
    logAdminAction,
    sanitizeInput,
    validateFileUpload
};

/**
 * Security Configuration for Admin Panel
 * This file contains security settings and utilities for the admin interface
 */

class SecurityConfig {
    constructor() {
        this.config = {
            // Session settings
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            sessionWarning: 5 * 60 * 1000,  // 5 minutes before expiry
            
            // File upload settings
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedImageTypes: [
                'image/jpeg',
                'image/png', 
                'image/gif',
                'image/webp'
            ],
            allowedDocumentTypes: [
                'application/pdf',
                'text/plain',
                'text/csv'
            ],
            
            // Rate limiting
            rateLimitWindow: 60000, // 1 minute
            maxRequestsPerWindow: 100,
            
            // Password requirements
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumbers: true,
            passwordRequireSpecialChars: true,
            
            // Security headers
            contentSecurityPolicy: {
                'default-src': "'self'",
                'script-src': "'self' 'unsafe-inline'",
                'style-src': "'self' 'unsafe-inline'",
                'img-src': "'self' data: https:",
                'font-src': "'self'",
                'connect-src': "'self'",
                'frame-ancestors': "'none'",
                'base-uri': "'self'",
                'form-action': "'self'"
            },
            
            // Trusted domains for external resources
            trustedDomains: [
                'fonts.googleapis.com',
                'fonts.gstatic.com',
                'cdnjs.cloudflare.com'
            ],
            
            // Security monitoring
            enableSecurityLogging: true,
            logSecurityEvents: [
                'login_attempt',
                'login_success',
                'login_failure',
                'logout',
                'session_expired',
                'csrf_violation',
                'rate_limit_exceeded',
                'file_upload_blocked',
                'suspicious_activity',
                'csp_violation'
            ]
        };
    }
    
    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < this.config.passwordMinLength) {
            errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
        }
        
        if (this.config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (this.config.passwordRequireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (this.config.passwordRequireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (this.config.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return errors;
    }
    
    // Generate secure random string
    generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomArray = new Uint8Array(length);
        crypto.getRandomValues(randomArray);
        
        for (let i = 0; i < length; i++) {
            result += chars[randomArray[i] % chars.length];
        }
        
        return result;
    }
    
    // Sanitize HTML content
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    // Validate URL
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }
    
    // Check if domain is trusted
    isTrustedDomain(url) {
        try {
            const urlObj = new URL(url);
            return this.config.trustedDomains.includes(urlObj.hostname);
        } catch {
            return false;
        }
    }
    
    // Generate Content Security Policy header
    generateCSPHeader() {
        const directives = [];
        
        for (const [directive, value] of Object.entries(this.config.contentSecurityPolicy)) {
            directives.push(`${directive} ${value}`);
        }
        
        return directives.join('; ');
    }
    
    // Validate file upload
    validateFileUpload(file, allowedTypes = null) {
        const errors = [];
        const types = allowedTypes || this.config.allowedImageTypes;
        
        // Check file size
        if (file.size > this.config.maxFileSize) {
            errors.push(`File size exceeds ${this.config.maxFileSize / (1024 * 1024)}MB limit`);
        }
        
        // Check file type
        if (!types.includes(file.type)) {
            errors.push(`File type ${file.type} is not allowed`);
        }
        
        // Check file name
        const fileName = file.name;
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
            errors.push('File name contains invalid characters');
        }
        
        // Check for executable extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        
        if (dangerousExtensions.includes(fileExtension)) {
            errors.push('File type is not allowed for security reasons');
        }
        
        return errors;
    }
    
    // Create security headers for fetch requests
    getSecurityHeaders(includeCSRF = false, csrfToken = null) {
        const headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
        
        if (includeCSRF && csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        
        return headers;
    }
    
    // Log security event
    logSecurityEvent(eventType, details = {}) {
        if (!this.config.enableSecurityLogging) return;
        if (!this.config.logSecurityEvents.includes(eventType)) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: this.generateSecureToken(16)
        };
        
        // Send to server (implement server-side logging endpoint)
        fetch('/admin/api/security-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logEntry)
        }).catch(() => {
            // Fail silently to not interrupt user experience
        });
        
        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.log('Security Event:', logEntry);
        }
    }
    
    // Get configuration value
    get(key) {
        return this.config[key];
    }
    
    // Set configuration value
    set(key, value) {
        this.config[key] = value;
    }
}

// Export for use in admin panel
window.SecurityConfig = SecurityConfig;

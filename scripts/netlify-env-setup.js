#!/usr/bin/env node

/**
 * 🚀 Netlify Environment Variables Setup Script
 * 
 * This script helps you configure environment variables for your Netlify deployment.
 * Run this script to get the exact environment variables you need to set in Netlify.
 */

require('dotenv').config();
const crypto = require('crypto');

console.log('🔧 NETLIFY ENVIRONMENT VARIABLES CONFIGURATION');
console.log('=' .repeat(60));
console.log();

console.log('📋 COPY THESE ENVIRONMENT VARIABLES TO NETLIFY:');
console.log('   Go to: Netlify Dashboard → Site Settings → Environment Variables');
console.log();

// Required environment variables
const envVars = {
    // Core Configuration
    NODE_ENV: 'production',
    
    // JWT Secret (generate new one for production)
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    
    // Admin Credentials
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'linhhalinh5@gmail.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
    
    // Security
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '12',
    
    // Rate Limiting
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '15',
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    
    // File Upload
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880',
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp',
    
    // Database Configuration (Production optimized)
    DATABASE_TIMEOUT: '10000',
    DATABASE_RETRY_ATTEMPTS: '5',
    DATABASE_RETRY_DELAY: '2000',
    DATABASE_WAL_MODE: 'false',
    DATABASE_CACHE_SIZE: '4000',
    DATABASE_TEMP_STORE: 'MEMORY',
    DATABASE_SYNCHRONOUS: 'NORMAL',
    DATABASE_JOURNAL_MODE: 'MEMORY',
    DATABASE_FOREIGN_KEYS: 'true',
    DATABASE_SECURE_DELETE: 'true',
    DATABASE_INTEGRITY_CHECK: 'false',
    DATABASE_LOG_QUERIES: 'false',
    DATABASE_LOG_SLOW_QUERIES: '2000',
    DATABASE_ENABLE_METRICS: 'true'
};

// Optional environment variables
const optionalEnvVars = {
    // CORS (if you need specific origins)
    // CORS_ORIGIN: 'https://your-domain.com,https://another-domain.com',
    
    // Email Configuration (for newsletter functionality)
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || ''
};

console.log('🔴 REQUIRED ENVIRONMENT VARIABLES:');
console.log('-'.repeat(40));
Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
});

console.log();
console.log('🟡 OPTIONAL ENVIRONMENT VARIABLES:');
console.log('-'.repeat(40));
Object.entries(optionalEnvVars).forEach(([key, value]) => {
    if (value) {
        console.log(`${key}=${value}`);
    } else {
        console.log(`# ${key}=your-value-here`);
    }
});

console.log();
console.log('⚠️  SECURITY NOTES:');
console.log('   • Change ADMIN_PASSWORD from default value');
console.log('   • JWT_SECRET should be unique and secure');
console.log('   • Never commit these values to version control');
console.log('   • Use strong passwords in production');

console.log();
console.log('🚀 DEPLOYMENT STEPS:');
console.log('   1. Copy the environment variables above');
console.log('   2. Go to Netlify Dashboard → Your Site → Site Settings');
console.log('   3. Click "Environment Variables" in the sidebar');
console.log('   4. Add each variable using "Add a variable" button');
console.log('   5. Deploy your site after adding all variables');

console.log();
console.log('🔍 DEBUGGING:');
console.log('   • Check Netlify Function logs for detailed error messages');
console.log('   • Test API endpoints: /api/health, /api/auth/login');
console.log('   • Verify database initialization in function logs');

console.log();
console.log('✅ Ready to deploy! Make sure all variables are set in Netlify.');

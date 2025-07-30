#!/usr/bin/env node

/**
 * 🔍 Database Debug Script
 * 
 * This script helps debug database connection and initialization issues
 * that might cause 500 errors in the Netlify deployment.
 */

require('dotenv').config();
const database = require('../config/database');
const bcrypt = require('bcryptjs');

async function debugDatabase() {
    console.log('🔍 DATABASE DEBUGGING SCRIPT');
    console.log('=' .repeat(50));
    console.log();

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('-'.repeat(30));
    
    const requiredVars = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'NODE_ENV'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '[HIDDEN]' : value}`);
        } else {
            console.log(`❌ ${varName}: NOT SET`);
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        console.log();
        console.log('⚠️  Missing required environment variables:', missingVars.join(', '));
        console.log('   These must be set in Netlify Dashboard → Environment Variables');
    }

    console.log();
    console.log('🗄️  Database Configuration:');
    console.log('-'.repeat(30));
    console.log(`Database Path: ${database.dbPath}`);
    console.log(`Node Environment: ${process.env.NODE_ENV}`);
    console.log(`Timeout: ${database.config.timeout}ms`);
    console.log(`Retry Attempts: ${database.config.retryAttempts}`);
    console.log(`Journal Mode: ${database.config.journalMode}`);

    console.log();
    console.log('🔌 Testing Database Connection...');
    console.log('-'.repeat(30));

    try {
        // Test database connection
        await database.connect();
        console.log('✅ Database connection successful');

        // Test table creation
        await database.createTables();
        console.log('✅ Database tables created/verified');

        // Test admin user creation
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        console.log();
        console.log('👤 Testing Admin User Setup...');
        console.log('-'.repeat(30));

        // Check if admin exists
        const existingAdmin = await database.get(
            'SELECT id, email, name, role FROM admin_users WHERE email = ?',
            [adminEmail]
        );

        if (existingAdmin) {
            console.log('✅ Admin user exists:', {
                id: existingAdmin.id,
                email: existingAdmin.email,
                name: existingAdmin.name,
                role: existingAdmin.role
            });

            // Test password verification
            const adminWithPassword = await database.get(
                'SELECT password_hash FROM admin_users WHERE email = ?',
                [adminEmail]
            );

            const passwordValid = await bcrypt.compare(adminPassword, adminWithPassword.password_hash);
            console.log(`${passwordValid ? '✅' : '❌'} Password verification: ${passwordValid ? 'VALID' : 'INVALID'}`);
        } else {
            console.log('⚠️  Admin user does not exist, creating...');
            
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
            
            const result = await database.run(
                'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                [adminEmail, passwordHash, 'Administrator', 'admin']
            );
            
            console.log('✅ Admin user created with ID:', result.id);
        }

        console.log();
        console.log('📊 Database Statistics:');
        console.log('-'.repeat(30));
        
        // Get table counts
        const tables = ['admin_users', 'web_applications', 'site_content'];
        for (const table of tables) {
            try {
                const count = await database.get(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`${table}: ${count.count} records`);
            } catch (error) {
                console.log(`${table}: Error - ${error.message}`);
            }
        }

        console.log();
        console.log('🎉 Database debugging completed successfully!');
        console.log();
        console.log('🚀 Next Steps:');
        console.log('   1. If running locally: Database is working correctly');
        console.log('   2. If testing for Netlify: Ensure all environment variables are set');
        console.log('   3. Deploy to Netlify and check function logs');

    } catch (error) {
        console.error();
        console.error('❌ Database debugging failed:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        console.log();
        console.log('🔧 Troubleshooting Tips:');
        console.log('   • Check if /tmp directory is writable (Netlify functions)');
        console.log('   • Verify all environment variables are set');
        console.log('   • Check database path permissions');
        console.log('   • Review function logs in Netlify dashboard');
        
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Run if called directly
if (require.main === module) {
    debugDatabase().catch(console.error);
}

module.exports = debugDatabase;

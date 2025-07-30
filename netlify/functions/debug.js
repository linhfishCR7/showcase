// Debug function for Netlify environment
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const debug = {
        timestamp: new Date().toISOString(),
        environment: {},
        system: {},
        filesystem: {},
        modules: {},
        database: {}
    };

    try {
        // Environment variables (safe ones only)
        debug.environment = {
            NODE_ENV: process.env.NODE_ENV,
            hasJWT_SECRET: !!process.env.JWT_SECRET,
            hasADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
            hasADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
            ADMIN_EMAIL: process.env.ADMIN_EMAIL, // Safe to show
            DATABASE_TIMEOUT: process.env.DATABASE_TIMEOUT,
            DATABASE_JOURNAL_MODE: process.env.DATABASE_JOURNAL_MODE
        };

        // System info
        debug.system = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            cwd: process.cwd(),
            tmpdir: require('os').tmpdir()
        };

        // Filesystem checks
        debug.filesystem = {
            tmpExists: false,
            tmpWritable: false,
            tmpPermissions: null,
            dbPath: process.env.NODE_ENV === 'production' ? '/tmp/webapps_hub.db' : './database/webapps_hub.db'
        };

        // Check /tmp directory
        try {
            const tmpStats = fs.statSync('/tmp');
            debug.filesystem.tmpExists = tmpStats.isDirectory();
            debug.filesystem.tmpPermissions = tmpStats.mode.toString(8);
        } catch (error) {
            debug.filesystem.tmpError = error.message;
        }

        // Test write to /tmp
        try {
            const testFile = '/tmp/test-write.txt';
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            debug.filesystem.tmpWritable = true;
        } catch (error) {
            debug.filesystem.tmpWritable = false;
            debug.filesystem.tmpWriteError = error.message;
        }

        // Module checks
        try {
            const sqlite3 = require('sqlite3');
            debug.modules.sqlite3 = {
                available: true,
                version: sqlite3.VERSION,
                verbose: typeof sqlite3.verbose === 'function'
            };
        } catch (error) {
            debug.modules.sqlite3 = {
                available: false,
                error: error.message
            };
        }

        // Database connection test
        try {
            const Database = require('../../config/database');
            const database = new Database();
            
            debug.database.configPath = database.dbPath;
            debug.database.config = database.config;
            
            // Try to connect
            await database.connect();
            debug.database.connectionSuccess = true;
            
            // Try to create tables
            await database.createTables();
            debug.database.tablesCreated = true;
            
            // Test a simple query
            const result = await database.get('SELECT 1 as test');
            debug.database.queryTest = result;
            
            await database.close();
            debug.database.closed = true;
            
        } catch (error) {
            debug.database.error = {
                message: error.message,
                code: error.code,
                errno: error.errno,
                stack: error.stack
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(debug, null, 2)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Debug function failed',
                message: error.message,
                stack: error.stack
            }, null, 2)
        };
    }
};

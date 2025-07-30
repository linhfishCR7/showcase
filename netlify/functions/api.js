const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import database and routes
const database = require('../../config/database');
const apiRoutes = require('../../routes/api');
const adminRoutes = require('../../routes/admin');
const authRoutes = require('../../routes/auth');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'])
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connection
let dbInitialized = false;
let dbInitializationError = null;

async function initializeDatabase() {
    if (!dbInitialized && !dbInitializationError) {
        try {
            console.log('=== DATABASE INITIALIZATION DEBUG ===');
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('Process platform:', process.platform);
            console.log('Process arch:', process.arch);

            // Check /tmp directory
            const fs = require('fs');
            const path = require('path');

            try {
                const tmpStats = fs.statSync('/tmp');
                console.log('/tmp directory exists:', tmpStats.isDirectory());
                console.log('/tmp permissions:', tmpStats.mode.toString(8));
            } catch (tmpError) {
                console.error('/tmp directory error:', tmpError.message);
            }

            // Check if we can write to /tmp
            const testFile = '/tmp/test-write.txt';
            try {
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log('/tmp directory is writable: YES');
            } catch (writeError) {
                console.error('/tmp directory is writable: NO -', writeError.message);
            }

            // Check sqlite3 module
            try {
                const sqlite3 = require('sqlite3');
                console.log('sqlite3 module loaded successfully');
                console.log('sqlite3 version:', sqlite3.VERSION);
            } catch (sqliteError) {
                console.error('sqlite3 module error:', sqliteError.message);
                throw new Error(`SQLite3 module not available: ${sqliteError.message}`);
            }

            const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/webapps_hub.db' : './database/webapps_hub.db';
            console.log('Database path will be:', dbPath);

            console.log('Attempting database connection...');
            await database.connect();
            console.log('Database connected successfully');

            console.log('Creating tables...');
            await database.createTables();
            console.log('Tables created successfully');

            // Create admin user if it doesn't exist
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

            if (!adminEmail || !adminPassword) {
                throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
            }

            // Check if admin exists
            const existingAdmin = await database.get(
                'SELECT id FROM admin_users WHERE email = ?',
                [adminEmail]
            );

            if (!existingAdmin) {
                const bcrypt = require('bcryptjs');
                const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
                const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

                await database.run(
                    'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                    [adminEmail, passwordHash, 'Administrator', 'admin']
                );
                console.log('Admin user created successfully');
            }

            dbInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('=== DATABASE INITIALIZATION FAILED ===');
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error errno:', error.errno);
            console.error('Error stack:', error.stack);

            // Additional debugging for common issues
            if (error.message.includes('SQLITE_CANTOPEN')) {
                console.error('DIAGNOSIS: Cannot open database file - check permissions');
            } else if (error.message.includes('no such file or directory')) {
                console.error('DIAGNOSIS: Directory does not exist - check path');
            } else if (error.message.includes('Module not found')) {
                console.error('DIAGNOSIS: Missing dependency - check package.json');
            } else if (error.message.includes('Permission denied')) {
                console.error('DIAGNOSIS: Permission denied - check directory permissions');
            }

            dbInitializationError = error;
            throw error; // Re-throw to prevent function from continuing
        }
    } else if (dbInitializationError) {
        throw dbInitializationError; // Re-throw previous error
    }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Debug endpoint that doesn't require database
app.get('/api/debug', (req, res) => {
    const fs = require('fs');
    const diagnostics = {
        timestamp: new Date().toISOString(),
        version: '2.0', // To verify deployment
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            hasJWT_SECRET: !!process.env.JWT_SECRET,
            hasADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
            hasADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
            ADMIN_EMAIL: process.env.ADMIN_EMAIL, // Safe to show
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        },
        filesystem: {},
        sqlite3: {}
    };

    // Test /tmp directory
    try {
        const tmpStats = fs.statSync('/tmp');
        diagnostics.filesystem = {
            tmpExists: tmpStats.isDirectory(),
            tmpPermissions: tmpStats.mode.toString(8),
            tmpWritable: false
        };

        // Test write
        const testFile = '/tmp/test-write.txt';
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        diagnostics.filesystem.tmpWritable = true;
    } catch (fsError) {
        diagnostics.filesystem = {
            tmpExists: false,
            tmpWritable: false,
            error: fsError.message
        };
    }

    // Test SQLite3
    try {
        const sqlite3 = require('sqlite3');
        diagnostics.sqlite3 = {
            available: true,
            version: sqlite3.VERSION
        };
    } catch (sqliteError) {
        diagnostics.sqlite3 = {
            available: false,
            error: sqliteError.message
        };
    }

    res.json(diagnostics);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
    }
    
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database before handling requests
const handler = async (event, context) => {
    try {
        await initializeDatabase();
        return serverlessHandler(event, context);
    } catch (error) {
        console.error('Function initialization failed:', error);
        // Create detailed diagnostic information
        const diagnostics = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                code: error.code,
                errno: error.errno
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                hasJWT_SECRET: !!process.env.JWT_SECRET,
                hasADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
                hasADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
            }
        };

        // Add filesystem diagnostics
        try {
            const fs = require('fs');
            const tmpStats = fs.statSync('/tmp');
            diagnostics.filesystem = {
                tmpExists: tmpStats.isDirectory(),
                tmpPermissions: tmpStats.mode.toString(8)
            };

            // Test write
            const testFile = '/tmp/test-write.txt';
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            diagnostics.filesystem.tmpWritable = true;
        } catch (fsError) {
            diagnostics.filesystem = {
                tmpExists: false,
                tmpWritable: false,
                error: fsError.message
            };
        }

        // Add SQLite diagnostics
        try {
            const sqlite3 = require('sqlite3');
            diagnostics.sqlite3 = {
                available: true,
                version: sqlite3.VERSION
            };
        } catch (sqliteError) {
            diagnostics.sqlite3 = {
                available: false,
                error: sqliteError.message
            };
        }

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Database initialization failed',
                diagnostics: diagnostics
            }, null, 2)
        };
    }
};

const serverlessHandler = serverless(app);

module.exports.handler = handler;

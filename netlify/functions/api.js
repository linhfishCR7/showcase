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
            console.log('Initializing database...');
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('Database path will be:', process.env.NODE_ENV === 'production' ? '/tmp/webapps_hub.db' : './database/webapps_hub.db');

            await database.connect();
            await database.createTables();

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
            console.error('Database initialization failed:', error);
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
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

const serverlessHandler = serverless(app);

module.exports.handler = handler;

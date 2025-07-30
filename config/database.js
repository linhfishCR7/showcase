const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.isClosing = false;

        // Database path configuration
        this.dbName = process.env.DATABASE_NAME || 'webapps_hub.db';
        this._dbPath = null; // Lazy initialization

        // Performance and configuration settings
        this.config = {
            timeout: parseInt(process.env.DATABASE_TIMEOUT) || 10000,
            retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS) || 3,
            retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY) || 1000,
            walMode: process.env.DATABASE_WAL_MODE === 'true',
            cacheSize: parseInt(process.env.DATABASE_CACHE_SIZE) || 4000,
            tempStore: process.env.DATABASE_TEMP_STORE || 'DEFAULT',
            synchronous: process.env.DATABASE_SYNCHRONOUS || 'NORMAL',
            journalMode: process.env.DATABASE_JOURNAL_MODE || (process.env.NODE_ENV === 'production' ? 'MEMORY' : 'DELETE'),
            foreignKeys: process.env.DATABASE_FOREIGN_KEYS !== 'false',
            secureDelete: process.env.DATABASE_SECURE_DELETE === 'true',
            integrityCheck: process.env.DATABASE_INTEGRITY_CHECK === 'true',
            logQueries: process.env.DATABASE_LOG_QUERIES === 'true',
            logSlowQueries: parseInt(process.env.DATABASE_LOG_SLOW_QUERIES) || 1000,
            enableMetrics: process.env.DATABASE_ENABLE_METRICS === 'true'
        };

        // Metrics tracking
        this.metrics = {
            connectionCount: 0,
            queryCount: 0,
            totalQueryTime: 0,
            slowQueries: 0
        };
    }

    // Lazy getter for database path
    get dbPath() {
        if (!this._dbPath) {
            this._dbPath = this.getDatabasePath();
        }
        return this._dbPath;
    }

    getDatabasePath() {
        // Debug environment
        console.log('getDatabasePath - NODE_ENV:', process.env.NODE_ENV);
        console.log('getDatabasePath - DATABASE_PATH:', process.env.DATABASE_PATH);
        console.log('getDatabasePath - dbName:', this.dbName);
        console.log('getDatabasePath - cwd:', process.cwd());
        console.log('getDatabasePath - platform:', process.platform);

        // Use explicit DATABASE_PATH if provided
        if (process.env.DATABASE_PATH) {
            console.log('Using explicit DATABASE_PATH:', process.env.DATABASE_PATH);
            return process.env.DATABASE_PATH;
        }

        // Force production path for serverless environments
        // Check if we're in a serverless environment (Netlify, Vercel, etc.)
        const isServerless = process.env.NODE_ENV === 'production' ||
                            process.env.NETLIFY ||
                            process.env.VERCEL ||
                            process.cwd().includes('/tmp') ||
                            process.cwd().includes('lambda') ||
                            process.cwd().includes('/var/task') ||  // Netlify
                            process.cwd().includes('/var/runtime'); // AWS Lambda

        const path = isServerless
            ? `/tmp/${this.dbName}`
            : `./database/${this.dbName}`;

        console.log('Auto-configured database path:', path);
        console.log('Is serverless environment:', isServerless);
        return path;
    }

    async connect() {
        return this.connectWithRetry();
    }

    async connectWithRetry() {
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.connectOnce();
                await this.configureDatabase();
                if (this.config.integrityCheck) {
                    await this.checkIntegrity();
                }
                this.metrics.connectionCount++;
                return;
            } catch (error) {
                console.warn(`Database connection attempt ${attempt} failed:`, error.message);
                if (attempt === this.config.retryAttempts) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            }
        }
    }

    async connectOnce() {
        return new Promise((resolve, reject) => {
            // Debug database path
            console.log('Database path:', this.dbPath);
            console.log('Database directory:', path.dirname(this.dbPath));
            console.log('NODE_ENV:', process.env.NODE_ENV);

            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');

            // For /tmp, we don't need to create the directory
            if (dbDir !== '/tmp' && !fs.existsSync(dbDir)) {
                console.log('Creating directory:', dbDir);
                fs.mkdirSync(dbDir, { recursive: true });
            } else {
                console.log('Directory exists or is /tmp:', dbDir);
            }

            const timeout = setTimeout(() => {
                reject(new Error(`Database connection timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                clearTimeout(timeout);
                if (err) {
                    console.error('Error connecting to SQLite database:', err);
                    this.isConnected = false;
                    reject(err);
                } else {
                    console.log(`Connected to SQLite database: ${this.dbPath}`);
                    this.isConnected = true;
                    this.isClosing = false;
                    resolve();
                }
            });
        });
    }

    async configureDatabase() {
        const pragmas = [
            `PRAGMA foreign_keys = ${this.config.foreignKeys ? 'ON' : 'OFF'}`,
            `PRAGMA cache_size = -${this.config.cacheSize}`,
            `PRAGMA temp_store = ${this.config.tempStore}`,
            `PRAGMA synchronous = ${this.config.synchronous}`,
            `PRAGMA journal_mode = ${this.config.journalMode}`,
            `PRAGMA secure_delete = ${this.config.secureDelete ? 'ON' : 'OFF'}`
        ];

        if (this.config.walMode && this.config.journalMode === 'WAL') {
            pragmas.push('PRAGMA wal_autocheckpoint = 1000');
        }

        for (const pragma of pragmas) {
            await this.run(pragma);
        }

        if (this.config.logQueries) {
            console.log('Database configured with pragmas:', pragmas);
        }
    }

    async checkIntegrity() {
        try {
            const result = await this.get('PRAGMA integrity_check');
            if (result && result.integrity_check !== 'ok') {
                console.warn('Database integrity check failed:', result);
            } else if (this.config.logQueries) {
                console.log('Database integrity check passed');
            }
        } catch (error) {
            console.warn('Database integrity check error:', error.message);
        }
    }

    async createTables() {
        const tables = [
            // Applications table
            `CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                description TEXT NOT NULL,
                long_description TEXT,
                category TEXT NOT NULL,
                tags TEXT,
                logo_url TEXT,
                screenshot_url TEXT,
                app_url TEXT NOT NULL,
                install_url TEXT,
                features TEXT,
                status TEXT DEFAULT 'active',
                launch_count INTEGER DEFAULT 0,
                install_count INTEGER DEFAULT 0,
                rating REAL DEFAULT 0,
                rating_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Testimonials table
            `CREATE TABLE IF NOT EXISTS testimonials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                avatar_url TEXT,
                rating INTEGER DEFAULT 5,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Contact messages table
            `CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'unread',
                replied_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Newsletter subscribers table
            `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                unsubscribed_at DATETIME
            )`,

            // Site content table (for CMS)
            `CREATE TABLE IF NOT EXISTS site_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                section TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Analytics table
            `CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                event_data TEXT,
                user_agent TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // App reviews table
            `CREATE TABLE IF NOT EXISTS app_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                app_id INTEGER NOT NULL,
                reviewer_name TEXT NOT NULL,
                reviewer_email TEXT,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (app_id) REFERENCES applications (id) ON DELETE CASCADE
            )`,

            // File uploads table
            `CREATE TABLE IF NOT EXISTS file_uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_name TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                uploaded_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES admin_users (id)
            )`,

            // Security logs table
            `CREATE TABLE IF NOT EXISTS security_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                event_data TEXT,
                user_id INTEGER,
                user_agent TEXT,
                ip_address TEXT,
                url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admin_users (id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        console.log('Database tables created successfully');
    }

    // Promisify database operations with logging and metrics
    run(sql, params = []) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                const duration = Date.now() - startTime;

                if (err) {
                    console.error(`[DB ERROR] ${sql}:`, err.message);
                    reject(err);
                } else {
                    // Log query if enabled
                    if (this.config && this.config.logQueries) {
                        console.log(`[DB] ${sql}`, params);
                    }

                    // Track metrics
                    if (this.metrics) {
                        this.metrics.queryCount++;
                        this.metrics.totalQueryTime += duration;

                        // Log slow queries
                        if (duration > this.config.logSlowQueries) {
                            console.warn(`[DB SLOW] ${duration}ms: ${sql}`);
                            this.metrics.slowQueries++;
                        }
                    }

                    resolve({ id: this.lastID, changes: this.changes });
                }
            }.bind(this));
        });
    }

    get(sql, params = []) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                const duration = Date.now() - startTime;

                if (err) {
                    console.error(`[DB ERROR] ${sql}:`, err.message);
                    reject(err);
                } else {
                    // Log query if enabled
                    if (this.config.logQueries) {
                        console.log(`[DB] ${sql}`, params);
                    }

                    // Track metrics
                    this.metrics.queryCount++;
                    this.metrics.totalQueryTime += duration;

                    // Log slow queries
                    if (duration > this.config.logSlowQueries) {
                        console.warn(`[DB SLOW] ${duration}ms: ${sql}`);
                        this.metrics.slowQueries++;
                    }

                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                const duration = Date.now() - startTime;

                if (err) {
                    console.error(`[DB ERROR] ${sql}:`, err.message);
                    reject(err);
                } else {
                    // Log query if enabled
                    if (this.config.logQueries) {
                        console.log(`[DB] ${sql}`, params, `(${rows ? rows.length : 0} rows)`);
                    }

                    // Track metrics
                    this.metrics.queryCount++;
                    this.metrics.totalQueryTime += duration;

                    // Log slow queries
                    if (duration > this.config.logSlowQueries) {
                        console.warn(`[DB SLOW] ${duration}ms: ${sql} (${rows ? rows.length : 0} rows)`);
                        this.metrics.slowQueries++;
                    }

                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            // Check if database is already closed or in the process of closing
            if (!this.db || !this.isConnected || this.isClosing) {
                console.log('Database connection already closed or closing');
                resolve();
                return;
            }

            this.isClosing = true;
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                    this.isClosing = false;
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    this.isConnected = false;
                    this.isClosing = false;
                    this.db = null;
                    resolve();
                }
            });
        });
    }

    // Helper method to check if database is ready for operations
    isReady() {
        return this.db && this.isConnected && !this.isClosing;
    }

    // Helper method to safely close database with error handling
    async safeClose() {
        if (!this.isReady()) {
            console.log('Database is not ready or already closed');
            return;
        }

        // Log metrics before closing
        if (this.config.enableMetrics) {
            this.logMetrics();
        }

        try {
            await this.close();
        } catch (error) {
            console.warn('Warning during database close:', error.message);
        }
    }

    // Collect and log database performance metrics
    logMetrics() {
        const avgQueryTime = this.metrics.queryCount > 0
            ? (this.metrics.totalQueryTime / this.metrics.queryCount).toFixed(2)
            : 0;

        console.log('[DB METRICS]', {
            connections: this.metrics.connectionCount,
            totalQueries: this.metrics.queryCount,
            avgQueryTime: `${avgQueryTime}ms`,
            slowQueries: this.metrics.slowQueries,
            totalQueryTime: `${this.metrics.totalQueryTime}ms`
        });
    }

    // Get current database metrics
    getMetrics() {
        return {
            ...this.metrics,
            avgQueryTime: this.metrics.queryCount > 0
                ? this.metrics.totalQueryTime / this.metrics.queryCount
                : 0
        };
    }

    // Reset metrics (useful for testing)
    resetMetrics() {
        this.metrics = {
            connectionCount: 0,
            queryCount: 0,
            totalQueryTime: 0,
            slowQueries: 0
        };
    }
}

module.exports = new Database();

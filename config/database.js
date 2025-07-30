const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.isClosing = false;
        // Use /tmp directory for Netlify serverless functions
        this.dbPath = process.env.NODE_ENV === 'production'
            ? '/tmp/webapps_hub.db'
            : (process.env.DATABASE_PATH || './database/webapps_hub.db');
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to SQLite database:', err);
                    this.isConnected = false;
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.isConnected = true;
                    this.isClosing = false;
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
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
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        console.log('Database tables created successfully');
    }

    // Promisify database operations
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
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

        try {
            await this.close();
        } catch (error) {
            console.warn('Warning during database close:', error.message);
        }
    }
}

module.exports = new Database();

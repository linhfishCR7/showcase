const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const database = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { uploadRateLimit, validateFileUpload } = require('../middleware/admin-security');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Generate secure filename
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '').substring(0, 50);
        cb(null, `${uniqueSuffix}-${safeName}${ext}`);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 2 // Maximum 2 files per request
    }
});

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Apply authentication to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// CSRF token endpoint
router.get('/csrf-token', (req, res) => {
    try {
        const token = generateCSRFToken();
        const userId = req.user.id;

        // Store token with expiry (30 minutes)
        csrfTokens.set(`${userId}-${token}`, {
            userId: userId,
            expires: Date.now() + (30 * 60 * 1000)
        });

        // Clean up expired tokens
        for (const [key, value] of csrfTokens.entries()) {
            if (value.expires < Date.now()) {
                csrfTokens.delete(key);
            }
        }

        res.json({ token });
    } catch (error) {
        console.error('CSRF token generation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CSRF validation middleware
const validateCSRF = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'] || req.body._csrf;

        if (!token) {
            return res.status(403).json({ error: 'CSRF token required' });
        }

        const tokenKey = `${req.user.id}-${token}`;
        const tokenData = csrfTokens.get(tokenKey);

        if (!tokenData || tokenData.expires < Date.now() || tokenData.userId !== req.user.id) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        // Token is valid, continue
        next();
    } else {
        // GET requests don't need CSRF validation
        next();
    }
};

// Apply CSRF validation to state-changing operations
router.use(validateCSRF);

// Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            database.get('SELECT COUNT(*) as count FROM applications'),
            database.get('SELECT COUNT(*) as count FROM applications WHERE status = "active"'),
            database.get('SELECT COUNT(*) as count FROM contact_messages WHERE status = "unread"'),
            database.get('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = "active"'),
            database.get('SELECT COUNT(*) as count FROM testimonials WHERE status = "active"'),
            database.get('SELECT SUM(launch_count) as total FROM applications'),
            database.get('SELECT SUM(install_count) as total FROM applications'),
            database.get('SELECT COUNT(*) as count FROM analytics WHERE event_type = "app_launch" AND created_at >= date("now", "-30 days")'),
        ]);

        res.json({
            totalApps: stats[0].count,
            activeApps: stats[1].count,
            unreadMessages: stats[2].count,
            newsletterSubscribers: stats[3].count,
            activeTestimonials: stats[4].count,
            totalLaunches: stats[5].total || 0,
            totalInstalls: stats[6].total || 0,
            launchesThisMonth: stats[7].count
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Applications management
router.get('/applications', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'inactive', 'all'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM applications';
        let countSql = 'SELECT COUNT(*) as total FROM applications';
        let params = [];

        if (status !== 'all') {
            sql += ' WHERE status = ?';
            countSql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [applications, totalResult] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, status !== 'all' ? [status] : [])
        ]);

        // Parse JSON fields
        const formattedApps = applications.map(app => ({
            ...app,
            features: app.features ? JSON.parse(app.features) : [],
            tags: app.tags ? app.tags.split(',').map(tag => tag.trim()) : []
        }));

        res.json({
            applications: formattedApps,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single application
router.get('/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const application = await database.get(
            'SELECT * FROM applications WHERE id = ?',
            [id]
        );

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Parse JSON fields
        const formattedApp = {
            ...application,
            features: application.features ? JSON.parse(application.features) : [],
            tags: application.tags ? application.tags.split(',').map(tag => tag.trim()) : []
        };

        res.json({ application: formattedApp });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create application
router.post('/applications', uploadRateLimit, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
]), validateFileUpload, [
    body('name').isLength({ min: 2 }).trim(),
    body('short_name').isLength({ min: 2 }).trim(),
    body('description').isLength({ min: 10 }).trim(),
    body('category').isLength({ min: 2 }).trim(),
    body('app_url').isURL(),
    body('features').optional().isString(), // Will be parsed as JSON
    body('tags').optional().isString(),
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name, short_name, description, long_description, category,
            tags, app_url, install_url, features, status = 'active'
        } = req.body;

        // Handle file uploads
        let logo_url = req.body.logo_url || null;
        let screenshot_url = req.body.screenshot_url || null;

        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                logo_url = `/uploads/${req.files.logo[0].filename}`;
            }
            if (req.files.screenshot && req.files.screenshot[0]) {
                screenshot_url = `/uploads/${req.files.screenshot[0].filename}`;
            }
        }

        // Parse features if it's a string
        let parsedFeatures = [];
        if (features) {
            try {
                parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
            } catch (e) {
                parsedFeatures = [];
            }
        }

        const result = await database.run(
            `INSERT INTO applications
            (name, short_name, description, long_description, category, tags, logo_url, screenshot_url, app_url, install_url, features, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, short_name, description, long_description, category,
                tags, logo_url, screenshot_url, app_url, install_url,
                JSON.stringify(parsedFeatures), status
            ]
        );

        res.status(201).json({
            message: 'Application created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update application
router.put('/applications/:id', uploadRateLimit, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
]), validateFileUpload, [
    body('name').optional().isLength({ min: 2 }).trim(),
    body('short_name').optional().isLength({ min: 2 }).trim(),
    body('description').optional().isLength({ min: 10 }).trim(),
    body('category').optional().isLength({ min: 2 }).trim(),
    body('app_url').optional().isURL(),
    body('features').optional().isString(), // Will be parsed as JSON
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateFields = [];
        const updateValues = [];

        // Handle file uploads first
        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                updateFields.push('logo_url = ?');
                updateValues.push(`/uploads/${req.files.logo[0].filename}`);
            }
            if (req.files.screenshot && req.files.screenshot[0]) {
                updateFields.push('screenshot_url = ?');
                updateValues.push(`/uploads/${req.files.screenshot[0].filename}`);
            }
        }

        // Build dynamic update query
        const allowedFields = [
            'name', 'short_name', 'description', 'long_description', 'category',
            'tags', 'app_url', 'install_url', 'status'
        ];

        // Handle URL fields only if not uploading files
        if (req.body.logo_url !== undefined && (!req.files || !req.files.logo)) {
            updateFields.push('logo_url = ?');
            updateValues.push(req.body.logo_url);
        }
        if (req.body.screenshot_url !== undefined && (!req.files || !req.files.screenshot)) {
            updateFields.push('screenshot_url = ?');
            updateValues.push(req.body.screenshot_url);
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (req.body.features !== undefined) {
            let parsedFeatures = [];
            try {
                parsedFeatures = typeof req.body.features === 'string' ? JSON.parse(req.body.features) : req.body.features;
            } catch (e) {
                parsedFeatures = [];
            }
            updateFields.push('features = ?');
            updateValues.push(JSON.stringify(parsedFeatures));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        const sql = `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = await database.run(sql, updateValues);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application updated successfully' });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete application
router.delete('/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.run(
            'DELETE FROM applications WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Testimonials management
router.get('/testimonials', async (req, res) => {
    try {
        const testimonials = await database.all(
            'SELECT * FROM testimonials ORDER BY created_at DESC'
        );

        res.json({ testimonials });
    } catch (error) {
        console.error('Get testimonials error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single testimonial
router.get('/testimonials/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const testimonial = await database.get(
            'SELECT * FROM testimonials WHERE id = ?',
            [id]
        );

        if (!testimonial) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        res.json({ testimonial });
    } catch (error) {
        console.error('Get testimonial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/testimonials', uploadRateLimit, upload.single('avatar'), validateFileUpload, [
    body('name').isLength({ min: 2 }).trim(),
    body('title').optional().isLength({ min: 2 }).trim(),
    body('content').isLength({ min: 10 }).trim(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, title, content, rating = 5, status = 'active' } = req.body;

        // Handle avatar upload
        let avatar_url = req.body.avatar_url || null;
        if (req.file) {
            avatar_url = `/uploads/${req.file.filename}`;
        }

        const result = await database.run(
            'INSERT INTO testimonials (name, title, content, avatar_url, rating, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, title, content, avatar_url, rating, status]
        );

        res.status(201).json({
            message: 'Testimonial created successfully',
            id: result.id
        });
    } catch (error) {
        console.error('Create testimonial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/testimonials/:id', uploadRateLimit, upload.single('avatar'), validateFileUpload, [
    body('name').optional().isLength({ min: 2 }).trim(),
    body('title').optional().isLength({ min: 2 }).trim(),
    body('content').optional().isLength({ min: 10 }).trim(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateFields = [];
        const updateValues = [];

        // Handle avatar upload
        if (req.file) {
            updateFields.push('avatar_url = ?');
            updateValues.push(`/uploads/${req.file.filename}`);
        }

        const allowedFields = ['name', 'title', 'content', 'rating', 'status'];

        // Handle avatar_url only if not uploading file
        if (req.body.avatar_url !== undefined && !req.file) {
            updateFields.push('avatar_url = ?');
            updateValues.push(req.body.avatar_url);
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        const sql = `UPDATE testimonials SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = await database.run(sql, updateValues);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        res.json({ message: 'Testimonial updated successfully' });
    } catch (error) {
        console.error('Update testimonial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/testimonials/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.run(
            'DELETE FROM testimonials WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error('Delete testimonial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contact messages management
router.get('/contact-messages', [
    query('status').optional().isIn(['read', 'unread', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM contact_messages';
        let countSql = 'SELECT COUNT(*) as total FROM contact_messages';
        let params = [];

        if (status !== 'all') {
            sql += ' WHERE status = ?';
            countSql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [messages, totalResult] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, status !== 'all' ? [status] : [])
        ]);

        res.json({
            messages,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update message status (frontend expects PUT /contact-messages/:id)
router.put('/contact-messages/:id', [
    body('status').isIn(['read', 'unread'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status } = req.body;

        const result = await database.run(
            'UPDATE contact_messages SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message status updated successfully' });
    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/contact-messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.run(
            'DELETE FROM contact_messages WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Newsletter subscribers management
router.get('/newsletter-subscribers', [
    query('status').optional().isIn(['active', 'inactive', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM newsletter_subscribers';
        let countSql = 'SELECT COUNT(*) as total FROM newsletter_subscribers';
        let params = [];

        if (status !== 'all') {
            sql += ' WHERE status = ?';
            countSql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [subscribers, totalResult] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, status !== 'all' ? [status] : [])
        ]);

        res.json({
            subscribers,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update newsletter subscriber status
router.put('/newsletter-subscribers/:id', [
    body('status').isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status } = req.body;

        const result = await database.run(
            'UPDATE newsletter_subscribers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        res.json({ message: 'Subscriber status updated successfully' });
    } catch (error) {
        console.error('Update subscriber status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete newsletter subscriber
router.delete('/newsletter-subscribers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.run(
            'DELETE FROM newsletter_subscribers WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        res.json({ message: 'Subscriber deleted successfully' });
    } catch (error) {
        console.error('Delete subscriber error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Site content management
router.get('/site-content', async (req, res) => {
    try {
        const content = await database.all(
            'SELECT * FROM site_content ORDER BY section'
        );

        res.json({ content });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific content section
router.get('/site-content/:section', async (req, res) => {
    try {
        const { section } = req.params;

        const content = await database.get(
            'SELECT * FROM site_content WHERE section = ?',
            [section]
        );

        if (!content) {
            return res.status(404).json({ error: 'Content section not found' });
        }

        res.json({
            content: {
                ...content,
                content: JSON.parse(content.content)
            }
        });
    } catch (error) {
        console.error('Get content section error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update content section (frontend expects POST /site-content)
router.post('/site-content', [
    body('section').isLength({ min: 1 }).trim(),
    body('content').isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { section, content } = req.body;

        await database.run(
            'INSERT OR REPLACE INTO site_content (section, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [section, JSON.stringify(content)]
        );

        res.json({ message: 'Content updated successfully' });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Analytics
router.get('/analytics', [
    query('event_type').optional().isString(),
    query('days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const eventType = req.query.event_type;
        const days = parseInt(req.query.days) || 30;

        let sql = 'SELECT * FROM analytics WHERE created_at >= date("now", "-' + days + ' days")';
        let params = [];

        if (eventType) {
            sql += ' AND event_type = ?';
            params.push(eventType);
        }

        sql += ' ORDER BY created_at DESC LIMIT 1000';

        const analytics = await database.all(sql, params);

        // Parse event_data
        const formattedAnalytics = analytics.map(item => ({
            ...item,
            event_data: item.event_data ? JSON.parse(item.event_data) : null
        }));

        res.json({ analytics: formattedAnalytics });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Security logging endpoint
router.post('/security-log', [
    body('timestamp').isISO8601(),
    body('event').isLength({ min: 1 }).trim(),
    body('details').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { timestamp, event, details, userAgent, url } = req.body;

        // Log security event to database
        await database.run(
            'INSERT INTO security_logs (event_type, event_data, user_id, user_agent, ip_address, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                event,
                JSON.stringify(details || {}),
                req.user.id,
                userAgent || req.get('User-Agent'),
                req.ip,
                url || req.originalUrl,
                timestamp
            ]
        );

        // Also log to analytics for tracking
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'security_event',
                JSON.stringify({
                    securityEvent: event,
                    details: details || {},
                    userId: req.user.id
                }),
                userAgent || req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Security event logged successfully' });
    } catch (error) {
        console.error('Security logging error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

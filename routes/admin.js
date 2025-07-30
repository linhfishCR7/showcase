const express = require('express');
const { body, validationResult, query } = require('express-validator');
const database = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

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

// Create application
router.post('/applications', [
    body('name').isLength({ min: 2 }).trim(),
    body('short_name').isLength({ min: 2 }).trim(),
    body('description').isLength({ min: 10 }).trim(),
    body('category').isLength({ min: 2 }).trim(),
    body('app_url').isURL(),
    body('features').isArray(),
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
            tags, logo_url, screenshot_url, app_url, install_url,
            features, status = 'active'
        } = req.body;

        const result = await database.run(
            `INSERT INTO applications 
            (name, short_name, description, long_description, category, tags, logo_url, screenshot_url, app_url, install_url, features, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, short_name, description, long_description, category,
                tags, logo_url, screenshot_url, app_url, install_url,
                JSON.stringify(features), status
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
router.put('/applications/:id', [
    body('name').optional().isLength({ min: 2 }).trim(),
    body('short_name').optional().isLength({ min: 2 }).trim(),
    body('description').optional().isLength({ min: 10 }).trim(),
    body('category').optional().isLength({ min: 2 }).trim(),
    body('app_url').optional().isURL(),
    body('features').optional().isArray(),
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

        // Build dynamic update query
        const allowedFields = [
            'name', 'short_name', 'description', 'long_description', 'category',
            'tags', 'logo_url', 'screenshot_url', 'app_url', 'install_url', 'status'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (req.body.features !== undefined) {
            updateFields.push('features = ?');
            updateValues.push(JSON.stringify(req.body.features));
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

router.post('/testimonials', [
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

        const { name, title, content, avatar_url, rating = 5, status = 'active' } = req.body;

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

router.put('/testimonials/:id', [
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

        const allowedFields = ['name', 'title', 'content', 'avatar_url', 'rating', 'status'];

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

router.put('/contact-messages/:id/status', [
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

// Site content management
router.get('/content', async (req, res) => {
    try {
        const content = await database.all(
            'SELECT * FROM site_content ORDER BY section'
        );

        const formattedContent = content.reduce((acc, item) => {
            acc[item.section] = JSON.parse(item.content);
            return acc;
        }, {});

        res.json({ content: formattedContent });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/content/:section', [
    body('content').isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { section } = req.params;
        const { content } = req.body;

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

module.exports = router;

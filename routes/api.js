const express = require('express');
const { body, validationResult, query } = require('express-validator');
const database = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all applications
router.get('/applications', [
    query('category').optional().isString(),
    query('search').optional().isString(),
    query('status').optional().isIn(['active', 'inactive', 'all'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { category, search, status = 'active' } = req.query;
        
        let sql = 'SELECT * FROM applications';
        let params = [];
        let conditions = [];

        if (status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }

        if (category) {
            conditions.push('category LIKE ?');
            params.push(`%${category}%`);
        }

        if (search) {
            conditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        const applications = await database.all(sql, params);

        // Parse JSON fields
        const formattedApps = applications.map(app => ({
            ...app,
            features: app.features ? JSON.parse(app.features) : [],
            tags: app.tags ? app.tags.split(',').map(tag => tag.trim()) : []
        }));

        res.json({ applications: formattedApps });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single application
router.get('/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await database.get(
            'SELECT * FROM applications WHERE id = ? AND status = "active"',
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

// Track app launch
router.post('/applications/:id/launch', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Update launch count
        await database.run(
            'UPDATE applications SET launch_count = launch_count + 1 WHERE id = ?',
            [id]
        );

        // Log analytics
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'app_launch',
                JSON.stringify({ appId: id }),
                req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Launch tracked successfully' });
    } catch (error) {
        console.error('Track launch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Track app install
router.post('/applications/:id/install', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Update install count
        await database.run(
            'UPDATE applications SET install_count = install_count + 1 WHERE id = ?',
            [id]
        );

        // Log analytics
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'app_install',
                JSON.stringify({ appId: id }),
                req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Install tracked successfully' });
    } catch (error) {
        console.error('Track install error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get testimonials
router.get('/testimonials', async (req, res) => {
    try {
        const testimonials = await database.all(
            'SELECT * FROM testimonials WHERE status = "active" ORDER BY created_at DESC'
        );

        res.json({ testimonials });
    } catch (error) {
        console.error('Get testimonials error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit contact form
router.post('/contact', [
    body('name').isLength({ min: 2 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('subject').isLength({ min: 5 }).trim(),
    body('message').isLength({ min: 10 }).trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        await database.run(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );

        // Log analytics
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'contact_form_submit',
                JSON.stringify({ email, subject }),
                req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Newsletter signup
router.post('/newsletter/subscribe', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        // Check if already subscribed
        const existing = await database.get(
            'SELECT * FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing) {
            if (existing.status === 'active') {
                return res.status(400).json({ error: 'Email already subscribed' });
            } else {
                // Reactivate subscription
                await database.run(
                    'UPDATE newsletter_subscribers SET status = "active", subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL WHERE email = ?',
                    [email]
                );
            }
        } else {
            // New subscription
            await database.run(
                'INSERT INTO newsletter_subscribers (email) VALUES (?)',
                [email]
            );
        }

        // Log analytics
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'newsletter_subscribe',
                JSON.stringify({ email }),
                req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
        console.error('Newsletter signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Newsletter unsubscribe
router.post('/newsletter/unsubscribe', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        await database.run(
            'UPDATE newsletter_subscribers SET status = "inactive", unsubscribed_at = CURRENT_TIMESTAMP WHERE email = ?',
            [email]
        );

        res.json({ message: 'Successfully unsubscribed from newsletter' });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get site content
router.get('/content/:section', async (req, res) => {
    try {
        const { section } = req.params;
        
        const content = await database.get(
            'SELECT content FROM site_content WHERE section = ?',
            [section]
        );

        if (!content) {
            return res.status(404).json({ error: 'Content section not found' });
        }

        res.json({ 
            section,
            content: JSON.parse(content.content)
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit app review
router.post('/applications/:id/reviews', [
    body('reviewer_name').isLength({ min: 2 }).trim(),
    body('reviewer_email').optional().isEmail().normalizeEmail(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review_text').optional().isLength({ max: 1000 }).trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { reviewer_name, reviewer_email, rating, review_text } = req.body;

        // Check if app exists
        const app = await database.get(
            'SELECT id FROM applications WHERE id = ? AND status = "active"',
            [id]
        );

        if (!app) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Insert review
        await database.run(
            'INSERT INTO app_reviews (app_id, reviewer_name, reviewer_email, rating, review_text) VALUES (?, ?, ?, ?, ?)',
            [id, reviewer_name, reviewer_email, rating, review_text]
        );

        // Update app rating
        const avgRating = await database.get(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM app_reviews WHERE app_id = ? AND status = "approved"',
            [id]
        );

        await database.run(
            'UPDATE applications SET rating = ?, rating_count = ? WHERE id = ?',
            [avgRating.avg_rating || 0, avgRating.count || 0, id]
        );

        res.json({ message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get app reviews
router.get('/applications/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        
        const reviews = await database.all(
            'SELECT reviewer_name, rating, review_text, created_at FROM app_reviews WHERE app_id = ? AND status = "approved" ORDER BY created_at DESC',
            [id]
        );

        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

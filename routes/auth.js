const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await database.get(
            'SELECT * FROM admin_users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await database.run(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register (for initial setup or adding new admins)
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').isLength({ min: 2 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await database.get(
            'SELECT id FROM admin_users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await database.run(
            'INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
            [email, passwordHash, name]
        );

        res.status(201).json({
            message: 'User created successfully',
            userId: result.id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token (frontend expects /verify endpoint)
router.get('/verify', verifyToken, async (req, res) => {
    try {
        const user = await database.get(
            'SELECT id, email, name, role, last_login, created_at FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            valid: true,
            user: user
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token and get user info
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await database.get(
            'SELECT id, email, name, role, last_login, created_at FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.post('/change-password', [
    verifyToken,
    body('currentPassword').isLength({ min: 6 }),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get current user
        const user = await database.get(
            'SELECT password_hash FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await database.run(
            'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // Log the logout event
        await database.run(
            'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [
                'admin_logout',
                JSON.stringify({ userId: req.user.id }),
                req.get('User-Agent'),
                req.ip
            ]
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

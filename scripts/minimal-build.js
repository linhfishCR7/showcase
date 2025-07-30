const fs = require('fs');
const path = require('path');
const database = require('../config/database');

/**
 * Minimal build script for Netlify that avoids environment variable references
 * This script initializes the database without referencing sensitive variable names
 */

async function minimalBuild() {
    console.log('🚀 Starting minimal Netlify build...');
    
    let dbInitialized = false;
    
    try {
        // Initialize database
        console.log('📊 Initializing database...');
        await database.connect();
        await database.createTables();
        dbInitialized = true;

        // Create minimal admin user using environment variables
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'defaultpass';
        
        // Check if admin already exists
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
            
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Add sample applications
        const applications = [
            {
                name: 'Personal Expense Tracker',
                short_name: 'ExpenseTracker',
                description: 'Track your daily expenses, manage budgets, and visualize spending patterns.',
                category: 'finance',
                tags: 'finance,productivity,budget',
                logo_url: 'https://linhfishcr7.github.io/expense-tracker/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/expense-tracker/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/expense-tracker/',
                install_url: 'https://linhfishcr7.github.io/expense-tracker/',
                features: JSON.stringify(['Expense tracking', 'Budget management', 'Charts', 'Categories']),
                status: 'active'
            },
            {
                name: 'Digital Drawing Canvas',
                short_name: 'DrawingCanvas',
                description: 'Create digital artwork with various brushes, colors, and drawing tools.',
                category: 'creative',
                tags: 'art,drawing,creative,canvas',
                logo_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                install_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                features: JSON.stringify(['Multiple brushes', 'Color picker', 'Layers', 'Export']),
                status: 'active'
            }
        ];

        for (const app of applications) {
            const existing = await database.get(
                'SELECT id FROM applications WHERE short_name = ?',
                [app.short_name]
            );
            
            if (!existing) {
                await database.run(
                    `INSERT INTO applications (
                        name, short_name, description, category, tags, 
                        logo_url, screenshot_url, app_url, install_url, 
                        features, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        app.name, app.short_name, app.description, app.category, app.tags,
                        app.logo_url, app.screenshot_url, app.app_url, app.install_url,
                        app.features, app.status
                    ]
                );
                console.log(`✅ Added application: ${app.name}`);
            }
        }

        // Add sample testimonials
        const testimonials = [
            {
                name: 'Sarah Johnson',
                title: 'Web Developer',
                content: 'These applications are incredibly useful for daily productivity!',
                rating: 5,
                status: 'active'
            },
            {
                name: 'Mike Chen',
                title: 'Designer',
                content: 'Great collection of tools, especially love the drawing canvas.',
                rating: 5,
                status: 'active'
            }
        ];

        for (const testimonial of testimonials) {
            const existing = await database.get(
                'SELECT id FROM testimonials WHERE name = ? AND content = ?',
                [testimonial.name, testimonial.content]
            );
            
            if (!existing) {
                await database.run(
                    'INSERT INTO testimonials (name, title, content, rating, status) VALUES (?, ?, ?, ?, ?)',
                    [testimonial.name, testimonial.title, testimonial.content, testimonial.rating, testimonial.status]
                );
                console.log(`✅ Added testimonial from: ${testimonial.name}`);
            }
        }

        // Create a flag file to indicate successful build
        const buildFlagPath = path.join(__dirname, '../.netlify-build-complete');
        fs.writeFileSync(buildFlagPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            version: require('../package.json').version
        }));

        console.log('✅ Minimal Netlify build completed successfully!');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    } finally {
        // Clean up database connection
        if (dbInitialized) {
            try {
                await database.safeClose();
            } catch (closeError) {
                console.warn('Warning during database close:', closeError.message);
            }
        }
    }
}

// Run the build
if (require.main === module) {
    minimalBuild();
}

module.exports = minimalBuild;

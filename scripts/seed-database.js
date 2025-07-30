const database = require('../config/database');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('🌱 Seeding database with sample data...');
        
        await database.connect();
        
        // Sample applications
        const applications = [
            {
                name: 'Personal Expense Tracker',
                short_name: 'ExpenseTracker',
                description: 'Track your daily expenses, manage budgets, and visualize spending patterns with interactive charts.',
                long_description: 'A comprehensive personal finance application that helps you take control of your spending. Features include expense categorization, budget management with alerts, interactive charts for spending analysis, and complete data privacy with local storage.',
                category: 'finance',
                tags: 'finance,productivity,budget,expenses,charts',
                logo_url: 'https://linhfishcr7.github.io/expense-tracker/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/expense-tracker/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/expense-tracker/',
                install_url: 'https://linhfishcr7.github.io/expense-tracker/',
                features: JSON.stringify([
                    '📊 Interactive spending charts',
                    '💰 Budget management with alerts',
                    '📱 Works offline with local storage',
                    '🎯 Category-based expense tracking',
                    '📈 Visual spending analytics'
                ]),
                status: 'active'
            },
            {
                name: 'Digital Drawing Canvas',
                short_name: 'DrawingCanvas',
                description: 'A powerful digital art studio in your browser! Create stunning drawings with multiple tools and brushes.',
                long_description: 'Transform your device into a digital art studio with this comprehensive drawing application. Features multiple drawing tools, customizable brushes, color palettes, save/load functionality, and full touch support for tablets and mobile devices.',
                category: 'creative',
                tags: 'creative,art,drawing,design,canvas',
                logo_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                install_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                features: JSON.stringify([
                    '🖌️ Multiple drawing tools & brushes',
                    '🎨 Color picker & preset palettes',
                    '💾 Save & load your artwork',
                    '📱 Touch support for mobile devices',
                    '⬇️ Export drawings as PNG files'
                ]),
                status: 'active'
            }
        ];
        
        for (const app of applications) {
            const existing = await database.get(
                'SELECT id FROM applications WHERE name = ?',
                [app.name]
            );
            
            if (!existing) {
                await database.run(
                    `INSERT INTO applications 
                    (name, short_name, description, long_description, category, tags, logo_url, screenshot_url, app_url, install_url, features, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        app.name, app.short_name, app.description, app.long_description,
                        app.category, app.tags, app.logo_url, app.screenshot_url,
                        app.app_url, app.install_url, app.features, app.status
                    ]
                );
                console.log(`✅ Application created: ${app.name}`);
            }
        }
        
        // Sample testimonials
        const testimonials = [
            {
                name: 'Sarah Johnson',
                title: 'Freelance Designer',
                content: 'The expense tracker has completely changed how I manage my finances. Simple, powerful, and works everywhere!',
                rating: 5,
                status: 'active'
            },
            {
                name: 'Mike Chen',
                title: 'Digital Artist',
                content: 'Amazing drawing app! I use it on my tablet for digital art. The touch support is fantastic.',
                rating: 5,
                status: 'active'
            },
            {
                name: 'Emma Davis',
                title: 'Privacy Advocate',
                content: 'Love that these apps work offline and don\'t collect my data. Privacy-focused and powerful!',
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
                console.log(`✅ Testimonial created: ${testimonial.name}`);
            }
        }
        
        // Sample analytics data
        const analyticsEvents = [
            { event_type: 'app_launch', event_data: JSON.stringify({ appId: 1 }) },
            { event_type: 'app_launch', event_data: JSON.stringify({ appId: 2 }) },
            { event_type: 'app_install', event_data: JSON.stringify({ appId: 1 }) },
            { event_type: 'newsletter_subscribe', event_data: JSON.stringify({ email: 'user@example.com' }) },
            { event_type: 'contact_form_submit', event_data: JSON.stringify({ subject: 'Feature Request' }) }
        ];
        
        for (const event of analyticsEvents) {
            await database.run(
                'INSERT INTO analytics (event_type, event_data, user_agent, ip_address) VALUES (?, ?, ?, ?)',
                [event.event_type, event.event_data, 'Sample User Agent', '127.0.0.1']
            );
        }
        
        console.log('✅ Sample analytics data created');
        
        // Update application stats
        await database.run('UPDATE applications SET launch_count = 15, install_count = 8 WHERE id = 1');
        await database.run('UPDATE applications SET launch_count = 12, install_count = 5 WHERE id = 2');
        
        console.log('✅ Application stats updated');
        
        console.log('🎉 Database seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    } finally {
        // Only close if we're running this script directly (not called from another script)
        if (require.main === module) {
            await database.safeClose();
        }
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;

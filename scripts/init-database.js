const database = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        await database.connect();
        await database.createTables();
        
        // Create default admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@webappshub.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        // Check if admin already exists
        const existingAdmin = await database.get(
            'SELECT id FROM admin_users WHERE email = ?',
            [adminEmail]
        );
        
        if (!existingAdmin) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
            
            await database.run(
                'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                [adminEmail, passwordHash, 'Administrator', 'admin']
            );
            
            console.log('✅ Default admin user created');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('⚠️  Please change the default password after first login!');
        } else {
            console.log('ℹ️  Admin user already exists');
        }
        
        // Initialize default site content
        const defaultContent = [
            {
                section: 'hero',
                content: {
                    title: 'Amazing <span class="gradient-text">Web Apps</span><br>For Everyone',
                    description: 'Discover powerful, free web applications that work on any device. Install them as native apps and enjoy seamless experiences across all your devices.',
                    stats: {
                        apps: 2,
                        free: 100,
                        users: 0
                    }
                }
            },
            {
                section: 'about',
                content: {
                    title: 'About Our Web Apps',
                    description: 'Our collection of web applications is designed with one goal in mind: to provide powerful, accessible tools that work seamlessly across all devices. Every app is built using modern web technologies and follows Progressive Web App (PWA) standards.',
                    features: [
                        {
                            icon: '🌐',
                            title: 'Universal Access',
                            description: 'Works on any device with a web browser - desktop, tablet, or mobile.'
                        },
                        {
                            icon: '📱',
                            title: 'PWA Technology',
                            description: 'Install as native apps with offline functionality and push notifications.'
                        },
                        {
                            icon: '🔒',
                            title: 'Privacy First',
                            description: 'All data stays on your device. No tracking, no ads, no data collection.'
                        },
                        {
                            icon: '⚡',
                            title: 'Lightning Fast',
                            description: 'Optimized for performance with instant loading and smooth interactions.'
                        }
                    ]
                }
            },
            {
                section: 'contact',
                content: {
                    title: 'Get In Touch',
                    description: 'Have feedback, suggestions, or found a bug? We\'d love to hear from you!',
                    email: 'hello@webappshub.com',
                    methods: [
                        {
                            icon: '📧',
                            title: 'Email',
                            description: 'hello@webappshub.com'
                        },
                        {
                            icon: '💬',
                            title: 'Feedback',
                            description: 'We value your input'
                        },
                        {
                            icon: '🐛',
                            title: 'Bug Reports',
                            description: 'Help us improve'
                        }
                    ]
                }
            }
        ];
        
        for (const content of defaultContent) {
            const existing = await database.get(
                'SELECT id FROM site_content WHERE section = ?',
                [content.section]
            );
            
            if (!existing) {
                await database.run(
                    'INSERT INTO site_content (section, content) VALUES (?, ?)',
                    [content.section, JSON.stringify(content.content)]
                );
                console.log(`✅ Default content created for section: ${content.section}`);
            }
        }
        
        console.log('🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;

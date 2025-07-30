const bcrypt = require('bcryptjs');
const database = require('../config/database');
require('dotenv').config();

async function setupAdmin() {
    try {
        console.log('Setting up admin panel...');
        
        // Connect to database
        await database.connect();
        
        // Create tables
        console.log('Creating database tables...');
        await database.createTables();
        
        // Check if admin user already exists
        const existingAdmin = await database.get(
            'SELECT id FROM admin_users WHERE email = ?',
            ['admin@example.com']
        );
        
        if (existingAdmin) {
            console.log('Admin user already exists');
        } else {
            // Create default admin user
            console.log('Creating default admin user...');
            
            const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
            
            await database.run(
                'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                ['admin@example.com', passwordHash, 'Administrator', 'admin']
            );
            
            console.log('Default admin user created:');
            console.log('Email: admin@example.com');
            console.log('Password:', defaultPassword);
            console.log('⚠️  Please change the default password after first login!');
        }
        
        // Add some sample content if not exists
        console.log('Setting up default site content...');
        
        const heroContent = await database.get(
            'SELECT id FROM site_content WHERE section = ?',
            ['hero']
        );
        
        if (!heroContent) {
            const defaultContent = {
                hero: {
                    title: 'Welcome to App Showcase',
                    subtitle: 'Discover Amazing Web Applications',
                    description: 'Explore our curated collection of innovative web applications designed to enhance your productivity and creativity.',
                    ctaText: 'Explore Apps',
                    ctaUrl: '#applications'
                },
                about: {
                    heading: 'About Our Platform',
                    text: 'We showcase the best web applications, carefully selected for their quality, innovation, and user experience. Our platform serves as a bridge between developers and users, highlighting exceptional digital solutions.',
                    imageUrl: '/images/about-hero.jpg'
                },
                features: {
                    heading: 'Platform Features',
                    subtitle: 'Everything you need in one place',
                    features: [
                        {
                            icon: '🚀',
                            title: 'Fast Performance',
                            description: 'Lightning-fast loading times and smooth user experience'
                        },
                        {
                            icon: '🔒',
                            title: 'Secure & Reliable',
                            description: 'Enterprise-grade security with 99.9% uptime guarantee'
                        },
                        {
                            icon: '📱',
                            title: 'Mobile Responsive',
                            description: 'Perfect experience across all devices and screen sizes'
                        },
                        {
                            icon: '🎨',
                            title: 'Beautiful Design',
                            description: 'Modern, intuitive interface designed for optimal user experience'
                        }
                    ]
                },
                contact: {
                    heading: 'Get in Touch',
                    email: 'contact@appshowcase.com',
                    phone: '+1 (555) 123-4567',
                    address: '123 Tech Street, Digital City, DC 12345'
                }
            };
            
            for (const [section, content] of Object.entries(defaultContent)) {
                await database.run(
                    'INSERT INTO site_content (section, content) VALUES (?, ?)',
                    [section, JSON.stringify(content)]
                );
            }
            
            console.log('Default site content created');
        }
        
        // Add sample testimonials if not exists
        const existingTestimonials = await database.get(
            'SELECT COUNT(*) as count FROM testimonials'
        );
        
        if (existingTestimonials.count === 0) {
            console.log('Adding sample testimonials...');
            
            const sampleTestimonials = [
                {
                    name: 'Sarah Johnson',
                    title: 'Product Manager',
                    content: 'This platform has revolutionized how we discover and evaluate new web applications. The curation quality is exceptional!',
                    rating: 5,
                    status: 'active'
                },
                {
                    name: 'Michael Chen',
                    title: 'Software Developer',
                    content: 'As a developer, I appreciate the technical quality and innovation showcased here. Great resource for inspiration!',
                    rating: 5,
                    status: 'active'
                },
                {
                    name: 'Emily Rodriguez',
                    title: 'UX Designer',
                    content: 'The user experience is fantastic. Clean design, intuitive navigation, and excellent performance across devices.',
                    rating: 4,
                    status: 'active'
                }
            ];
            
            for (const testimonial of sampleTestimonials) {
                await database.run(
                    'INSERT INTO testimonials (name, title, content, rating, status) VALUES (?, ?, ?, ?, ?)',
                    [testimonial.name, testimonial.title, testimonial.content, testimonial.rating, testimonial.status]
                );
            }
            
            console.log('Sample testimonials added');
        }
        
        console.log('✅ Admin panel setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Visit: http://localhost:3000/admin/');
        console.log('3. Login with admin@example.com and the password shown above');
        console.log('4. Change the default password in the admin panel');
        
    } catch (error) {
        console.error('❌ Error setting up admin panel:', error);
        process.exit(1);
    } finally {
        await database.safeClose();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupAdmin();
}

module.exports = setupAdmin;

#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Setting up WebApps Hub Dynamic Showcase...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    const install = spawn('npm', ['install'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
        if (code !== 0) {
            console.error('❌ Failed to install dependencies');
            process.exit(1);
        }
        runSetup();
    });
} else {
    runSetup();
}

function runSetup() {
    console.log('🗄️  Initializing database...');
    const initDb = spawn('npm', ['run', 'init-db'], { stdio: 'inherit' });
    
    initDb.on('close', (code) => {
        if (code !== 0) {
            console.error('❌ Failed to initialize database');
            process.exit(1);
        }
        
        console.log('\n🌱 Seeding database with sample data...');
        const seedDb = spawn('npm', ['run', 'seed-db'], { stdio: 'inherit' });
        
        seedDb.on('close', (code) => {
            if (code !== 0) {
                console.error('❌ Failed to seed database');
                process.exit(1);
            }
            
            console.log('\n🎨 Generating image assets...');
            const generateImages = spawn('npm', ['run', 'generate-images'], { stdio: 'inherit' });
            
            generateImages.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ Failed to generate images');
                    process.exit(1);
                }
                
                console.log('\n🎉 Setup complete! You can now start the application:');
                console.log('\n   npm start');
                console.log('\n📱 Access points:');
                console.log('   • Frontend: http://localhost:3000');
                console.log('   • Admin Dashboard: http://localhost:3000/admin');
                console.log('   • API: http://localhost:3000/api');
                console.log('\n🔐 Admin credentials:');
                console.log('   • Email: Set via ADMIN_EMAIL environment variable');
                console.log('   • Password: Set via ADMIN_PASSWORD environment variable');
                console.log('\n⚠️  Configure secure credentials via environment variables!');
            });
        });
    });
}

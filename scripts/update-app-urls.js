const database = require('../config/database');
require('dotenv').config();

async function updateApplicationUrls() {
    try {
        console.log('🔄 Updating application URLs to GitHub Pages in database...');
        
        await database.connect();
        
        // Update expense tracker URLs to GitHub Pages
        await database.run(
            `UPDATE applications
             SET app_url = 'https://linhfishcr7.github.io/expense-tracker/',
                 install_url = 'https://linhfishcr7.github.io/expense-tracker/',
                 logo_url = 'https://linhfishcr7.github.io/expense-tracker/img/logo.svg',
                 screenshot_url = 'https://linhfishcr7.github.io/expense-tracker/img/screenshot.png'
             WHERE name = 'Personal Expense Tracker'`
        );

        // Update digital drawing canvas URLs to GitHub Pages
        await database.run(
            `UPDATE applications
             SET app_url = 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                 install_url = 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                 logo_url = 'https://linhfishcr7.github.io/digital-drawing-canvas/img/logo.svg',
                 screenshot_url = 'https://linhfishcr7.github.io/digital-drawing-canvas/img/screenshot.png'
             WHERE name = 'Digital Drawing Canvas'`
        );
        
        console.log('✅ Application URLs updated to GitHub Pages successfully!');

        // Verify the updates
        const apps = await database.all('SELECT name, app_url, install_url, logo_url, screenshot_url FROM applications');
        console.log('\n📋 Current application URLs:');
        apps.forEach(app => {
            console.log(`  ${app.name}:`);
            console.log(`    App URL: ${app.app_url}`);
            console.log(`    Install URL: ${app.install_url}`);
            console.log(`    Logo URL: ${app.logo_url}`);
            console.log(`    Screenshot URL: ${app.screenshot_url}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Failed to update application URLs:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Run if called directly
if (require.main === module) {
    updateApplicationUrls();
}

module.exports = updateApplicationUrls;

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure the img directory exists
const imgDir = path.join(__dirname, '../public/img');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

// Function to create SVG logo programmatically
function createLogoSVG(size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const hubRadius = size * 0.15;
    const appRadius = size * 0.065;
    const orbitRadius = size * 0.25;
    const cornerRadius = size * 0.15;
    
    return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4ecdc4;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#44a08d;stop-opacity:1" />
            </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#bg)"/>
        
        <!-- Main Hub Circle -->
        <circle cx="${centerX}" cy="${centerY}" r="${hubRadius}" fill="white" opacity="0.9"/>
        
        <!-- App Icons Around Hub -->
        <!-- Expense Tracker -->
        <circle cx="${centerX + Math.cos(-Math.PI/4) * orbitRadius}" cy="${centerY + Math.sin(-Math.PI/4) * orbitRadius}" r="${appRadius}" fill="url(#accent)" opacity="0.8"/>
        <text x="${centerX + Math.cos(-Math.PI/4) * orbitRadius}" y="${centerY + Math.sin(-Math.PI/4) * orbitRadius + appRadius * 0.3}" font-family="Arial, sans-serif" font-size="${appRadius * 0.8}" font-weight="bold" text-anchor="middle" fill="white">$</text>
        
        <!-- Drawing Canvas -->
        <circle cx="${centerX + Math.cos(Math.PI/4) * orbitRadius}" cy="${centerY + Math.sin(Math.PI/4) * orbitRadius}" r="${appRadius}" fill="rgba(255,107,107,0.8)"/>
        <text x="${centerX + Math.cos(Math.PI/4) * orbitRadius}" y="${centerY + Math.sin(Math.PI/4) * orbitRadius + appRadius * 0.3}" font-family="Arial, sans-serif" font-size="${appRadius * 0.6}" text-anchor="middle" fill="white">🎨</text>
        
        <!-- Future App 1 -->
        <circle cx="${centerX + Math.cos(3*Math.PI/4) * orbitRadius}" cy="${centerY + Math.sin(3*Math.PI/4) * orbitRadius}" r="${appRadius}" fill="rgba(255,193,7,0.8)"/>
        <text x="${centerX + Math.cos(3*Math.PI/4) * orbitRadius}" y="${centerY + Math.sin(3*Math.PI/4) * orbitRadius + appRadius * 0.3}" font-family="Arial, sans-serif" font-size="${appRadius * 0.6}" text-anchor="middle" fill="white">⚡</text>
        
        <!-- Future App 2 -->
        <circle cx="${centerX + Math.cos(-3*Math.PI/4) * orbitRadius}" cy="${centerY + Math.sin(-3*Math.PI/4) * orbitRadius}" r="${appRadius}" fill="rgba(156,39,176,0.8)"/>
        <text x="${centerX + Math.cos(-3*Math.PI/4) * orbitRadius}" y="${centerY + Math.sin(-3*Math.PI/4) * orbitRadius + appRadius * 0.3}" font-family="Arial, sans-serif" font-size="${appRadius * 0.6}" text-anchor="middle" fill="white">🚀</text>
        
        <!-- Connection Lines -->
        <line x1="${centerX + Math.cos(-Math.PI/4) * (hubRadius + 5)}" y1="${centerY + Math.sin(-Math.PI/4) * (hubRadius + 5)}" x2="${centerX + Math.cos(-Math.PI/4) * (orbitRadius - appRadius - 5)}" y2="${centerY + Math.sin(-Math.PI/4) * (orbitRadius - appRadius - 5)}" stroke="rgba(255,255,255,0.6)" stroke-width="${size * 0.006}" stroke-linecap="round"/>
        <line x1="${centerX + Math.cos(Math.PI/4) * (hubRadius + 5)}" y1="${centerY + Math.sin(Math.PI/4) * (hubRadius + 5)}" x2="${centerX + Math.cos(Math.PI/4) * (orbitRadius - appRadius - 5)}" y2="${centerY + Math.sin(Math.PI/4) * (orbitRadius - appRadius - 5)}" stroke="rgba(255,255,255,0.6)" stroke-width="${size * 0.006}" stroke-linecap="round"/>
        <line x1="${centerX + Math.cos(3*Math.PI/4) * (hubRadius + 5)}" y1="${centerY + Math.sin(3*Math.PI/4) * (hubRadius + 5)}" x2="${centerX + Math.cos(3*Math.PI/4) * (orbitRadius - appRadius - 5)}" y2="${centerY + Math.sin(3*Math.PI/4) * (orbitRadius - appRadius - 5)}" stroke="rgba(255,255,255,0.6)" stroke-width="${size * 0.006}" stroke-linecap="round"/>
        <line x1="${centerX + Math.cos(-3*Math.PI/4) * (hubRadius + 5)}" y1="${centerY + Math.sin(-3*Math.PI/4) * (hubRadius + 5)}" x2="${centerX + Math.cos(-3*Math.PI/4) * (orbitRadius - appRadius - 5)}" y2="${centerY + Math.sin(-3*Math.PI/4) * (orbitRadius - appRadius - 5)}" stroke="rgba(255,255,255,0.6)" stroke-width="${size * 0.006}" stroke-linecap="round"/>
        
        <!-- Center Hub Icon -->
        <text x="${centerX}" y="${centerY + hubRadius * 0.2}" font-family="Arial, sans-serif" font-size="${hubRadius * 0.6}" font-weight="bold" text-anchor="middle" fill="#667eea">HUB</text>
    </svg>
    `;
}

// Function to create screenshot SVG
function createScreenshotSVG(width, height, isWide = true) {
    const centerX = width / 2;
    const titleY = isWide ? height * 0.3 : height * 0.25;
    const logoSize = isWide ? 120 : 100;
    const logoY = isWide ? height * 0.6 : height * 0.5;
    
    return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.3"/>
        
        <!-- Title -->
        <text x="${centerX}" y="${titleY}" font-family="Arial, sans-serif" font-size="${isWide ? 48 : 36}" font-weight="bold" text-anchor="middle" fill="white">WebApps Hub</text>
        <text x="${centerX}" y="${titleY + (isWide ? 60 : 50)}" font-family="Arial, sans-serif" font-size="${isWide ? 24 : 18}" text-anchor="middle" fill="rgba(255,255,255,0.9)">Amazing Web Applications For Everyone</text>
        
        <!-- Logo -->
        <g transform="translate(${centerX - logoSize/2}, ${logoY - logoSize/2})">
            ${createLogoSVG(logoSize).replace('<svg width="' + logoSize + '" height="' + logoSize + '" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
        </g>
        
        <!-- Features -->
        <text x="${centerX}" y="${height - (isWide ? 80 : 120)}" font-family="Arial, sans-serif" font-size="${isWide ? 18 : 14}" text-anchor="middle" fill="rgba(255,255,255,0.8)">Free • Powerful • Installable as PWAs</text>
    </svg>
    `;
}

// Function to create Open Graph image SVG
function createOGImageSVG() {
    const width = 1200;
    const height = 630;
    const centerX = width / 2;
    
    return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.2"/>
        
        <!-- Title -->
        <text x="${centerX}" y="180" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="white">WebApps Hub</text>
        <text x="${centerX}" y="240" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="rgba(255,255,255,0.9)">Amazing Web Applications Collection</text>
        <text x="${centerX}" y="290" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="rgba(255,255,255,0.8)">Free • Powerful • Installable as PWAs</text>
        
        <!-- Logo -->
        <g transform="translate(${centerX - 75}, 380)">
            ${createLogoSVG(150).replace('<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
        </g>
    </svg>
    `;
}

// Function to create Expense Tracker logo SVG
function createExpenseTrackerSVG(size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const cornerRadius = size * 0.15;

    return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="expenseBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="expenseAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4ecdc4;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#44a08d;stop-opacity:1" />
            </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#expenseBg)"/>

        <!-- Main Circle -->
        <circle cx="${centerX}" cy="${centerY}" r="${size * 0.3}" fill="white" opacity="0.9"/>

        <!-- Dollar Sign -->
        <text x="${centerX}" y="${centerY + size * 0.08}" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" text-anchor="middle" fill="url(#expenseAccent)">$</text>

        <!-- Chart Elements -->
        <rect x="${centerX - size * 0.15}" y="${centerY + size * 0.2}" width="${size * 0.08}" height="${size * 0.15}" fill="url(#expenseAccent)" opacity="0.7"/>
        <rect x="${centerX - size * 0.05}" y="${centerY + size * 0.15}" width="${size * 0.08}" height="${size * 0.2}" fill="url(#expenseAccent)" opacity="0.7"/>
        <rect x="${centerX + size * 0.05}" y="${centerY + size * 0.25}" width="${size * 0.08}" height="${size * 0.1}" fill="url(#expenseAccent)" opacity="0.7"/>
    </svg>
    `;
}

// Function to create Drawing Canvas logo SVG
function createDrawingCanvasSVG(size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const cornerRadius = size * 0.15;

    return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="canvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="canvasAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ee5a24;stop-opacity:1" />
            </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#canvasBg)"/>

        <!-- Canvas Background -->
        <rect x="${centerX - size * 0.25}" y="${centerY - size * 0.2}" width="${size * 0.5}" height="${size * 0.4}" rx="${size * 0.02}" fill="white" opacity="0.9"/>

        <!-- Brush -->
        <rect x="${centerX - size * 0.35}" y="${centerY - size * 0.35}" width="${size * 0.05}" height="${size * 0.3}" rx="${size * 0.01}" fill="url(#canvasAccent)" transform="rotate(-45 ${centerX} ${centerY})"/>

        <!-- Brush Tip -->
        <circle cx="${centerX - size * 0.15}" cy="${centerY - size * 0.15}" r="${size * 0.03}" fill="url(#canvasAccent)"/>

        <!-- Paint Stroke -->
        <path d="M ${centerX - size * 0.1} ${centerY - size * 0.05} Q ${centerX} ${centerY + size * 0.05} ${centerX + size * 0.15} ${centerY}" stroke="url(#canvasAccent)" stroke-width="${size * 0.02}" fill="none" stroke-linecap="round"/>

        <!-- Color Palette -->
        <circle cx="${centerX + size * 0.2}" cy="${centerY + size * 0.25}" r="${size * 0.025}" fill="#4ecdc4"/>
        <circle cx="${centerX + size * 0.25}" cy="${centerY + size * 0.2}" r="${size * 0.025}" fill="#feca57"/>
        <circle cx="${centerX + size * 0.15}" cy="${centerY + size * 0.2}" r="${size * 0.025}" fill="#ff6b6b"/>
    </svg>
    `;
}

// Generate Expense Tracker logos
async function generateExpenseTrackerLogos() {
    console.log('💰 Generating Expense Tracker logos...');

    const expenseDir = path.join(__dirname, '../public/expense-tracker/img');
    if (!fs.existsSync(expenseDir)) {
        fs.mkdirSync(expenseDir, { recursive: true });
    }

    const sizes = [
        { size: 512, name: 'logo-512.png' },
        { size: 192, name: 'logo-192.png' }
    ];

    for (const { size, name } of sizes) {
        const svgBuffer = Buffer.from(createExpenseTrackerSVG(size));
        await sharp(svgBuffer)
            .png({ quality: 95 })
            .toFile(path.join(expenseDir, name));
        console.log(`✅ Generated Expense Tracker ${name} (${size}x${size})`);
    }
}

// Generate Drawing Canvas logos
async function generateDrawingCanvasLogos() {
    console.log('🎨 Generating Drawing Canvas logos...');

    const canvasDir = path.join(__dirname, '../public/digital-drawing-canvas/img');
    if (!fs.existsSync(canvasDir)) {
        fs.mkdirSync(canvasDir, { recursive: true });
    }

    const sizes = [
        { size: 512, name: 'logo-512.png' },
        { size: 192, name: 'logo-192.png' }
    ];

    for (const { size, name } of sizes) {
        const svgBuffer = Buffer.from(createDrawingCanvasSVG(size));
        await sharp(svgBuffer)
            .png({ quality: 95 })
            .toFile(path.join(canvasDir, name));
        console.log(`✅ Generated Drawing Canvas ${name} (${size}x${size})`);
    }
}

async function generateImages() {
    console.log('🎨 Generating WebApps Hub image assets...');

    try {
        // Generate main hub logo in multiple sizes
        const logoSizes = [
            { size: 512, name: 'logo.png' },
            { size: 192, name: 'logo-192.png' },
            { size: 180, name: 'apple-touch-icon.png' },
            { size: 32, name: 'favicon-32x32.png' },
            { size: 16, name: 'favicon-16x16.png' }
        ];

        for (const { size, name } of logoSizes) {
            const svgBuffer = Buffer.from(createLogoSVG(size));
            await sharp(svgBuffer)
                .png({ quality: 95 })
                .toFile(path.join(imgDir, name));
            console.log(`✅ Generated ${name} (${size}x${size})`);
        }

        // Generate individual app logos
        await generateExpenseTrackerLogos();
        await generateDrawingCanvasLogos();
        
        // Generate screenshots
        const wideScreenshotSVG = createScreenshotSVG(1280, 720, true);
        const wideScreenshotBuffer = Buffer.from(wideScreenshotSVG);
        await sharp(wideScreenshotBuffer)
            .png({ quality: 90 })
            .toFile(path.join(imgDir, 'screenshot-wide.png'));
        console.log('✅ Generated screenshot-wide.png (1280x720)');
        
        const narrowScreenshotSVG = createScreenshotSVG(720, 1280, false);
        const narrowScreenshotBuffer = Buffer.from(narrowScreenshotSVG);
        await sharp(narrowScreenshotBuffer)
            .png({ quality: 90 })
            .toFile(path.join(imgDir, 'screenshot-narrow.png'));
        console.log('✅ Generated screenshot-narrow.png (720x1280)');
        
        // Generate Open Graph image
        const ogImageSVG = createOGImageSVG();
        const ogImageBuffer = Buffer.from(ogImageSVG);
        await sharp(ogImageBuffer)
            .png({ quality: 90 })
            .toFile(path.join(imgDir, 'og-image.png'));
        console.log('✅ Generated og-image.png (1200x630)');
        
        // Generate default app logo
        const defaultAppLogoSVG = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" rx="30" ry="30" fill="url(#bg)"/>
            <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="#64748b">📱</text>
        </svg>
        `;
        
        const defaultAppLogoBuffer = Buffer.from(defaultAppLogoSVG);
        await sharp(defaultAppLogoBuffer)
            .png({ quality: 90 })
            .toFile(path.join(imgDir, 'default-app-logo.png'));
        console.log('✅ Generated default-app-logo.png (200x200)');
        
        console.log('🎉 All image assets generated successfully!');
        console.log('\n📁 Generated files:');
        console.log('   • logo.png (512x512) - Main PWA icon');
        console.log('   • logo-192.png (192x192) - PWA icon');
        console.log('   • apple-touch-icon.png (180x180) - iOS icon');
        console.log('   • favicon-32x32.png (32x32) - Favicon');
        console.log('   • favicon-16x16.png (16x16) - Small favicon');
        console.log('   • screenshot-wide.png (1280x720) - PWA screenshot');
        console.log('   • screenshot-narrow.png (720x1280) - PWA screenshot');
        console.log('   • og-image.png (1200x630) - Social sharing');
        console.log('   • default-app-logo.png (200x200) - Fallback app logo');
        
    } catch (error) {
        console.error('❌ Error generating images:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateImages();
}

module.exports = generateImages;

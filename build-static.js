#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️  Building static version for GitHub Pages...\n');

const publicDir = path.join(__dirname, 'public');
const buildDir = path.join(__dirname, 'dist');

// Create build directory
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Copy all files from public to dist
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    console.log('📁 Copying files...');
    copyRecursive(publicDir, buildDir);
    
    // Create .nojekyll file
    fs.writeFileSync(path.join(buildDir, '.nojekyll'), '');
    console.log('✅ Created .nojekyll file');
    
    // Create 404.html for SPA routing
    const indexPath = path.join(buildDir, 'index.html');
    const notFoundPath = path.join(buildDir, '404.html');
    if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
        console.log('✅ Created 404.html for SPA routing');
    }
    
    // Update any absolute paths if needed
    console.log('🔧 Processing files for static hosting...');
    
    // Read and update index.html
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const updatedIndex = indexContent
        .replace(/href="\/([^"]*)">/g, 'href="./$1">')
        .replace(/src="\/([^"]*)">/g, 'src="./$1">');
    
    if (updatedIndex !== indexContent) {
        fs.writeFileSync(indexPath, updatedIndex);
        console.log('✅ Updated paths in index.html');
    }
    
    console.log('\n🎉 Static build complete!');
    console.log(`📁 Files built to: ${buildDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Upload contents of dist/ folder to your GitHub repository');
    console.log('2. Enable GitHub Pages in repository settings');
    console.log('3. Select source as "Deploy from a branch" → main → / (root)');
    console.log('\n🌐 Or use the GitHub Actions workflow for automatic deployment');
    
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}

// Display file structure
console.log('\n📂 Build structure:');
function displayTree(dir, prefix = '') {
    const files = fs.readdirSync(dir).slice(0, 10); // Limit display
    files.forEach((file, index) => {
        const filePath = path.join(dir, file);
        const isLast = index === files.length - 1;
        const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
        
        console.log(currentPrefix + file);
        
        if (fs.statSync(filePath).isDirectory() && index < 3) { // Limit depth
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            displayTree(filePath, nextPrefix);
        }
    });
}

displayTree(buildDir);

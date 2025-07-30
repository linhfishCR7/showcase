const fs = require('fs');
const path = require('path');

/**
 * Security verification script to check for hardcoded secrets
 * Run this before deployment to ensure no sensitive data is committed
 */

// Patterns that should NOT appear in the codebase
const FORBIDDEN_PATTERNS = [
    /admin@webappshub\.com/gi,
    /admin123/gi,
    /smtp\.gmail\.com/gi,
    /linhhalinh5@gmail\.com/gi,
    /nveqstdmltlqhdfd/gi,
    /your-email@gmail\.com/gi,
    // Add more patterns as needed
];

// Files to check (relative to project root)
const FILES_TO_CHECK = [
    '.env.example',
    'README.md',
    'setup.js',
    'scripts/init-database.js',
    'scripts/seed-database.js',
    'package.json',
    'netlify.toml'
];

// Directories to scan recursively
const DIRS_TO_SCAN = [
    'routes',
    'middleware',
    'config',
    'public'
];

function checkFile(filePath) {
    const issues = [];
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        FORBIDDEN_PATTERNS.forEach((pattern, patternIndex) => {
            lines.forEach((line, lineIndex) => {
                if (pattern.test(line)) {
                    issues.push({
                        file: filePath,
                        line: lineIndex + 1,
                        content: line.trim(),
                        pattern: pattern.toString()
                    });
                }
            });
        });
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
        }
    }
    
    return issues;
}

function scanDirectory(dirPath) {
    const issues = [];
    
    try {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules and other irrelevant directories
                if (!['node_modules', '.git', '.netlify', 'uploads', 'database'].includes(item)) {
                    issues.push(...scanDirectory(itemPath));
                }
            } else if (stat.isFile()) {
                // Check relevant file types
                const ext = path.extname(item).toLowerCase();
                if (['.js', '.json', '.md', '.toml', '.txt', '.env'].includes(ext)) {
                    issues.push(...checkFile(itemPath));
                }
            }
        });
    } catch (error) {
        console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
    
    return issues;
}

function verifyEnvironmentVariables() {
    console.log('🔍 Checking environment variable usage...\n');
    
    const requiredVars = [
        'JWT_SECRET',
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'NODE_ENV'
    ];
    
    const optionalVars = [
        'CORS_ORIGIN',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'RATE_LIMIT_WINDOW',
        'RATE_LIMIT_MAX_REQUESTS'
    ];
    
    console.log('✅ Required environment variables:');
    requiredVars.forEach(varName => {
        console.log(`   • ${varName}`);
    });
    
    console.log('\n⚪ Optional environment variables:');
    optionalVars.forEach(varName => {
        console.log(`   • ${varName}`);
    });
    
    console.log('\n📋 Remember to configure these in Netlify Dashboard → Environment Variables\n');
}

function main() {
    console.log('🔒 Security Verification Script');
    console.log('================================\n');
    
    let allIssues = [];
    
    // Check specific files
    console.log('🔍 Checking specific files...');
    FILES_TO_CHECK.forEach(file => {
        const issues = checkFile(file);
        allIssues.push(...issues);
        
        if (issues.length === 0) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} (${issues.length} issues)`);
        }
    });
    
    // Scan directories
    console.log('\n🔍 Scanning directories...');
    DIRS_TO_SCAN.forEach(dir => {
        if (fs.existsSync(dir)) {
            const issues = scanDirectory(dir);
            allIssues.push(...issues);
            
            if (issues.length === 0) {
                console.log(`✅ ${dir}/`);
            } else {
                console.log(`❌ ${dir}/ (${issues.length} issues)`);
            }
        } else {
            console.log(`⚠️  ${dir}/ (not found)`);
        }
    });
    
    // Report results
    console.log('\n📊 Security Scan Results');
    console.log('========================');
    
    if (allIssues.length === 0) {
        console.log('✅ No security issues found!');
        console.log('✅ Repository is clean of hardcoded secrets');
        console.log('✅ Ready for Netlify deployment');
    } else {
        console.log(`❌ Found ${allIssues.length} security issues:\n`);
        
        allIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.file}:${issue.line}`);
            console.log(`   Pattern: ${issue.pattern}`);
            console.log(`   Content: ${issue.content}`);
            console.log('');
        });
        
        console.log('🚨 Please fix these issues before deployment!');
        process.exit(1);
    }
    
    // Show environment variable guidance
    verifyEnvironmentVariables();
    
    console.log('🎉 Security verification completed successfully!');
}

// Run the verification
if (require.main === module) {
    main();
}

module.exports = { checkFile, scanDirectory, verifyEnvironmentVariables };

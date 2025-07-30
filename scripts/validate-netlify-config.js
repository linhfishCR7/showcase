const fs = require('fs');
const path = require('path');

function validateNetlifyConfig() {
    console.log('🔍 Validating Netlify configuration...\n');
    
    const checks = [];
    
    // Check netlify.toml exists
    const netlifyTomlPath = path.join(__dirname, '../netlify.toml');
    checks.push({
        name: 'netlify.toml exists',
        passed: fs.existsSync(netlifyTomlPath),
        required: true
    });
    
    // Check serverless function exists
    const functionPath = path.join(__dirname, '../netlify/functions/api.js');
    checks.push({
        name: 'Serverless function (api.js) exists',
        passed: fs.existsSync(functionPath),
        required: true
    });
    
    // Check package.json has serverless-http
    const packageJsonPath = path.join(__dirname, '../package.json');
    let hasServerlessHttp = false;
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        hasServerlessHttp = packageJson.dependencies && packageJson.dependencies['serverless-http'];
    }
    checks.push({
        name: 'serverless-http dependency installed',
        passed: hasServerlessHttp,
        required: true
    });
    
    // Check .gitignore excludes database files
    const gitignorePath = path.join(__dirname, '../.gitignore');
    let gitignoreValid = false;
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        gitignoreValid = gitignoreContent.includes('*.db') && gitignoreContent.includes('.netlify/');
    }
    checks.push({
        name: '.gitignore excludes database and Netlify files',
        passed: gitignoreValid,
        required: true
    });
    
    // Check public directory exists
    const publicPath = path.join(__dirname, '../public');
    checks.push({
        name: 'Public directory exists',
        passed: fs.existsSync(publicPath),
        required: true
    });
    
    // Check build script exists
    const buildScriptPath = path.join(__dirname, '../scripts/netlify-build.js');
    checks.push({
        name: 'Netlify build script exists',
        passed: fs.existsSync(buildScriptPath),
        required: true
    });
    
    // Check deployment guide exists
    const deploymentGuidePath = path.join(__dirname, '../NETLIFY_DEPLOYMENT.md');
    checks.push({
        name: 'Netlify deployment guide exists',
        passed: fs.existsSync(deploymentGuidePath),
        required: false
    });
    
    // Display results
    let allRequired = true;
    checks.forEach(check => {
        const status = check.passed ? '✅' : '❌';
        const required = check.required ? '(Required)' : '(Optional)';
        console.log(`${status} ${check.name} ${required}`);
        
        if (check.required && !check.passed) {
            allRequired = false;
        }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (allRequired) {
        console.log('🎉 All required checks passed! Ready for Netlify deployment.');
        console.log('\n📋 Next steps:');
        console.log('1. Push your code to GitHub');
        console.log('2. Connect your repository to Netlify');
        console.log('3. Set environment variables in Netlify dashboard');
        console.log('4. Deploy your site');
        console.log('\n📖 See NETLIFY_DEPLOYMENT.md for detailed instructions.');
    } else {
        console.log('❌ Some required checks failed. Please fix the issues above.');
        process.exit(1);
    }
}

// Run validation
validateNetlifyConfig();

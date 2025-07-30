# 🚀 Netlify Deployment Guide

This guide explains how to deploy the WebApps Hub Dynamic Showcase to Netlify.

## 📋 Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js 18+**: Ensure your local environment has Node.js 18 or higher

## 🔧 Netlify Configuration

The project is configured for Netlify deployment with:

- **`netlify.toml`**: Main configuration file with build settings and redirects
- **`netlify/functions/api.js`**: Serverless function handler for the Express.js API
- **Build Command**: `npm run build` (runs database setup and image generation)
- **Publish Directory**: `public` (static files)
- **Functions Directory**: `netlify/functions` (serverless functions)

## 🚀 Deployment Steps

### 1. Connect Repository to Netlify

1. Log in to your Netlify dashboard
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your repository (`app-showcase-dynamic` folder)

### 2. Configure Build Settings

In Netlify's build settings, configure:

- **Base directory**: `app-showcase-dynamic`
- **Build command**: `npm run build`
- **Publish directory**: `app-showcase-dynamic/public`
- **Functions directory**: `app-showcase-dynamic/netlify/functions`

### 3. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: Generate a strong JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. Your site will be available at `https://your-site-name.netlify.app`

## 🔗 Application URLs

The showcase references these deployed applications:
- **Expense Tracker**: https://linhfishcr7.github.io/expense-tracker/
- **Digital Drawing Canvas**: https://linhfishcr7.github.io/digital-drawing-canvas/

## 📁 File Structure

```
app-showcase-dynamic/
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       └── api.js           # Serverless function handler
├── public/                  # Static files (published directory)
├── config/
│   └── database.js         # Database configuration (uses /tmp in production)
├── scripts/
│   └── netlify-build.js    # Custom build script
└── package.json            # Updated with serverless-http dependency
```

## 🛠️ How It Works

1. **Build Process**: Runs `npm run build` which executes `netlify-build.js`
2. **Database**: SQLite database is created in `/tmp` directory during function execution
3. **API Routes**: All `/api/*` requests are redirected to `/.netlify/functions/api`
4. **Static Files**: Served directly from the `public` directory
5. **SPA Routing**: Admin dashboard and main app use client-side routing

## 🔍 Troubleshooting

### Build Failures
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Issues
- Database is recreated on each function cold start
- Data is seeded automatically during build
- For persistent data, consider using external database services

### Function Timeouts
- Netlify functions have a 10-second timeout limit
- Optimize database queries and API responses
- Consider caching strategies for better performance

## 📊 Monitoring

- **Build Logs**: Available in Netlify dashboard
- **Function Logs**: Real-time logs for serverless functions
- **Analytics**: Built-in Netlify analytics available

## 🔄 Continuous Deployment

Once connected to GitHub:
1. Push changes to your repository
2. Netlify automatically detects changes
3. Builds and deploys the updated site
4. Zero-downtime deployment

## 🌐 Custom Domain (Optional)

To use a custom domain:
1. Go to Site Settings → Domain management
2. Add your custom domain
3. Configure DNS settings as instructed
4. SSL certificate is automatically provisioned

## 📝 Notes

- **Database**: Uses SQLite in `/tmp` directory (ephemeral)
- **File Uploads**: Stored in `/tmp` directory (ephemeral)
- **Environment**: Production environment with security headers
- **CORS**: Configured for your Netlify domain
- **Rate Limiting**: Applied to API endpoints

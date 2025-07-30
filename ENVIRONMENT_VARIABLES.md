# 🔐 Environment Variables Configuration Guide

This guide covers all environment variables used in the app-showcase-dynamic project for secure deployment to Netlify.

## 📋 Required Environment Variables

### 🔑 Security & Authentication

| Variable | Required | Description | Example Value | Notes |
|----------|----------|-------------|---------------|-------|
| `JWT_SECRET` | **Yes** | Secret key for JWT token signing | `a1b2c3d4e5f6...` | Generate with crypto.randomBytes(64) |
| `BCRYPT_ROUNDS` | No | Number of bcrypt salt rounds | `12` | Higher = more secure but slower |
| `ADMIN_EMAIL` | **Yes** | Default admin user email | `admin@yoursite.com` | Used for initial admin account |
| `ADMIN_PASSWORD` | **Yes** | Default admin user password | `SecurePassword123!` | Change after first login |

### 🌐 Server Configuration

| Variable | Required | Description | Example Value | Notes |
|----------|----------|-------------|---------------|-------|
| `NODE_ENV` | **Yes** | Environment mode | `production` | Affects CORS, error handling, DB path |
| `PORT` | No | Server port (local dev only) | `3000` | Not used in Netlify serverless |
| `DATABASE_PATH` | No | SQLite database path | `./database/webapps_hub.db` | Auto-set to /tmp in production |

### 🛡️ Rate Limiting & Security

| Variable | Required | Description | Example Value | Notes |
|----------|----------|-------------|---------------|-------|
| `RATE_LIMIT_WINDOW` | No | Rate limit window in minutes | `15` | Default: 15 minutes |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` | Default: 100 requests |
| `CORS_ORIGIN` | No | Allowed CORS origins | `https://site.netlify.app` | Comma-separated list for production |

### 📁 File Upload Configuration

| Variable | Required | Description | Example Value | Notes |
|----------|----------|-------------|---------------|-------|
| `MAX_FILE_SIZE` | No | Max file size in bytes | `5242880` | Default: 5MB |
| `ALLOWED_FILE_TYPES` | No | Allowed MIME types | `image/jpeg,image/png,image/gif,image/webp` | Comma-separated |

### 📧 Email Configuration (Optional)

| Variable | Required | Description | Example Value | Notes |
|----------|----------|-------------|---------------|-------|
| `SMTP_HOST` | No | SMTP server hostname | `smtp.gmail.com` | For newsletter functionality |
| `SMTP_PORT` | No | SMTP server port | `587` | Usually 587 for TLS |
| `SMTP_USER` | No | SMTP username | `your-email@gmail.com` | Email account |
| `SMTP_PASS` | No | SMTP password | `your-app-password` | Use app-specific password |

## 🔒 Security Best Practices

### 1. JWT Secret Generation
Generate a cryptographically secure JWT secret:

```bash
# Generate a 64-byte random hex string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Strong Admin Credentials
- Use a strong, unique password for the admin account
- Change default credentials immediately after deployment
- Consider using a password manager

### 3. Environment-Specific Values
- Use different JWT secrets for development and production
- Never commit sensitive values to version control
- Use Netlify's environment variable system for production

## 🚀 Netlify Configuration

### Setting Environment Variables in Netlify Dashboard

1. **Navigate to Site Settings**:
   - Go to your Netlify dashboard
   - Select your site
   - Click "Site settings"

2. **Access Environment Variables**:
   - In the sidebar, click "Environment variables"
   - Click "Add a variable"

3. **Add Required Variables**:
   ```
   NODE_ENV = production
   JWT_SECRET = [your-generated-secret]
   ADMIN_EMAIL = admin@yoursite.com
   ADMIN_PASSWORD = [your-secure-password]
   RATE_LIMIT_WINDOW = 15
   RATE_LIMIT_MAX_REQUESTS = 100
   CORS_ORIGIN = https://your-site.netlify.app
   ```

4. **Optional Variables** (add if needed):
   ```
   BCRYPT_ROUNDS = 12
   MAX_FILE_SIZE = 5242880
   ALLOWED_FILE_TYPES = image/jpeg,image/png,image/gif,image/webp
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your-email@gmail.com
   SMTP_PASS = your-app-password
   ```

### Build vs Runtime Variables

- **Build-time**: Available during `npm run build`
- **Runtime**: Available in serverless functions
- **Netlify**: All variables are available in both contexts

## 🏠 Local Development Setup

### 1. Create .env File
Create a `.env` file in the `app-showcase-dynamic` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database/webapps_hub.db

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-development-jwt-secret-here

# Admin Credentials (Change these!)
ADMIN_EMAIL=admin@localhost.com
ADMIN_PASSWORD=admin123

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Email Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

### 2. Load Environment Variables
The application automatically loads `.env` files using the `dotenv` package:

```javascript
require('dotenv').config();
```

### 3. Verify Configuration
Test that environment variables are loaded:

```bash
cd app-showcase-dynamic
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');"
```

## 🔍 Troubleshooting

### Environment Variables Not Loading

1. **Check file location**: `.env` must be in the project root
2. **Check syntax**: No spaces around `=` sign
3. **Restart server**: Changes require server restart
4. **Check .gitignore**: Ensure `.env` is excluded from git

### Netlify Build Issues

1. **Missing variables**: Check Netlify dashboard settings
2. **Case sensitivity**: Variable names are case-sensitive
3. **Special characters**: Wrap values with special chars in quotes

### JWT Token Issues

1. **Invalid secret**: Ensure JWT_SECRET is set and consistent
2. **Token expiration**: Tokens expire after 24 hours
3. **Environment mismatch**: Dev and prod should use different secrets

## 📝 Environment Variable Checklist

### Before Deployment:
- [ ] JWT_SECRET generated and set in Netlify
- [ ] ADMIN_EMAIL and ADMIN_PASSWORD configured
- [ ] NODE_ENV set to "production"
- [ ] Rate limiting values configured
- [ ] .env files excluded from git
- [ ] Local .env.example created for team reference

### After Deployment:
- [ ] Admin login works with configured credentials
- [ ] JWT authentication functioning
- [ ] Rate limiting active
- [ ] File uploads working (if used)
- [ ] Email functionality tested (if configured)

## 🔗 Related Documentation

- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Node.js dotenv Documentation](https://github.com/motdotla/dotenv)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [bcrypt Security Considerations](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

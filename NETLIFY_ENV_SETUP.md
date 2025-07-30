# 🚀 Netlify Environment Variables Setup Guide

Step-by-step instructions for configuring environment variables in Netlify for secure deployment of the app-showcase-dynamic project.

## 📋 Prerequisites

- Netlify account created
- GitHub repository connected to Netlify
- Project deployed or ready to deploy

## 🔧 Step-by-Step Configuration

### Step 1: Access Netlify Dashboard

1. **Login to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in to your account

2. **Select Your Site**:
   - Click on your app-showcase-dynamic site
   - If not deployed yet, connect your GitHub repository first

### Step 2: Navigate to Environment Variables

1. **Open Site Settings**:
   - Click "Site settings" in the top navigation
   - Or use the gear icon next to your site name

2. **Find Environment Variables**:
   - In the left sidebar, scroll down to "Build & deploy"
   - Click "Environment variables"

### Step 3: Add Required Variables

Click "Add a variable" for each of the following:

#### 🔑 Essential Security Variables

```
Variable name: NODE_ENV
Value: production
```

```
Variable name: JWT_SECRET
Value: [Generate using the command below]
```

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it as the JWT_SECRET value.

```
Variable name: ADMIN_EMAIL
Value: admin@yoursite.com
```

```
Variable name: ADMIN_PASSWORD
Value: [Your secure password]
```

#### 🛡️ Rate Limiting Variables

```
Variable name: RATE_LIMIT_WINDOW
Value: 15
```

```
Variable name: RATE_LIMIT_MAX_REQUESTS
Value: 100
```

#### 🔒 Optional Security Variables

```
Variable name: BCRYPT_ROUNDS
Value: 12
```

#### 📁 Optional File Upload Variables

```
Variable name: MAX_FILE_SIZE
Value: 5242880
```

```
Variable name: ALLOWED_FILE_TYPES
Value: image/jpeg,image/png,image/gif,image/webp
```

### Step 4: Configure Email (Optional)

If you want newsletter functionality:

```
Variable name: SMTP_HOST
Value: smtp.gmail.com
```

```
Variable name: SMTP_PORT
Value: 587
```

```
Variable name: SMTP_USER
Value: your-email@gmail.com
```

```
Variable name: SMTP_PASS
Value: your-app-password
```

**Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### Step 5: Save and Deploy

1. **Save Variables**:
   - Each variable is saved automatically when you add it
   - No need to click a "Save" button

2. **Trigger Deployment**:
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Or push a new commit to trigger automatic deployment

## 🔍 Verification Steps

### 1. Check Build Logs

1. **View Deploy Logs**:
   - Go to "Deploys" tab
   - Click on the latest deployment
   - Check the build logs for any environment variable errors

2. **Look for Success Messages**:
   ```
   ✅ Database initialized successfully
   ✅ Application seeding completed
   🎉 All tests passed! Database fix is working correctly
   ```

### 2. Test the Application

1. **Access Your Site**:
   - Visit your Netlify site URL
   - Should load without errors

2. **Test Admin Login**:
   - Go to `/admin` on your site
   - Login with the ADMIN_EMAIL and ADMIN_PASSWORD you set
   - Should successfully authenticate

3. **Check API Endpoints**:
   - Visit `/api/health` - should return status OK
   - API should respond without authentication errors

## 🚨 Common Issues & Solutions

### Issue: "JWT_SECRET is not defined"

**Solution**:
- Verify JWT_SECRET is set in Netlify environment variables
- Check spelling and case sensitivity
- Redeploy the site after adding the variable

### Issue: "Database initialization failed"

**Solution**:
- Check build logs for specific error messages
- Ensure NODE_ENV is set to "production"
- Verify all required variables are present

### Issue: "Admin login fails"

**Solution**:
- Verify ADMIN_EMAIL and ADMIN_PASSWORD are correctly set
- Check for extra spaces or special characters
- Try resetting the admin password through the database

### Issue: "Rate limiting not working"

**Solution**:
- Ensure RATE_LIMIT_WINDOW and RATE_LIMIT_MAX_REQUESTS are set
- Values should be numbers (no quotes needed in Netlify)
- Check that the values are reasonable (window: 1-60, requests: 10-1000)

## 🔒 Security Best Practices

### 1. Strong Passwords
- Use a password manager to generate strong passwords
- Minimum 12 characters with mixed case, numbers, and symbols
- Never reuse passwords from other services

### 2. JWT Secret Security
- Always generate a new JWT secret for production
- Never use the same secret for development and production
- Store the secret securely (password manager recommended)

### 3. Email Credentials
- Use app-specific passwords for email services
- Enable 2FA on your email account
- Consider using dedicated email services like SendGrid for production

### 4. Regular Updates
- Rotate JWT secrets periodically (every 6-12 months)
- Update admin passwords regularly
- Monitor access logs for suspicious activity

## 📊 Environment Variables Summary

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| NODE_ENV | ✅ | Environment mode | `production` |
| JWT_SECRET | ✅ | Token signing | `a1b2c3d4e5f6...` |
| ADMIN_EMAIL | ✅ | Admin login | `admin@site.com` |
| ADMIN_PASSWORD | ✅ | Admin password | `SecurePass123!` |
| RATE_LIMIT_WINDOW | ⚪ | Rate limit window | `15` |
| RATE_LIMIT_MAX_REQUESTS | ⚪ | Max requests | `100` |
| BCRYPT_ROUNDS | ⚪ | Password hashing | `12` |
| MAX_FILE_SIZE | ⚪ | Upload limit | `5242880` |
| ALLOWED_FILE_TYPES | ⚪ | File types | `image/jpeg,image/png` |
| SMTP_* | ⚪ | Email config | Various |

✅ = Required, ⚪ = Optional

## 🎯 Next Steps

After configuring environment variables:

1. **Deploy and Test**: Ensure everything works correctly
2. **Change Default Password**: Login and change the admin password
3. **Monitor Logs**: Check for any runtime errors
4. **Set Up Monitoring**: Consider adding error tracking
5. **Backup Configuration**: Document your settings securely

## 📞 Support

If you encounter issues:
- Check the [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed variable descriptions
- Review [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for general deployment guidance
- Check Netlify's [environment variables documentation](https://docs.netlify.com/environment-variables/overview/)

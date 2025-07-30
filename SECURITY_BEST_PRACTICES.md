# 🔐 Security Best Practices for Environment Variables

Comprehensive security guidelines for managing environment variables in the app-showcase-dynamic project.

## 🎯 Core Security Principles

### 1. **Never Commit Secrets to Version Control**
- ❌ Never commit `.env` files
- ❌ Never hardcode secrets in source code
- ❌ Never include secrets in commit messages
- ✅ Use `.env.example` for templates only
- ✅ Keep `.env` in `.gitignore`

### 2. **Use Different Secrets for Different Environments**
- ❌ Don't reuse production secrets in development
- ❌ Don't share secrets between projects
- ✅ Generate unique secrets for each environment
- ✅ Use separate databases for dev/staging/production

### 3. **Apply Principle of Least Privilege**
- ❌ Don't give broader access than needed
- ❌ Don't use admin credentials for application access
- ✅ Create service-specific accounts
- ✅ Limit permissions to minimum required

## 🔑 JWT Secret Security

### Generation Best Practices
```bash
# Generate cryptographically secure JWT secret (recommended)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Alternative using OpenSSL
openssl rand -hex 64

# Alternative using Python
python -c "import secrets; print(secrets.token_hex(64))"
```

### JWT Security Checklist
- [ ] **Length**: Minimum 256 bits (32 bytes)
- [ ] **Randomness**: Use cryptographically secure random generator
- [ ] **Uniqueness**: Different secret for each environment
- [ ] **Rotation**: Change periodically (every 6-12 months)
- [ ] **Storage**: Never log or expose in error messages

### JWT Configuration
```javascript
// ✅ Good: Secure JWT configuration
const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',           // Short expiration
    issuer: 'webapps-hub',      // Identify your app
    audience: 'webapps-hub-users' // Intended audience
});

// ❌ Bad: Insecure configuration
const token = jwt.sign(payload, 'hardcoded-secret', {
    expiresIn: '30d'  // Too long expiration
});
```

## 🔒 Password Security

### Admin Password Requirements
- **Minimum Length**: 12 characters
- **Complexity**: Mix of uppercase, lowercase, numbers, symbols
- **Uniqueness**: Not used elsewhere
- **Storage**: Use password manager

### Password Generation Examples
```bash
# Generate secure password (Linux/Mac)
openssl rand -base64 32

# Generate with specific requirements
python -c "import secrets, string; chars = string.ascii_letters + string.digits + '!@#$%^&*'; print(''.join(secrets.choice(chars) for _ in range(16)))"
```

### Bcrypt Configuration
```javascript
// ✅ Recommended: 12+ rounds for production
const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Security vs Performance balance:
// 10 rounds: ~10ms (minimum for production)
// 12 rounds: ~150ms (recommended)
// 14 rounds: ~1.5s (high security)
```

## 🌐 CORS Security

### Production CORS Configuration
```javascript
// ✅ Secure: Specific origins only
app.use(cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    optionsSuccessStatus: 200
}));

// ❌ Insecure: Wildcard with credentials
app.use(cors({
    origin: '*',
    credentials: true  // This combination is dangerous
}));
```

### CORS Environment Variables
```env
# ✅ Production: Specific domains
CORS_ORIGIN=https://yoursite.netlify.app,https://yourdomain.com

# ✅ Development: Local only
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

## 📧 Email Security

### SMTP Configuration
```env
# ✅ Secure email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-app@gmail.com
SMTP_PASS=your-app-specific-password  # Not your regular password!
```

### Email Security Checklist
- [ ] **App Passwords**: Use app-specific passwords, not account passwords
- [ ] **2FA**: Enable two-factor authentication on email accounts
- [ ] **TLS**: Use port 587 with STARTTLS or port 465 with SSL
- [ ] **Dedicated Account**: Use separate email account for applications
- [ ] **Rate Limiting**: Implement email sending rate limits

## 🛡️ Rate Limiting Security

### Configuration Guidelines
```env
# ✅ Balanced rate limiting
RATE_LIMIT_WINDOW=15        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100 # 100 requests per window

# ✅ Strict rate limiting (high security)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=50

# ❌ Too permissive
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=1000
```

### Rate Limiting Best Practices
- **API Endpoints**: More restrictive limits
- **Authentication**: Very strict limits (5-10 attempts)
- **File Uploads**: Separate, stricter limits
- **Public Endpoints**: Moderate limits

## 🗄️ Database Security

### SQLite Security in Serverless
```javascript
// ✅ Secure database path configuration
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/webapps_hub.db'  // Ephemeral in serverless
    : process.env.DATABASE_PATH || './database/webapps_hub.db';
```

### Database Security Checklist
- [ ] **Ephemeral Storage**: Use /tmp in serverless environments
- [ ] **No Sensitive Data**: Don't store secrets in database
- [ ] **Input Validation**: Use parameterized queries
- [ ] **Access Control**: Implement proper authentication
- [ ] **Backup Strategy**: Plan for data persistence if needed

## 🚀 Netlify-Specific Security

### Environment Variable Management
1. **Access Control**:
   - Only team members who need access should have it
   - Use Netlify's team permissions appropriately

2. **Variable Naming**:
   ```env
   # ✅ Clear, descriptive names
   JWT_SECRET=...
   ADMIN_PASSWORD=...
   
   # ❌ Unclear or misleading names
   SECRET=...
   PASS=...
   ```

3. **Variable Scoping**:
   - Use build-time variables for build configuration
   - Use runtime variables for application secrets

### Netlify Security Features
- **Deploy Previews**: Don't expose production secrets to preview deploys
- **Branch Deploys**: Use different variables for different branches
- **Access Logs**: Monitor who accesses environment variables

## 🔍 Security Monitoring

### What to Monitor
- **Failed Authentication Attempts**: Track login failures
- **Rate Limit Violations**: Monitor for abuse patterns
- **Error Rates**: Watch for security-related errors
- **Access Patterns**: Unusual access times or locations

### Logging Best Practices
```javascript
// ✅ Safe logging
console.log('Authentication failed for user:', email);

// ❌ Dangerous logging
console.log('JWT verification failed:', process.env.JWT_SECRET);
console.log('Login attempt:', { email, password }); // Never log passwords
```

## 🚨 Incident Response

### If Secrets Are Compromised
1. **Immediate Actions**:
   - Rotate all affected secrets immediately
   - Revoke all active JWT tokens
   - Check access logs for unauthorized access
   - Change admin passwords

2. **Investigation**:
   - Determine scope of compromise
   - Check for data exfiltration
   - Review recent deployments and changes

3. **Recovery**:
   - Deploy with new secrets
   - Notify users if necessary
   - Implement additional monitoring

### Secret Rotation Schedule
- **JWT Secrets**: Every 6-12 months
- **Admin Passwords**: Every 3-6 months
- **API Keys**: As recommended by provider
- **Database Credentials**: Every 6-12 months

## ✅ Security Checklist

### Pre-Deployment
- [ ] All secrets use environment variables
- [ ] No hardcoded credentials in code
- [ ] Strong, unique passwords generated
- [ ] JWT secret is cryptographically secure
- [ ] CORS origins are specific to your domains
- [ ] Rate limiting is appropriately configured
- [ ] .env files are in .gitignore
- [ ] .env.example contains no real secrets

### Post-Deployment
- [ ] Admin password changed from default
- [ ] All environment variables set in Netlify
- [ ] Application functions correctly
- [ ] Authentication works as expected
- [ ] Rate limiting is active
- [ ] CORS policy is enforced
- [ ] Error messages don't expose secrets
- [ ] Monitoring is in place

### Regular Maintenance
- [ ] Review and rotate secrets periodically
- [ ] Monitor for security updates
- [ ] Check access logs regularly
- [ ] Update dependencies
- [ ] Review and update security policies

## 📚 Additional Resources

- [OWASP Environment Variable Security](https://owasp.org/www-community/vulnerabilities/Insecure_Storage_of_Sensitive_Information)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Netlify Security Documentation](https://docs.netlify.com/security/secure-access-to-sites/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

Remember: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure application.

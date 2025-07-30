# 🔧 Troubleshooting Guide

## PWA Installation Issues

### "Download error or resource isn't a valid image"

This error occurs when the PWA manifest references image files that don't exist or are corrupted.

**Solution:**
1. Generate the required image assets:
   ```bash
   npm run generate-images
   ```

2. Verify the images were created in `public/img/`:
   - `logo.png` (512x512)
   - `logo-192.png` (192x192)
   - `apple-touch-icon.png` (180x180)
   - `favicon-32x32.png` (32x32)
   - `favicon-16x16.png` (16x16)

3. Check the browser's Developer Tools:
   - Open DevTools (F12)
   - Go to Application > Manifest
   - Look for any red error messages
   - Verify all icon URLs are accessible

4. Clear browser cache and reload:
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear site data in DevTools > Application > Storage

### PWA Not Installable

**Common causes and solutions:**

1. **Missing HTTPS**: PWAs require HTTPS in production
   - Use `localhost` for development (automatically trusted)
   - Deploy with SSL certificate for production

2. **Invalid Manifest**: Check `manifest.json` syntax
   - Validate JSON syntax
   - Ensure all required fields are present
   - Verify icon paths are correct

3. **Missing Service Worker**: PWAs need a service worker
   - Check if `sw.js` exists and is registered
   - Look for service worker errors in DevTools

4. **Browser Support**: Not all browsers support PWA installation
   - Chrome/Edge: Full support
   - Firefox: Limited support
   - Safari: iOS 11.3+ support

### Image Generation Fails

If `npm run generate-images` fails:

1. **Check Sharp dependency**:
   ```bash
   npm install sharp --save
   ```

2. **Manual generation using HTML tool**:
   - Open `public/img/logo-generator.html` in browser
   - Generate and download images manually
   - Place them in `public/img/` directory

3. **Use fallback images**:
   - Copy existing SVG logos as PNG alternatives
   - Use online SVG to PNG converters
   - Ensure proper naming and sizes

## Database Issues

### "Database locked" Error

**Solution:**
1. Stop the server
2. Delete the database file: `rm database/webapps_hub.db`
3. Reinitialize: `npm run init-db`
4. Reseed data: `npm run seed-db`

### "Table doesn't exist" Error

**Solution:**
1. Run database initialization: `npm run init-db`
2. If error persists, delete and recreate database

## Server Issues

### Port Already in Use

**Solution:**
1. Change port in `.env` file:
   ```
   PORT=3001
   ```
2. Or kill the process using the port:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

### "Cannot find module" Errors

**Solution:**
1. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node.js version (requires v16+):
   ```bash
   node --version
   ```

## Admin Dashboard Issues

### Cannot Login

**Solution:**
1. Verify default credentials:
   - Email: `admin@webappshub.com`
   - Password: `admin123`

2. Reset admin password:
   ```bash
   npm run init-db
   ```

3. Check browser console for JavaScript errors

### Dashboard Not Loading

**Solution:**
1. Check if admin assets exist:
   - `public/admin/index.html`
   - `public/admin/css/admin.css`
   - `public/admin/js/admin.js`

2. Verify server is serving static files correctly

## API Issues

### 404 Errors on API Endpoints

**Solution:**
1. Verify server is running on correct port
2. Check API routes are properly registered in `server.js`
3. Ensure middleware is correctly configured

### CORS Errors

**Solution:**
1. Check CORS configuration in `server.js`
2. Verify frontend and backend are on same domain/port
3. Update CORS origins if needed

## Performance Issues

### Slow Loading

**Solution:**
1. Enable compression (already configured)
2. Optimize images (use WebP format)
3. Implement caching strategies
4. Use CDN for static assets

### High Memory Usage

**Solution:**
1. Monitor database connections
2. Implement connection pooling
3. Add request rate limiting
4. Optimize database queries

## Development Issues

### Hot Reload Not Working

**Solution:**
1. Use `npm run dev` instead of `npm start`
2. Install nodemon globally: `npm install -g nodemon`
3. Check file watching permissions

### Environment Variables Not Loading

**Solution:**
1. Verify `.env` file exists in root directory
2. Check `.env` file syntax (no spaces around =)
3. Restart server after changing environment variables

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: Look at server console output for error messages
2. **Browser DevTools**: Check Console and Network tabs for errors
3. **Verify setup**: Run the complete setup process again
4. **Check dependencies**: Ensure all npm packages are installed correctly
5. **Environment**: Verify Node.js version and system requirements

## Quick Fixes

### Complete Reset
```bash
# Stop server
# Delete database and node_modules
rm -rf database node_modules package-lock.json
# Reinstall and setup
npm install
node setup.js
npm start
```

### Regenerate All Assets
```bash
npm run generate-images
```

### Reset Database Only
```bash
npm run init-db
npm run seed-db
```

### Check System Status
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if port is available
lsof -i :3000

# Check disk space
df -h
```

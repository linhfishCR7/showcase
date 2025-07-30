# 🚀 WebApps Hub - Dynamic Showcase with Admin Dashboard

A comprehensive, database-driven web application showcase with full admin functionality. This dynamic platform allows easy management of applications, content, and user interactions through a powerful admin dashboard.

## 📁 Project Structure

This showcase references standalone applications deployed on GitHub Pages:
- **Expense Tracker:** https://linhfishcr7.github.io/expense-tracker/
- **Digital Drawing Canvas:** https://linhfishcr7.github.io/digital-drawing-canvas/

The showcase itself is a Node.js application configured for **Netlify deployment** with serverless functions that displays and links to these deployed applications.

## ✨ Features

### 🎯 Frontend Features
- **Dynamic Content Loading**: All content loaded from database via REST APIs
- **Real-time Search & Filtering**: Find apps by name, description, or category
- **Progressive Web App**: Full PWA support with offline functionality
- **Responsive Design**: Works perfectly on all devices
- **Dark/Light Theme**: User preference with persistence
- **Interactive Animations**: Smooth scroll animations and transitions
- **User Analytics**: Track app launches, installs, and user interactions

### ⚙️ Admin Dashboard
- **Secure Authentication**: JWT-based admin login system
- **Application Management**: Add, edit, delete, and manage applications
- **Content Management**: Edit hero section, about content, and contact info
- **Testimonials Management**: Manage user testimonials and reviews
- **Message Management**: View and respond to contact form submissions
- **Newsletter Management**: Manage email subscribers
- **Analytics Dashboard**: View user engagement and app statistics
- **File Upload**: Handle image uploads for logos and screenshots

### 🗄️ Backend Features
- **SQLite Database**: Lightweight, file-based database
- **RESTful APIs**: Clean API endpoints for all operations
- **Input Validation**: Comprehensive data validation and sanitization
- **Rate Limiting**: Protect against abuse and spam
- **Security Headers**: Helmet.js for security best practices
- **Error Handling**: Comprehensive error handling and logging

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **CSS3** - Modern styling with custom properties
- **HTML5** - Semantic markup
- **PWA** - Progressive Web App standards

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

#### Quick Setup (Recommended)
```bash
git clone <repository-url>
cd app-showcase-dynamic
node setup.js
npm start
```

#### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app-showcase-dynamic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Seed with sample data** (optional)
   ```bash
   npm run seed-db
   ```

6. **Generate image assets**
   ```bash
   npm run generate-images
   ```

7. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - API: http://localhost:3000/api

### Default Admin Credentials
- **Email**: Set via `ADMIN_EMAIL` environment variable
- **Password**: Set via `ADMIN_PASSWORD` environment variable

⚠️ **Important**: Configure secure admin credentials via environment variables!

## 🚀 Netlify Deployment

This project is configured for deployment on Netlify with serverless functions:

### Quick Deploy
1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Netlify**: Link your repository in the Netlify dashboard
3. **Configure Build Settings**:
   - Base directory: `app-showcase-dynamic`
   - Build command: `npm run build`
   - Publish directory: `app-showcase-dynamic/public`
   - Functions directory: `app-showcase-dynamic/netlify/functions`
4. **Set Environment Variables** in Netlify dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX_REQUESTS=100
   ```
5. **Deploy**: Netlify will automatically build and deploy your site

📖 **Detailed Instructions**: See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete deployment guide.

## 📁 Project Structure

```
app-showcase-dynamic/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── api.js               # Public API routes
│   ├── admin.js             # Admin API routes
│   └── auth.js              # Authentication routes
├── scripts/
│   ├── init-database.js     # Database initialization
│   └── seed-database.js     # Sample data seeding
├── public/
│   ├── admin/               # Admin dashboard files
│   │   ├── index.html
│   │   ├── css/admin.css
│   │   └── js/admin.js
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   └── script.js        # Main JavaScript
│   ├── img/                 # Images and logos
│   ├── index.html           # Main application
│   └── manifest.json        # PWA manifest
├── uploads/                 # File uploads directory
├── database/                # SQLite database files
├── server.js                # Main server file
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database/webapps_hub.db

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Database Schema

### Applications Table
- Application details, features, categories, and statistics
- Launch and install tracking
- Status management (active/inactive)

### Admin Users Table
- Admin authentication and user management
- Role-based access control

### Testimonials Table
- User testimonials and reviews
- Rating system and status management

### Contact Messages Table
- Contact form submissions
- Status tracking (read/unread)

### Newsletter Subscribers Table
- Email subscription management
- Subscription status tracking

### Site Content Table
- Dynamic content management
- Section-based content storage

### Analytics Table
- User interaction tracking
- Event logging and statistics

## 🎨 Admin Dashboard Features

### Dashboard Overview
- Real-time statistics and metrics
- Recent activity feed
- Quick action buttons
- System health indicators

### Application Management
- Add new applications with rich details
- Edit existing application information
- Upload logos and screenshots
- Manage application status and visibility
- Track launch and install statistics

### Content Management System
- Edit hero section content and statistics
- Manage about section features and descriptions
- Update contact information and methods
- Dynamic content updates without code changes

### User Interaction Management
- View and respond to contact messages
- Manage newsletter subscribers
- Moderate user testimonials and reviews
- Track user engagement analytics

### Security Features
- Secure JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and request validation
- CSRF protection and security headers

## 🔒 Security

### Authentication
- JWT tokens with expiration
- Secure password hashing
- Session management
- Role-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Rate Limiting
- API endpoint protection
- Configurable limits
- IP-based tracking

## 🎨 Image Assets

### Automatic Generation
The application includes a comprehensive image generation system that creates all required assets:

```bash
npm run generate-images
```

### Generated Assets
- **logo.png** (512x512) - Main PWA icon for manifest
- **logo-192.png** (192x192) - Standard PWA icon
- **apple-touch-icon.png** (180x180) - iOS home screen icon
- **favicon-32x32.png** (32x32) - Standard favicon
- **favicon-16x16.png** (16x16) - Small favicon
- **screenshot-wide.png** (1280x720) - PWA store screenshot (desktop)
- **screenshot-narrow.png** (720x1280) - PWA store screenshot (mobile)
- **og-image.png** (1200x630) - Open Graph image for social sharing
- **default-app-logo.png** (200x200) - Fallback logo for apps

### Logo Design
The WebApps Hub logo features:
- **Central Hub Design**: Represents the ecosystem concept
- **Connected App Icons**: Shows expense tracker ($), drawing canvas (🎨), and future apps
- **Gradient Colors**: Uses brand colors (#667eea to #764ba2)
- **Scalable Vector Graphics**: Clean appearance at all sizes
- **Professional Branding**: Consistent across all platforms

### Manual Generation
If you need to regenerate specific assets or customize the design:

1. **Use the HTML Generator**:
   - Open `public/img/logo-generator.html` in your browser
   - Generate and download individual assets
   - Customize colors and design elements

2. **Use the Node.js Script**:
   - Edit `scripts/generate-images.js`
   - Modify the SVG generation functions
   - Run `npm run generate-images`

## 📱 PWA Features

### Installation
- Add to home screen capability
- Standalone app experience
- Custom splash screen
- App icons and metadata (auto-generated)

### Offline Support
- Service worker implementation
- Cache strategies
- Offline fallbacks
- Background sync

### Performance
- Lazy loading
- Image optimization
- Code splitting
- Efficient caching

## 🚀 Deployment

### Production Setup

1. **Set environment to production**
   ```bash
   NODE_ENV=production
   ```

2. **Use a process manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name webapps-hub
   ```

3. **Set up reverse proxy** (nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **Enable HTTPS** with Let's Encrypt or SSL certificate

### Database Backup
```bash
# Backup database
cp database/webapps_hub.db database/backup-$(date +%Y%m%d).db

# Restore database
cp database/backup-20240101.db database/webapps_hub.db
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub issues
- **Email**: Contact admin for support

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by best practices in web development
- Designed for scalability and maintainability

---

**WebApps Hub** - The ultimate platform for showcasing and managing web applications! 🌟

class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('admin_token');
        this.user = null;
        this.currentPage = 'dashboard';
        this.theme = localStorage.getItem('admin_theme') || 'light';
        
        this.init();
    }

    async init() {
        this.initializeTheme();
        
        if (this.token) {
            try {
                await this.verifyToken();
                this.showDashboard();
            } catch (error) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        this.initializeEventListeners();
        this.hideLoadingOverlay();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentPage());
        }

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // Add buttons
        const addAppBtn = document.getElementById('add-app-btn');
        if (addAppBtn) {
            addAppBtn.addEventListener('click', () => this.showAddApplicationModal());
        }

        const addTestimonialBtn = document.getElementById('add-testimonial-btn');
        if (addTestimonialBtn) {
            addTestimonialBtn.addEventListener('click', () => this.showAddTestimonialModal());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const loginBtn = document.getElementById('login-btn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnSpinner = loginBtn.querySelector('.btn-spinner');
        const errorDiv = document.getElementById('login-error');
        
        // Show loading state
        btnText.style.display = 'none';
        btnSpinner.style.display = 'flex';
        loginBtn.disabled = true;
        errorDiv.style.display = 'none';
        
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('admin_token', this.token);
                
                this.showNotification('Login successful!', 'success');
                this.showDashboard();
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    async verifyToken() {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token verification failed');
        }
        
        const data = await response.json();
        this.user = data.user;
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.token = null;
        this.user = null;
        localStorage.removeItem('admin_token');
        
        this.showNotification('Logged out successfully', 'success');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('dashboard-container').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'flex';
        
        // Update user info
        if (this.user) {
            document.getElementById('user-name').textContent = this.user.name;
            document.getElementById('user-role').textContent = this.user.role;
        }
        
        // Load dashboard data
        this.loadDashboardStats();
        this.loadRecentActivity();
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const page = link.dataset.page;
        
        if (page && page !== this.currentPage) {
            this.navigateToPage(page);
        }
    }

    navigateToPage(page) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.style.display = 'none';
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }
        
        // Update page title
        const pageTitle = document.getElementById('page-title');
        pageTitle.textContent = this.getPageTitle(page);
        
        // Load page data
        this.loadPageData(page);
        
        this.currentPage = page;
        
        // Update URL without page reload
        history.pushState({ page }, '', `#${page}`);
    }

    getPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            applications: 'Applications',
            testimonials: 'Testimonials',
            messages: 'Messages',
            newsletter: 'Newsletter',
            content: 'Content',
            analytics: 'Analytics'
        };
        return titles[page] || 'Dashboard';
    }

    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.loadDashboardStats();
                await this.loadRecentActivity();
                break;
            case 'applications':
                await this.loadApplications();
                break;
            case 'testimonials':
                await this.loadTestimonials();
                break;
            case 'messages':
                await this.loadMessages();
                break;
            case 'newsletter':
                await this.loadNewsletterSubscribers();
                break;
            case 'content':
                await this.loadContent();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('/admin/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load stats');
            
            const stats = await response.json();
            
            // Update stat cards
            document.getElementById('total-apps').textContent = stats.totalApps;
            document.getElementById('active-apps').textContent = stats.activeApps;
            document.getElementById('unread-messages').textContent = stats.unreadMessages;
            document.getElementById('newsletter-subscribers').textContent = stats.newsletterSubscribers;
            document.getElementById('total-launches').textContent = stats.totalLaunches;
            document.getElementById('total-installs').textContent = stats.totalInstalls;
            
            // Update messages badge
            const messagesBadge = document.getElementById('messages-badge');
            if (messagesBadge) {
                messagesBadge.textContent = stats.unreadMessages;
                messagesBadge.style.display = stats.unreadMessages > 0 ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showNotification('Failed to load dashboard statistics', 'error');
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch('/admin/api/analytics?days=7', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load activity');
            
            const data = await response.json();
            const activityList = document.getElementById('recent-activity');
            
            if (data.analytics.length === 0) {
                activityList.innerHTML = `
                    <div class="activity-item">
                        <div class="activity-icon">📊</div>
                        <div class="activity-content">
                            <div class="activity-text">No recent activity</div>
                            <div class="activity-time">Start using your apps to see activity here</div>
                        </div>
                    </div>
                `;
                return;
            }
            
            const recentActivities = data.analytics.slice(0, 5);
            activityList.innerHTML = recentActivities.map(activity => {
                const icon = this.getActivityIcon(activity.event_type);
                const text = this.getActivityText(activity);
                const time = this.formatTimeAgo(activity.created_at);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">${icon}</div>
                        <div class="activity-content">
                            <div class="activity-text">${text}</div>
                            <div class="activity-time">${time}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    getActivityIcon(eventType) {
        const icons = {
            app_launch: '🚀',
            app_install: '📥',
            contact_form_submit: '📧',
            newsletter_subscribe: '📬',
            admin_login: '🔐',
            admin_logout: '🚪'
        };
        return icons[eventType] || '📊';
    }

    getActivityText(activity) {
        const texts = {
            app_launch: 'App launched',
            app_install: 'App installed',
            contact_form_submit: 'Contact form submitted',
            newsletter_subscribe: 'Newsletter subscription',
            admin_login: 'Admin logged in',
            admin_logout: 'Admin logged out'
        };
        return texts[activity.event_type] || 'Unknown activity';
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('admin_theme', this.theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    refreshCurrentPage() {
        this.loadPageData(this.currentPage);
        this.showNotification('Page refreshed', 'success');
    }

    handleQuickAction(e) {
        const action = e.currentTarget.dataset.action;
        
        switch (action) {
            case 'add-app':
                this.navigateToPage('applications');
                setTimeout(() => this.showAddApplicationModal(), 100);
                break;
            case 'add-testimonial':
                this.navigateToPage('testimonials');
                setTimeout(() => this.showAddTestimonialModal(), 100);
                break;
            case 'view-messages':
                this.navigateToPage('messages');
                break;
            case 'edit-content':
                this.navigateToPage('content');
                break;
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('hidden');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Placeholder methods for other functionality
    async loadApplications() {
        console.log('Loading applications...');
        // Implementation will be added
    }

    async loadTestimonials() {
        console.log('Loading testimonials...');
        // Implementation will be added
    }

    async loadMessages() {
        console.log('Loading messages...');
        // Implementation will be added
    }

    async loadNewsletterSubscribers() {
        console.log('Loading newsletter subscribers...');
        // Implementation will be added
    }

    async loadContent() {
        console.log('Loading content...');
        // Implementation will be added
    }

    async loadAnalytics() {
        console.log('Loading analytics...');
        // Implementation will be added
    }

    showAddApplicationModal() {
        console.log('Show add application modal');
        // Implementation will be added
    }

    showAddTestimonialModal() {
        console.log('Show add testimonial modal');
        // Implementation will be added
    }
}

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

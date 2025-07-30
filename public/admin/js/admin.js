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

    // Application Management Methods
    async loadApplications() {
        try {
            const response = await this.apiCall('/admin/api/applications');
            const applications = response.applications || [];

            const tbody = document.getElementById('applications-tbody');
            if (!tbody) return;

            if (applications.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No applications found</td></tr>';
                return;
            }

            tbody.innerHTML = applications.map(app => `
                <tr>
                    <td>
                        <div class="app-info">
                            ${app.logo_url ? `<img src="${app.logo_url}" alt="${app.name}" class="app-logo">` : '<div class="app-logo-placeholder">📱</div>'}
                            <div class="app-details">
                                <div class="app-name">${this.escapeHtml(app.name)}</div>
                                <div class="app-short-name">${this.escapeHtml(app.short_name)}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="category-badge">${this.escapeHtml(app.category)}</span></td>
                    <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                    <td>${app.launch_count || 0}</td>
                    <td>${app.install_count || 0}</td>
                    <td>${new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editApplication(${app.id})" title="Edit Application">
                                <span class="btn-icon">✏️</span>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="adminDashboard.viewApplication(${app.id})" title="View Details">
                                <span class="btn-icon">👁️</span>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteApplication(${app.id})" title="Delete Application">
                                <span class="btn-icon">🗑️</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showNotification('Error loading applications', 'error');
        }
    }

    showAddApplicationModal() {
        const modal = this.createModal('Add New Application', this.getApplicationFormHTML(), 'large');
        this.setupApplicationForm(modal);
    }

    async editApplication(id) {
        try {
            const response = await this.apiCall(`/admin/api/applications/${id}`);
            const app = response.application;

            const modal = this.createModal('Edit Application', this.getApplicationFormHTML(app), 'large');
            this.setupApplicationForm(modal, app);
        } catch (error) {
            console.error('Error loading application:', error);
            this.showNotification('Error loading application', 'error');
        }
    }

    async viewApplication(id) {
        try {
            const response = await this.apiCall(`/admin/api/applications/${id}`);
            const app = response.application;

            const modal = this.createModal('Application Details', this.getApplicationViewHTML(app), 'large');
        } catch (error) {
            console.error('Error loading application:', error);
            this.showNotification('Error loading application', 'error');
        }
    }

    async deleteApplication(id) {
        if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            return;
        }

        try {
            await this.apiCall(`/admin/api/applications/${id}`, 'DELETE');
            this.showNotification('Application deleted successfully', 'success');
            this.loadApplications();
        } catch (error) {
            console.error('Error deleting application:', error);
            this.showNotification('Error deleting application', 'error');
        }
    }

    getApplicationFormHTML(app = null) {
        const isEdit = app !== null;
        return `
            <form id="application-form" class="admin-form" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label for="app-name">Application Name *</label>
                        <input type="text" id="app-name" name="name" value="${app ? this.escapeHtml(app.name) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="app-short-name">Short Name *</label>
                        <input type="text" id="app-short-name" name="short_name" value="${app ? this.escapeHtml(app.short_name) : ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="app-category">Category *</label>
                        <select id="app-category" name="category" required>
                            <option value="">Select Category</option>
                            <option value="productivity" ${app && app.category === 'productivity' ? 'selected' : ''}>Productivity</option>
                            <option value="creative" ${app && app.category === 'creative' ? 'selected' : ''}>Creative</option>
                            <option value="finance" ${app && app.category === 'finance' ? 'selected' : ''}>Finance</option>
                            <option value="utility" ${app && app.category === 'utility' ? 'selected' : ''}>Utility</option>
                            <option value="entertainment" ${app && app.category === 'entertainment' ? 'selected' : ''}>Entertainment</option>
                            <option value="education" ${app && app.category === 'education' ? 'selected' : ''}>Education</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="app-status">Status</label>
                        <select id="app-status" name="status">
                            <option value="active" ${app && app.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${app && app.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="app-description">Short Description *</label>
                    <textarea id="app-description" name="description" rows="3" required>${app ? this.escapeHtml(app.description) : ''}</textarea>
                </div>

                <div class="form-group">
                    <label for="app-long-description">Long Description</label>
                    <textarea id="app-long-description" name="long_description" rows="6">${app ? this.escapeHtml(app.long_description || '') : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="app-url">Application URL *</label>
                        <input type="url" id="app-url" name="app_url" value="${app ? this.escapeHtml(app.app_url) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="app-install-url">Install URL</label>
                        <input type="url" id="app-install-url" name="install_url" value="${app ? this.escapeHtml(app.install_url || '') : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="app-tags">Tags (comma-separated)</label>
                    <input type="text" id="app-tags" name="tags" value="${app ? this.escapeHtml(app.tags || '') : ''}" placeholder="e.g., productivity, task-management, collaboration">
                </div>

                <div class="form-group">
                    <label for="app-features">Features (one per line)</label>
                    <textarea id="app-features" name="features" rows="4" placeholder="Feature 1&#10;Feature 2&#10;Feature 3">${app ? this.escapeHtml(app.features || '') : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="app-logo">Logo Image</label>
                        <div class="file-upload-area">
                            <input type="file" id="app-logo" name="logo" accept="image/*" class="file-input">
                            <div class="file-upload-display">
                                ${app && app.logo_url ? `<img src="${app.logo_url}" alt="Current logo" class="current-image">` : ''}
                                <div class="file-upload-text">
                                    <span class="upload-icon">📁</span>
                                    <span>Choose logo image or drag & drop</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="app-screenshot">Screenshot</label>
                        <div class="file-upload-area">
                            <input type="file" id="app-screenshot" name="screenshot" accept="image/*" class="file-input">
                            <div class="file-upload-display">
                                ${app && app.screenshot_url ? `<img src="${app.screenshot_url}" alt="Current screenshot" class="current-image">` : ''}
                                <div class="file-upload-text">
                                    <span class="upload-icon">📁</span>
                                    <span>Choose screenshot or drag & drop</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-text">${isEdit ? 'Update' : 'Create'} Application</span>
                        <span class="btn-spinner" style="display: none;">
                            <div class="spinner"></div>
                        </span>
                    </button>
                </div>
            </form>
        `;
    }

    getApplicationViewHTML(app) {
        return `
            <div class="app-view">
                <div class="app-header">
                    <div class="app-logo-large">
                        ${app.logo_url ? `<img src="${app.logo_url}" alt="${app.name}">` : '<div class="app-logo-placeholder">📱</div>'}
                    </div>
                    <div class="app-info">
                        <h2>${this.escapeHtml(app.name)}</h2>
                        <p class="app-short-name">${this.escapeHtml(app.short_name)}</p>
                        <div class="app-badges">
                            <span class="category-badge">${this.escapeHtml(app.category)}</span>
                            <span class="status-badge status-${app.status}">${app.status}</span>
                        </div>
                    </div>
                </div>

                <div class="app-details">
                    <div class="detail-section">
                        <h3>Description</h3>
                        <p>${this.escapeHtml(app.description)}</p>
                        ${app.long_description ? `<p>${this.escapeHtml(app.long_description)}</p>` : ''}
                    </div>

                    <div class="detail-section">
                        <h3>URLs</h3>
                        <p><strong>App URL:</strong> <a href="${app.app_url}" target="_blank">${this.escapeHtml(app.app_url)}</a></p>
                        ${app.install_url ? `<p><strong>Install URL:</strong> <a href="${app.install_url}" target="_blank">${this.escapeHtml(app.install_url)}</a></p>` : ''}
                    </div>

                    ${app.tags ? `
                        <div class="detail-section">
                            <h3>Tags</h3>
                            <div class="tags">
                                ${app.tags.split(',').map(tag => `<span class="tag">${this.escapeHtml(tag.trim())}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${app.features ? `
                        <div class="detail-section">
                            <h3>Features</h3>
                            <ul class="features-list">
                                ${app.features.split('\n').filter(f => f.trim()).map(feature => `<li>${this.escapeHtml(feature.trim())}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h3>Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Launches</span>
                                <span class="stat-value">${app.launch_count || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Installs</span>
                                <span class="stat-value">${app.install_count || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Rating</span>
                                <span class="stat-value">${app.rating || 0}/5</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Reviews</span>
                                <span class="stat-value">${app.rating_count || 0}</span>
                            </div>
                        </div>
                    </div>

                    ${app.screenshot_url ? `
                        <div class="detail-section">
                            <h3>Screenshot</h3>
                            <img src="${app.screenshot_url}" alt="${app.name} screenshot" class="app-screenshot">
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h3>Metadata</h3>
                        <p><strong>Created:</strong> ${new Date(app.created_at).toLocaleString()}</p>
                        <p><strong>Updated:</strong> ${new Date(app.updated_at).toLocaleString()}</p>
                    </div>
                </div>

                <div class="app-actions">
                    <button class="btn btn-primary" onclick="adminDashboard.editApplication(${app.id})">Edit Application</button>
                    <button class="btn btn-danger" onclick="adminDashboard.deleteApplication(${app.id})">Delete Application</button>
                </div>
            </div>
        `;
    }

    setupApplicationForm(modal, app = null) {
        const form = modal.querySelector('#application-form');
        const isEdit = app !== null;

        // Setup file upload areas
        this.setupFileUploadAreas(form);

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnSpinner = submitBtn.querySelector('.btn-spinner');

            // Show loading state
            btnText.style.display = 'none';
            btnSpinner.style.display = 'flex';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);

                const url = isEdit ? `/admin/api/applications/${app.id}` : '/admin/api/applications';
                const method = isEdit ? 'PUT' : 'POST';

                await this.apiCall(url, method, formData, true); // true for FormData

                this.showNotification(`Application ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                modal.remove();
                this.loadApplications();

            } catch (error) {
                console.error('Error saving application:', error);
                this.showNotification(`Error ${isEdit ? 'updating' : 'creating'} application`, 'error');
            } finally {
                // Reset loading state
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    setupFileUploadAreas(container) {
        const uploadAreas = container.querySelectorAll('.file-upload-area');

        uploadAreas.forEach(area => {
            const input = area.querySelector('.file-input');
            const display = area.querySelector('.file-upload-display');

            // Click to upload
            display.addEventListener('click', () => input.click());

            // File selection
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.previewFile(file, display);
                }
            });

            // Drag and drop
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('drag-over');
            });

            area.addEventListener('dragleave', () => {
                area.classList.remove('drag-over');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('drag-over');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    this.previewFile(files[0], display);
                }
            });
        });
    }

    previewFile(file, display) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const existingImage = display.querySelector('.current-image');
                if (existingImage) {
                    existingImage.src = e.target.result;
                } else {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'current-image';
                    img.alt = 'Preview';
                    display.insertBefore(img, display.querySelector('.file-upload-text'));
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // Testimonials Management Methods
    async loadTestimonials() {
        try {
            const response = await this.apiCall('/admin/api/testimonials');
            const testimonials = response.testimonials || [];

            const container = document.getElementById('testimonials-content');
            if (!container) return;

            if (testimonials.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💬</div>
                        <h3>No testimonials found</h3>
                        <p>Add your first testimonial to get started.</p>
                        <button class="btn btn-primary" onclick="adminDashboard.showAddTestimonialModal()">Add Testimonial</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="testimonials-grid">
                    ${testimonials.map(testimonial => `
                        <div class="testimonial-card">
                            <div class="testimonial-header">
                                <div class="testimonial-avatar">
                                    ${testimonial.avatar_url ? `<img src="${testimonial.avatar_url}" alt="${testimonial.name}">` : '<div class="avatar-placeholder">👤</div>'}
                                </div>
                                <div class="testimonial-info">
                                    <h4>${this.escapeHtml(testimonial.name)}</h4>
                                    ${testimonial.title ? `<p class="testimonial-title">${this.escapeHtml(testimonial.title)}</p>` : ''}
                                    <div class="testimonial-rating">
                                        ${'★'.repeat(testimonial.rating || 5)}${'☆'.repeat(5 - (testimonial.rating || 5))}
                                    </div>
                                </div>
                                <div class="testimonial-status">
                                    <span class="status-badge status-${testimonial.status}">${testimonial.status}</span>
                                </div>
                            </div>
                            <div class="testimonial-content">
                                <p>"${this.escapeHtml(testimonial.content)}"</p>
                            </div>
                            <div class="testimonial-actions">
                                <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editTestimonial(${testimonial.id})" title="Edit Testimonial">
                                    <span class="btn-icon">✏️</span>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteTestimonial(${testimonial.id})" title="Delete Testimonial">
                                    <span class="btn-icon">🗑️</span>
                                </button>
                            </div>
                            <div class="testimonial-meta">
                                <small>Created: ${new Date(testimonial.created_at).toLocaleDateString()}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading testimonials:', error);
            this.showNotification('Error loading testimonials', 'error');
        }
    }

    showAddTestimonialModal() {
        const modal = this.createModal('Add New Testimonial', this.getTestimonialFormHTML(), 'medium');
        this.setupTestimonialForm(modal);
    }

    async editTestimonial(id) {
        try {
            const response = await this.apiCall(`/admin/api/testimonials/${id}`);
            const testimonial = response.testimonial;

            const modal = this.createModal('Edit Testimonial', this.getTestimonialFormHTML(testimonial), 'medium');
            this.setupTestimonialForm(modal, testimonial);
        } catch (error) {
            console.error('Error loading testimonial:', error);
            this.showNotification('Error loading testimonial', 'error');
        }
    }

    async deleteTestimonial(id) {
        if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
            return;
        }

        try {
            await this.apiCall(`/admin/api/testimonials/${id}`, 'DELETE');
            this.showNotification('Testimonial deleted successfully', 'success');
            this.loadTestimonials();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            this.showNotification('Error deleting testimonial', 'error');
        }
    }

    getTestimonialFormHTML(testimonial = null) {
        const isEdit = testimonial !== null;
        return `
            <form id="testimonial-form" class="admin-form" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label for="testimonial-name">Name *</label>
                        <input type="text" id="testimonial-name" name="name" value="${testimonial ? this.escapeHtml(testimonial.name) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="testimonial-title">Title/Position</label>
                        <input type="text" id="testimonial-title" name="title" value="${testimonial ? this.escapeHtml(testimonial.title || '') : ''}" placeholder="e.g., CEO, Developer, Student">
                    </div>
                </div>

                <div class="form-group">
                    <label for="testimonial-content">Testimonial Content *</label>
                    <textarea id="testimonial-content" name="content" rows="4" required placeholder="Share your experience...">${testimonial ? this.escapeHtml(testimonial.content) : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="testimonial-rating">Rating</label>
                        <select id="testimonial-rating" name="rating">
                            <option value="5" ${testimonial && testimonial.rating === 5 ? 'selected' : ''}>5 Stars - Excellent</option>
                            <option value="4" ${testimonial && testimonial.rating === 4 ? 'selected' : ''}>4 Stars - Very Good</option>
                            <option value="3" ${testimonial && testimonial.rating === 3 ? 'selected' : ''}>3 Stars - Good</option>
                            <option value="2" ${testimonial && testimonial.rating === 2 ? 'selected' : ''}>2 Stars - Fair</option>
                            <option value="1" ${testimonial && testimonial.rating === 1 ? 'selected' : ''}>1 Star - Poor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="testimonial-status">Status</label>
                        <select id="testimonial-status" name="status">
                            <option value="active" ${testimonial && testimonial.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${testimonial && testimonial.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="testimonial-avatar">Avatar Image</label>
                    <div class="file-upload-area">
                        <input type="file" id="testimonial-avatar" name="avatar" accept="image/*" class="file-input">
                        <div class="file-upload-display">
                            ${testimonial && testimonial.avatar_url ? `<img src="${testimonial.avatar_url}" alt="Current avatar" class="current-image">` : ''}
                            <div class="file-upload-text">
                                <span class="upload-icon">📁</span>
                                <span>Choose avatar image or drag & drop</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-text">${isEdit ? 'Update' : 'Create'} Testimonial</span>
                        <span class="btn-spinner" style="display: none;">
                            <div class="spinner"></div>
                        </span>
                    </button>
                </div>
            </form>
        `;
    }

    setupTestimonialForm(modal, testimonial = null) {
        const form = modal.querySelector('#testimonial-form');
        const isEdit = testimonial !== null;

        // Setup file upload areas
        this.setupFileUploadAreas(form);

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnSpinner = submitBtn.querySelector('.btn-spinner');

            // Show loading state
            btnText.style.display = 'none';
            btnSpinner.style.display = 'flex';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);

                const url = isEdit ? `/admin/api/testimonials/${testimonial.id}` : '/admin/api/testimonials';
                const method = isEdit ? 'PUT' : 'POST';

                await this.apiCall(url, method, formData, true); // true for FormData

                this.showNotification(`Testimonial ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                modal.remove();
                this.loadTestimonials();

            } catch (error) {
                console.error('Error saving testimonial:', error);
                this.showNotification(`Error ${isEdit ? 'updating' : 'creating'} testimonial`, 'error');
            } finally {
                // Reset loading state
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // Messages Management Methods
    async loadMessages() {
        try {
            const response = await this.apiCall('/admin/api/contact-messages');
            const messages = response.messages || [];

            const container = document.getElementById('messages-content');
            if (!container) return;

            if (messages.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📧</div>
                        <h3>No messages found</h3>
                        <p>Contact messages will appear here when users submit the contact form.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="messages-list">
                    ${messages.map(message => `
                        <div class="message-card ${message.status === 'unread' ? 'unread' : ''}">
                            <div class="message-header">
                                <div class="message-info">
                                    <h4>${this.escapeHtml(message.name)}</h4>
                                    <p class="message-email">${this.escapeHtml(message.email)}</p>
                                    ${message.subject ? `<p class="message-subject">${this.escapeHtml(message.subject)}</p>` : ''}
                                </div>
                                <div class="message-meta">
                                    <span class="status-badge status-${message.status}">${message.status}</span>
                                    <small class="message-date">${new Date(message.created_at).toLocaleString()}</small>
                                </div>
                            </div>
                            <div class="message-content">
                                <p>${this.escapeHtml(message.message)}</p>
                            </div>
                            <div class="message-actions">
                                ${message.status === 'unread' ? `
                                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.markMessageRead(${message.id})">Mark as Read</button>
                                ` : ''}
                                <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteMessage(${message.id})">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Error loading messages', 'error');
        }
    }

    async markMessageRead(id) {
        try {
            await this.apiCall(`/admin/api/contact-messages/${id}`, 'PUT', { status: 'read' });
            this.showNotification('Message marked as read', 'success');
            this.loadMessages();
            this.loadDashboardStats(); // Update unread count
        } catch (error) {
            console.error('Error marking message as read:', error);
            this.showNotification('Error updating message', 'error');
        }
    }

    async deleteMessage(id) {
        if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            return;
        }

        try {
            await this.apiCall(`/admin/api/contact-messages/${id}`, 'DELETE');
            this.showNotification('Message deleted successfully', 'success');
            this.loadMessages();
            this.loadDashboardStats(); // Update counts
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification('Error deleting message', 'error');
        }
    }

    async loadNewsletterSubscribers() {
        try {
            const response = await this.apiCall('/admin/api/newsletter-subscribers');
            const subscribers = response.subscribers || [];

            const container = document.getElementById('newsletter-content');
            if (!container) return;

            if (subscribers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📬</div>
                        <h3>No subscribers found</h3>
                        <p>Newsletter subscribers will appear here when users sign up.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="subscribers-list">
                    <div class="subscribers-header">
                        <h3>Newsletter Subscribers (${subscribers.length})</h3>
                        <div class="subscribers-actions">
                            <button class="btn btn-primary btn-sm" onclick="adminDashboard.exportSubscribers()">
                                <span class="btn-icon">📥</span>
                                Export CSV
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Subscribed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subscribers.map(subscriber => `
                                    <tr>
                                        <td>${this.escapeHtml(subscriber.email)}</td>
                                        <td><span class="status-badge status-${subscriber.status}">${subscriber.status}</span></td>
                                        <td>${new Date(subscriber.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div class="action-buttons">
                                                ${subscriber.status === 'active' ? `
                                                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.unsubscribeUser(${subscriber.id})" title="Unsubscribe">
                                                        <span class="btn-icon">🚫</span>
                                                    </button>
                                                ` : `
                                                    <button class="btn btn-sm btn-success" onclick="adminDashboard.resubscribeUser(${subscriber.id})" title="Resubscribe">
                                                        <span class="btn-icon">✅</span>
                                                    </button>
                                                `}
                                                <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteSubscriber(${subscriber.id})" title="Delete">
                                                    <span class="btn-icon">🗑️</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading newsletter subscribers:', error);
            this.showNotification('Error loading subscribers', 'error');
        }
    }

    async unsubscribeUser(id) {
        try {
            await this.apiCall(`/admin/api/newsletter-subscribers/${id}`, 'PUT', { status: 'inactive' });
            this.showNotification('User unsubscribed', 'success');
            this.loadNewsletterSubscribers();
        } catch (error) {
            console.error('Error unsubscribing user:', error);
            this.showNotification('Error updating subscription', 'error');
        }
    }

    async resubscribeUser(id) {
        try {
            await this.apiCall(`/admin/api/newsletter-subscribers/${id}`, 'PUT', { status: 'active' });
            this.showNotification('User resubscribed', 'success');
            this.loadNewsletterSubscribers();
        } catch (error) {
            console.error('Error resubscribing user:', error);
            this.showNotification('Error updating subscription', 'error');
        }
    }

    async deleteSubscriber(id) {
        if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
            return;
        }

        try {
            await this.apiCall(`/admin/api/newsletter-subscribers/${id}`, 'DELETE');
            this.showNotification('Subscriber deleted successfully', 'success');
            this.loadNewsletterSubscribers();
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            this.showNotification('Error deleting subscriber', 'error');
        }
    }

    exportSubscribers() {
        // Simple CSV export functionality
        this.apiCall('/admin/api/newsletter-subscribers')
            .then(response => {
                const subscribers = response.subscribers || [];
                const csvContent = [
                    'Email,Status,Subscribed Date',
                    ...subscribers.map(sub =>
                        `${sub.email},${sub.status},${new Date(sub.created_at).toLocaleDateString()}`
                    )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.showNotification('Subscribers exported successfully', 'success');
            })
            .catch(error => {
                console.error('Error exporting subscribers:', error);
                this.showNotification('Error exporting subscribers', 'error');
            });
    }

    async loadContent() {
        try {
            const response = await this.apiCall('/admin/api/site-content');
            const content = response.content || [];

            const container = document.getElementById('content-content');
            if (!container) return;

            const contentSections = [
                { key: 'hero', title: 'Hero Section', description: 'Main banner and call-to-action' },
                { key: 'about', title: 'About Section', description: 'Information about the platform' },
                { key: 'features', title: 'Features Section', description: 'Key features and benefits' },
                { key: 'stats', title: 'Statistics Section', description: 'Platform statistics and metrics' },
                { key: 'footer', title: 'Footer Content', description: 'Footer links and information' },
                { key: 'contact', title: 'Contact Information', description: 'Contact details and form' }
            ];

            container.innerHTML = `
                <div class="content-sections">
                    ${contentSections.map(section => {
                        const sectionContent = content.find(c => c.section === section.key);
                        return `
                            <div class="content-section-card">
                                <div class="content-section-header">
                                    <div class="content-section-info">
                                        <h3>${section.title}</h3>
                                        <p>${section.description}</p>
                                    </div>
                                    <div class="content-section-actions">
                                        <button class="btn btn-primary btn-sm" onclick="adminDashboard.editContentSection('${section.key}', '${section.title}')">
                                            <span class="btn-icon">✏️</span>
                                            Edit
                                        </button>
                                    </div>
                                </div>
                                <div class="content-section-preview">
                                    ${sectionContent ? `
                                        <div class="content-preview">
                                            <small class="content-meta">Last updated: ${new Date(sectionContent.updated_at).toLocaleDateString()}</small>
                                            <div class="content-snippet">
                                                ${this.getContentPreview(sectionContent.content)}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="content-empty">
                                            <span class="empty-icon">📝</span>
                                            <span>No content configured</span>
                                        </div>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Error loading content', 'error');
        }
    }

    async editContentSection(sectionKey, sectionTitle) {
        try {
            const response = await this.apiCall(`/admin/api/site-content/${sectionKey}`);
            const content = response.content;

            const modal = this.createModal(`Edit ${sectionTitle}`, this.getContentFormHTML(sectionKey, sectionTitle, content), 'large');
            this.setupContentForm(modal, sectionKey);
        } catch (error) {
            // If content doesn't exist, create new
            const modal = this.createModal(`Edit ${sectionTitle}`, this.getContentFormHTML(sectionKey, sectionTitle), 'large');
            this.setupContentForm(modal, sectionKey);
        }
    }

    getContentPreview(content) {
        if (!content) return 'No content';

        try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;

            if (parsed.title) {
                return `<strong>${this.escapeHtml(parsed.title)}</strong>`;
            } else if (parsed.heading) {
                return `<strong>${this.escapeHtml(parsed.heading)}</strong>`;
            } else if (parsed.text) {
                return this.escapeHtml(parsed.text.substring(0, 100) + (parsed.text.length > 100 ? '...' : ''));
            } else {
                return 'Content configured';
            }
        } catch (e) {
            return 'Content configured';
        }
    }

    getContentFormHTML(sectionKey, sectionTitle, content = null) {
        const contentData = content ? (typeof content.content === 'string' ? JSON.parse(content.content) : content.content) : {};

        // Define different form templates based on section type
        const formTemplates = {
            hero: `
                <div class="form-group">
                    <label for="content-title">Main Title *</label>
                    <input type="text" id="content-title" name="title" value="${contentData.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="content-subtitle">Subtitle</label>
                    <input type="text" id="content-subtitle" name="subtitle" value="${contentData.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label for="content-description">Description</label>
                    <textarea id="content-description" name="description" rows="3">${contentData.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="content-cta-text">Call-to-Action Text</label>
                        <input type="text" id="content-cta-text" name="ctaText" value="${contentData.ctaText || ''}">
                    </div>
                    <div class="form-group">
                        <label for="content-cta-url">Call-to-Action URL</label>
                        <input type="url" id="content-cta-url" name="ctaUrl" value="${contentData.ctaUrl || ''}">
                    </div>
                </div>
            `,
            about: `
                <div class="form-group">
                    <label for="content-heading">Section Heading *</label>
                    <input type="text" id="content-heading" name="heading" value="${contentData.heading || ''}" required>
                </div>
                <div class="form-group">
                    <label for="content-text">Content Text *</label>
                    <textarea id="content-text" name="text" rows="6" required>${contentData.text || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="content-image">Image URL</label>
                    <input type="url" id="content-image" name="imageUrl" value="${contentData.imageUrl || ''}">
                </div>
            `,
            features: `
                <div class="form-group">
                    <label for="content-heading">Section Heading *</label>
                    <input type="text" id="content-heading" name="heading" value="${contentData.heading || ''}" required>
                </div>
                <div class="form-group">
                    <label for="content-subtitle">Subtitle</label>
                    <input type="text" id="content-subtitle" name="subtitle" value="${contentData.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label for="content-features">Features (JSON format)</label>
                    <textarea id="content-features" name="features" rows="8" placeholder='[{"icon": "🚀", "title": "Feature 1", "description": "Description"}]'>${JSON.stringify(contentData.features || [], null, 2)}</textarea>
                    <small class="form-help">Enter features as JSON array with icon, title, and description fields.</small>
                </div>
            `,
            contact: `
                <div class="form-group">
                    <label for="content-heading">Section Heading *</label>
                    <input type="text" id="content-heading" name="heading" value="${contentData.heading || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="content-email">Email Address</label>
                        <input type="email" id="content-email" name="email" value="${contentData.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="content-phone">Phone Number</label>
                        <input type="tel" id="content-phone" name="phone" value="${contentData.phone || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="content-address">Address</label>
                    <textarea id="content-address" name="address" rows="3">${contentData.address || ''}</textarea>
                </div>
            `
        };

        const defaultTemplate = `
            <div class="form-group">
                <label for="content-data">Content Data (JSON format)</label>
                <textarea id="content-data" name="contentData" rows="10" placeholder='{"key": "value"}'>${JSON.stringify(contentData, null, 2)}</textarea>
                <small class="form-help">Enter content as JSON object.</small>
            </div>
        `;

        return `
            <form id="content-form" class="admin-form">
                <div class="form-section">
                    <h4>Edit ${sectionTitle}</h4>
                    <p class="form-description">Configure the content for this section of your website.</p>
                </div>

                ${formTemplates[sectionKey] || defaultTemplate}

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-text">Save Content</span>
                        <span class="btn-spinner" style="display: none;">
                            <div class="spinner"></div>
                        </span>
                    </button>
                </div>
            </form>
        `;
    }

    setupContentForm(modal, sectionKey) {
        const form = modal.querySelector('#content-form');

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnSpinner = submitBtn.querySelector('.btn-spinner');

            // Show loading state
            btnText.style.display = 'none';
            btnSpinner.style.display = 'flex';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const contentData = {};

                // Build content object from form data
                for (const [key, value] of formData.entries()) {
                    if (key === 'features' || key === 'contentData') {
                        try {
                            contentData[key === 'contentData' ? 'data' : key] = JSON.parse(value);
                        } catch (e) {
                            contentData[key === 'contentData' ? 'data' : key] = value;
                        }
                    } else {
                        contentData[key] = value;
                    }
                }

                const payload = {
                    section: sectionKey,
                    content: contentData
                };

                await this.apiCall('/admin/api/site-content', 'POST', payload);

                this.showNotification('Content updated successfully', 'success');
                modal.remove();
                this.loadContent();

            } catch (error) {
                console.error('Error saving content:', error);
                this.showNotification('Error saving content', 'error');
            } finally {
                // Reset loading state
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    async loadAnalytics() {
        try {
            const [analyticsResponse, appsResponse] = await Promise.all([
                this.apiCall('/admin/api/analytics?days=30'),
                this.apiCall('/admin/api/applications')
            ]);

            const analytics = analyticsResponse.analytics || [];
            const applications = appsResponse.applications || [];

            const container = document.getElementById('analytics-content');
            if (!container) return;

            // Process analytics data
            const eventCounts = {};
            const dailyStats = {};

            analytics.forEach(event => {
                eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;

                const date = new Date(event.created_at).toDateString();
                if (!dailyStats[date]) {
                    dailyStats[date] = { launches: 0, installs: 0, views: 0 };
                }
                dailyStats[date][event.event_type === 'app_launch' ? 'launches' :
                                event.event_type === 'app_install' ? 'installs' : 'views']++;
            });

            // Get top applications
            const topApps = applications
                .sort((a, b) => (b.launch_count || 0) - (a.launch_count || 0))
                .slice(0, 5);

            container.innerHTML = `
                <div class="analytics-dashboard">
                    <div class="analytics-summary">
                        <div class="summary-card">
                            <div class="summary-icon">📊</div>
                            <div class="summary-content">
                                <div class="summary-number">${analytics.length}</div>
                                <div class="summary-label">Total Events (30 days)</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">🚀</div>
                            <div class="summary-content">
                                <div class="summary-number">${eventCounts.app_launch || 0}</div>
                                <div class="summary-label">App Launches</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">📥</div>
                            <div class="summary-content">
                                <div class="summary-number">${eventCounts.app_install || 0}</div>
                                <div class="summary-label">App Installs</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">👁️</div>
                            <div class="summary-content">
                                <div class="summary-number">${eventCounts.page_view || 0}</div>
                                <div class="summary-label">Page Views</div>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-charts">
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Top Applications</h3>
                                <p>Most launched applications</p>
                            </div>
                            <div class="chart-content">
                                ${topApps.length > 0 ? `
                                    <div class="top-apps-list">
                                        ${topApps.map((app, index) => `
                                            <div class="top-app-item">
                                                <div class="app-rank">#${index + 1}</div>
                                                <div class="app-info">
                                                    <div class="app-name">${this.escapeHtml(app.name)}</div>
                                                    <div class="app-category">${this.escapeHtml(app.category)}</div>
                                                </div>
                                                <div class="app-stats">
                                                    <div class="stat-value">${app.launch_count || 0}</div>
                                                    <div class="stat-label">launches</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="no-data">No application data available</div>'}
                            </div>
                        </div>

                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Event Types</h3>
                                <p>Distribution of events</p>
                            </div>
                            <div class="chart-content">
                                ${Object.keys(eventCounts).length > 0 ? `
                                    <div class="event-types-list">
                                        ${Object.entries(eventCounts).map(([type, count]) => `
                                            <div class="event-type-item">
                                                <div class="event-type-name">${type.replace('_', ' ').toUpperCase()}</div>
                                                <div class="event-type-count">${count}</div>
                                                <div class="event-type-bar">
                                                    <div class="event-type-fill" style="width: ${(count / Math.max(...Object.values(eventCounts))) * 100}%"></div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="no-data">No event data available</div>'}
                            </div>
                        </div>
                    </div>

                    <div class="analytics-details">
                        <div class="details-card">
                            <div class="details-header">
                                <h3>Recent Activity</h3>
                                <p>Latest events from the past 30 days</p>
                            </div>
                            <div class="details-content">
                                ${analytics.length > 0 ? `
                                    <div class="activity-timeline">
                                        ${analytics.slice(0, 10).map(event => `
                                            <div class="activity-item">
                                                <div class="activity-icon">
                                                    ${event.event_type === 'app_launch' ? '🚀' :
                                                      event.event_type === 'app_install' ? '📥' : '👁️'}
                                                </div>
                                                <div class="activity-content">
                                                    <div class="activity-text">
                                                        ${event.event_type.replace('_', ' ').toUpperCase()}
                                                        ${event.metadata ? ` - ${JSON.parse(event.metadata).app_name || 'Unknown'}` : ''}
                                                    </div>
                                                    <div class="activity-time">${new Date(event.created_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="no-data">No recent activity</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showNotification('Error loading analytics', 'error');
        }
    }

    // Utility Methods
    createModal(title, content, size = 'medium') {
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${this.escapeHtml(title)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        return modal;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async apiCall(url, method = 'GET', data = null, isFormData = false) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        };

        if (data) {
            if (isFormData) {
                options.body = data;
                // Don't set Content-Type for FormData, let browser set it with boundary
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    }
}

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

class DynamicAppShowcase {
    constructor() {
        this.apps = [];
        this.filteredApps = [];
        this.testimonials = [];
        this.content = {};
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    async init() {
        this.initializeTheme();
        this.initializeNavigation();
        this.initializeSearch();
        this.initializeModals();
        this.initializeForms();
        
        // Load dynamic content
        await this.loadContent();
        await this.loadApplications();
        await this.loadTestimonials();
        
        this.initializeAnimations();
        this.hideLoadingOverlay();
        this.startStatsAnimation();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        
        themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        
        themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            localStorage.setItem('theme', this.currentTheme);
            themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    initializeNavigation() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 100) {
                navbar.style.background = this.currentTheme === 'dark' 
                    ? 'rgba(15, 23, 42, 0.98)' 
                    : 'rgba(255, 255, 255, 0.98)';
            } else {
                navbar.style.background = this.currentTheme === 'dark' 
                    ? 'rgba(15, 23, 42, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)';
            }
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    initializeSearch() {
        const searchInput = document.getElementById('app-search');
        const categoryFilter = document.getElementById('category-filter');

        const filterApps = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedCategory = categoryFilter.value;

            this.filteredApps = this.apps.filter(app => {
                const matchesSearch = app.name.toLowerCase().includes(searchTerm) || 
                                    app.description.toLowerCase().includes(searchTerm) ||
                                    (app.tags && app.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
                
                const matchesCategory = !selectedCategory || 
                                      app.category.toLowerCase().includes(selectedCategory.toLowerCase());

                return matchesSearch && matchesCategory;
            });

            this.renderApps();
        };

        searchInput.addEventListener('input', filterApps);
        categoryFilter.addEventListener('change', filterApps);
    }

    async loadContent() {
        try {
            // Try to load dynamic content from API
            await this.loadDynamicContent();
        } catch (error) {
            console.error('Dynamic content loading failed, using static content:', error);
            // Use static content as fallback
            this.loadStaticContent();
        }
    }

    async loadDynamicContent() {
        // Load hero content
        try {
            const heroResponse = await fetch('/api/content/hero');
            if (heroResponse.ok) {
                const heroData = await heroResponse.json();
                this.updateHeroContent(heroData.content);
            } else {
                throw new Error('Hero content not available');
            }
        } catch (error) {
            this.loadStaticHeroContent();
        }

        // Load about content
        try {
            const aboutResponse = await fetch('/api/content/about');
            if (aboutResponse.ok) {
                const aboutData = await aboutResponse.json();
                this.updateAboutContent(aboutData.content);
            } else {
                throw new Error('About content not available');
            }
        } catch (error) {
            this.loadStaticAboutContent();
        }

        // Load contact content
        try {
            const contactResponse = await fetch('/api/content/contact');
            if (contactResponse.ok) {
                const contactData = await contactResponse.json();
                this.updateContactContent(contactData.content);
            } else {
                throw new Error('Contact content not available');
            }
        } catch (error) {
            this.loadStaticContactContent();
        }
    }

    loadStaticContent() {
        this.loadStaticHeroContent();
        this.loadStaticAboutContent();
        this.loadStaticContactContent();
    }

    updateHeroContent(content) {
        const heroTitle = document.getElementById('hero-title');
        const heroDescription = document.getElementById('hero-description');
        const statApps = document.getElementById('stat-apps');
        const statFree = document.getElementById('stat-free');
        const statUsers = document.getElementById('stat-users');

        if (heroTitle && content.title) {
            heroTitle.innerHTML = content.title;
        }
        if (heroDescription && content.description) {
            heroDescription.textContent = content.description;
        }
        if (content.stats) {
            if (statApps) statApps.dataset.target = content.stats.apps;
            if (statFree) statFree.dataset.target = content.stats.free;
            if (statUsers) statUsers.dataset.target = content.stats.users;
        }
    }

    updateAboutContent(content) {
        const aboutContent = document.getElementById('about-content');
        if (!aboutContent || !content) return;

        aboutContent.innerHTML = `
            <div class="about-text">
                <h2 class="section-title">${content.title}</h2>
                <p class="about-description">${content.description}</p>
                <div class="about-features">
                    ${content.features.map(feature => `
                        <div class="feature">
                            <div class="feature-icon">${feature.icon}</div>
                            <div class="feature-content">
                                <h3>${feature.title}</h3>
                                <p>${feature.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="about-visual">
                <div class="tech-stack">
                    <h3>Built With</h3>
                    <div class="tech-icons">
                        <div class="tech-item">
                            <span class="tech-icon">🌐</span>
                            <span class="tech-name">HTML5</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">🎨</span>
                            <span class="tech-name">CSS3</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">⚡</span>
                            <span class="tech-name">JavaScript</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">📱</span>
                            <span class="tech-name">PWA</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateContactContent(content) {
        const contactContent = document.getElementById('contact-content');
        if (!contactContent || !content) return;

        contactContent.innerHTML = `
            <div class="contact-info">
                <h2 class="section-title">${content.title}</h2>
                <p class="contact-description">${content.description}</p>
                <div class="contact-methods">
                    ${content.methods.map(method => `
                        <div class="contact-method">
                            <div class="contact-icon">${method.icon}</div>
                            <div class="contact-details">
                                <h3>${method.title}</h3>
                                <p>${method.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="contact-form-container">
                <form class="contact-form" id="contact-form">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="subject">Subject</label>
                        <select id="subject" name="subject" required>
                            <option value="">Select a topic</option>
                            <option value="feedback">General Feedback</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
            </div>
        `;

        // Re-initialize contact form
        this.initializeContactForm();
    }

    loadStaticHeroContent() {
        const heroTitle = document.getElementById('hero-title');
        const heroDescription = document.getElementById('hero-description');
        const statApps = document.getElementById('stat-apps');
        const statFree = document.getElementById('stat-free');
        const statUsers = document.getElementById('stat-users');

        if (heroTitle) {
            heroTitle.innerHTML = 'Amazing <span class="gradient-text">Web Apps</span><br>For Everyone';
        }
        if (heroDescription) {
            heroDescription.textContent = 'Discover powerful, free web applications that work on any device. Install them as native apps and enjoy seamless experiences across all your devices.';
        }
        if (statApps) statApps.dataset.target = '2';
        if (statFree) statFree.dataset.target = '100';
        if (statUsers) statUsers.dataset.target = '1000';
    }

    loadStaticAboutContent() {
        const aboutContent = document.getElementById('about-content');
        if (!aboutContent) return;

        aboutContent.innerHTML = `
            <div class="about-text">
                <h2 class="section-title">About Our Web Apps</h2>
                <p class="about-description">Our collection of web applications is designed with one goal in mind: to provide powerful, accessible tools that work seamlessly across all devices. Every app is built using modern web technologies and follows Progressive Web App (PWA) standards.</p>
                <div class="about-features">
                    <div class="feature">
                        <div class="feature-icon">🌐</div>
                        <div class="feature-content">
                            <h3>Universal Access</h3>
                            <p>Works on any device with a web browser - desktop, tablet, or mobile.</p>
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">📱</div>
                        <div class="feature-content">
                            <h3>PWA Technology</h3>
                            <p>Install as native apps with offline functionality and push notifications.</p>
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🔒</div>
                        <div class="feature-content">
                            <h3>Privacy First</h3>
                            <p>All data stays on your device. No tracking, no ads, no data collection.</p>
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-content">
                            <h3>Lightning Fast</h3>
                            <p>Optimized for performance with instant loading and smooth interactions.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="about-visual">
                <div class="tech-stack">
                    <h3>Built With</h3>
                    <div class="tech-icons">
                        <div class="tech-item">
                            <span class="tech-icon">🌐</span>
                            <span class="tech-name">HTML5</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">🎨</span>
                            <span class="tech-name">CSS3</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">⚡</span>
                            <span class="tech-name">JavaScript</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-icon">📱</span>
                            <span class="tech-name">PWA</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadStaticContactContent() {
        const contactContent = document.getElementById('contact-content');
        if (!contactContent) return;

        contactContent.innerHTML = `
            <div class="contact-info">
                <h2 class="section-title">Get In Touch</h2>
                <p class="contact-description">Have feedback, suggestions, or found a bug? We'd love to hear from you!</p>
                <div class="contact-methods">
                    <div class="contact-method">
                        <div class="contact-icon">📧</div>
                        <div class="contact-details">
                            <h3>Email</h3>
                            <p>hello@webappshub.com</p>
                        </div>
                    </div>
                    <div class="contact-method">
                        <div class="contact-icon">💬</div>
                        <div class="contact-details">
                            <h3>Feedback</h3>
                            <p>We value your input</p>
                        </div>
                    </div>
                    <div class="contact-method">
                        <div class="contact-icon">🐛</div>
                        <div class="contact-details">
                            <h3>Bug Reports</h3>
                            <p>Help us improve</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="contact-form-container">
                <form class="contact-form" id="contact-form">
                    <div class="form-group">
                        <label for="contact-name">Name</label>
                        <input type="text" id="contact-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-email">Email</label>
                        <input type="email" id="contact-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-subject">Subject</label>
                        <select id="contact-subject" name="subject" required>
                            <option value="">Select a topic</option>
                            <option value="feedback">General Feedback</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contact-message">Message</label>
                        <textarea id="contact-message" name="message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
            </div>
        `;

        // Re-initialize contact form
        this.initializeContactForm();
    }

    async loadApplications() {
        try {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Failed to load applications');

            const data = await response.json();
            this.apps = data.applications;
            this.filteredApps = [...this.apps];

            this.renderApps();
            this.updateFooterLinks();
        } catch (error) {
            console.error('Error loading applications from API, using static data:', error);
            this.loadStaticApplications();
        }
    }

    loadStaticApplications() {
        // Static application data for GitHub Pages deployment
        this.apps = [
            {
                id: 1,
                name: 'Personal Expense Tracker',
                short_name: 'ExpenseTracker',
                description: 'Track your daily expenses, manage budgets, and visualize spending patterns with interactive charts.',
                long_description: 'A comprehensive personal finance application that helps you take control of your spending. Features include expense categorization, budget management with alerts, interactive charts for spending analysis, and complete data privacy with local storage.',
                category: 'finance',
                tags: ['finance', 'productivity', 'budget', 'expenses', 'charts'],
                logo_url: 'https://linhfishcr7.github.io/expense-tracker/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/expense-tracker/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/expense-tracker/',
                install_url: 'https://linhfishcr7.github.io/expense-tracker/',
                features: [
                    '📊 Interactive spending charts',
                    '💰 Budget management with alerts',
                    '📱 Works offline with local storage',
                    '🎯 Category-based expense tracking',
                    '📈 Visual spending analytics'
                ],
                status: 'active',
                launch_count: 15,
                install_count: 8,
                rating: 4.8,
                rating_count: 12
            },
            {
                id: 2,
                name: 'Digital Drawing Canvas',
                short_name: 'DrawingCanvas',
                description: 'A powerful digital art studio in your browser! Create stunning drawings with multiple tools and brushes.',
                long_description: 'Transform your device into a digital art studio with this comprehensive drawing application. Features multiple drawing tools, customizable brushes, color palettes, save/load functionality, and full touch support for tablets and mobile devices.',
                category: 'creative',
                tags: ['creative', 'art', 'drawing', 'design', 'canvas'],
                logo_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/logo.svg',
                screenshot_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/img/screenshot.png',
                app_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                install_url: 'https://linhfishcr7.github.io/digital-drawing-canvas/',
                features: [
                    '🖌️ Multiple drawing tools & brushes',
                    '🎨 Color picker & preset palettes',
                    '💾 Save & load your artwork',
                    '📱 Touch support for mobile devices',
                    '⬇️ Export drawings as PNG files'
                ],
                status: 'active',
                launch_count: 12,
                install_count: 5,
                rating: 4.6,
                rating_count: 8
            }
        ];

        this.filteredApps = [...this.apps];
        this.renderApps();
        this.updateFooterLinks();
    }

    renderApps() {
        const appsGrid = document.getElementById('apps-grid');
        
        if (this.filteredApps.length === 0) {
            appsGrid.innerHTML = `
                <div class="no-results">
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                        <h3>No apps found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                </div>
            `;
            return;
        }

        appsGrid.innerHTML = this.filteredApps.map(app => `
            <div class="app-card" data-category="${app.category}">
                <div class="app-image">
                    <img src="${app.logo_url || 'img/default-app-logo.svg'}" alt="${app.name}" class="app-logo">
                    <div class="app-overlay">
                        <button class="btn btn-primary app-launch" data-url="${app.app_url}" data-id="${app.id}">
                            Launch App
                        </button>
                    </div>
                </div>
                <div class="app-content">
                    <div class="app-header">
                        <h3 class="app-title">${app.name}</h3>
                        <div class="app-tags">
                            ${app.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <p class="app-description">${app.description}</p>
                    <ul class="app-features">
                        ${app.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    <div class="app-actions">
                        <button class="btn btn-primary app-launch" data-url="${app.app_url}" data-id="${app.id}">
                            Launch Web App
                        </button>
                        <button class="btn btn-secondary install-pwa" data-app="${app.short_name}" data-id="${app.id}">
                            Install PWA
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to app cards
        this.initializeAppLaunchers();
        
        // Animate cards in
        setTimeout(() => {
            document.querySelectorAll('.app-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('loaded');
                }, index * 100);
            });
        }, 100);
    }

    async loadTestimonials() {
        try {
            const response = await fetch('/api/testimonials');
            if (!response.ok) throw new Error('Failed to load testimonials');

            const data = await response.json();
            this.testimonials = data.testimonials;

            this.renderTestimonials();
        } catch (error) {
            console.error('Error loading testimonials from API, using static data:', error);
            this.loadStaticTestimonials();
        }
    }

    loadStaticTestimonials() {
        // Static testimonials data for GitHub Pages deployment
        this.testimonials = [
            {
                id: 1,
                name: 'Sarah Johnson',
                title: 'Freelance Designer',
                content: 'The expense tracker has completely changed how I manage my finances. Simple, powerful, and works everywhere!',
                avatar_url: '👩‍💼',
                rating: 5,
                status: 'active'
            },
            {
                id: 2,
                name: 'Mike Chen',
                title: 'Digital Artist',
                content: 'Amazing drawing app! I use it on my tablet for digital art. The touch support is fantastic.',
                avatar_url: '👨‍🎨',
                rating: 5,
                status: 'active'
            },
            {
                id: 3,
                name: 'Emma Davis',
                title: 'Privacy Advocate',
                content: 'Love that these apps work offline and don\'t collect my data. Privacy-focused and powerful!',
                avatar_url: '👩‍💻',
                rating: 5,
                status: 'active'
            }
        ];

        this.renderTestimonials();
    }

    renderTestimonials() {
        const testimonialsGrid = document.getElementById('testimonials-grid');
        
        if (this.testimonials.length === 0) {
            testimonialsGrid.innerHTML = `
                <div class="no-testimonials">
                    <p>No testimonials available yet.</p>
                </div>
            `;
            return;
        }

        testimonialsGrid.innerHTML = this.testimonials.map(testimonial => `
            <div class="testimonial">
                <div class="testimonial-content">
                    <p>"${testimonial.content}"</p>
                </div>
                <div class="testimonial-author">
                    <div class="author-avatar">${testimonial.avatar_url || '👤'}</div>
                    <div class="author-info">
                        <div class="author-name">${testimonial.name}</div>
                        <div class="author-title">${testimonial.title || ''}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateFooterLinks() {
        const footerAppsLinks = document.getElementById('footer-apps-links');
        if (footerAppsLinks && this.apps.length > 0) {
            footerAppsLinks.innerHTML = this.apps.map(app => 
                `<li><a href="${app.app_url}">${app.name}</a></li>`
            ).join('');
        }
    }

    initializeAppLaunchers() {
        const launchButtons = document.querySelectorAll('.app-launch');
        const installButtons = document.querySelectorAll('.install-pwa');
        
        launchButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const url = button.dataset.url;
                const appId = button.dataset.id;
                
                if (url) {
                    // Track launch
                    if (appId) {
                        try {
                            await fetch(`/api/applications/${appId}/launch`, { method: 'POST' });
                        } catch (error) {
                            console.error('Failed to track launch:', error);
                        }
                    }
                    
                    // Add loading state
                    const originalText = button.textContent;
                    button.textContent = 'Launching...';
                    button.disabled = true;

                    // Open app in new tab
                    window.open(url, '_blank');

                    // Reset button after delay
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }
            });
        });

        installButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const appId = button.dataset.id;
                
                // Track install attempt
                if (appId) {
                    try {
                        await fetch(`/api/applications/${appId}/install`, { method: 'POST' });
                    } catch (error) {
                        console.error('Failed to track install:', error);
                    }
                }
                
                this.openPWAModal();
            });
        });
    }

    initializeModals() {
        // PWA Modal
        const pwaModal = document.getElementById('pwa-modal');
        const pwaModalClose = document.getElementById('modal-close');
        const pwaGuideLink = document.getElementById('pwa-guide');

        const openPWAModal = () => {
            pwaModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closePWAModal = () => {
            pwaModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (pwaGuideLink) {
            pwaGuideLink.addEventListener('click', (e) => {
                e.preventDefault();
                openPWAModal();
            });
        }

        if (pwaModalClose) {
            pwaModalClose.addEventListener('click', closePWAModal);
        }

        pwaModal.addEventListener('click', (e) => {
            if (e.target === pwaModal) {
                closePWAModal();
            }
        });

        // Privacy Policy Modal
        const privacyModal = document.getElementById('privacy-modal');
        const privacyModalClose = document.getElementById('privacy-modal-close');
        const privacyPolicyLink = document.getElementById('privacy-policy');

        const openPrivacyModal = () => {
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closePrivacyModal = () => {
            privacyModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (privacyPolicyLink) {
            privacyPolicyLink.addEventListener('click', (e) => {
                e.preventDefault();
                openPrivacyModal();
            });
        }

        if (privacyModalClose) {
            privacyModalClose.addEventListener('click', closePrivacyModal);
        }

        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) {
                closePrivacyModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (pwaModal.classList.contains('active')) {
                    closePWAModal();
                }
                if (privacyModal.classList.contains('active')) {
                    closePrivacyModal();
                }
            }
        });

        this.openPWAModal = openPWAModal;
    }

    initializeForms() {
        // Newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSignup(e));
        }

        // Contact form will be initialized after content loads
        this.initializeContactForm();
    }

    initializeContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }
    }

    async handleNewsletterSignup(e) {
        e.preventDefault();

        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const button = form.querySelector('button');
        const originalText = button.textContent;

        button.textContent = 'Subscribing...';
        button.disabled = true;

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                throw new Error(data.error || 'Subscription failed');
            }
        } catch (error) {
            console.error('Newsletter signup error (using static mode):', error);
            // In static mode, simulate successful subscription
            this.showNotification('Thank you for your interest! Newsletter signup is not available in demo mode.', 'info');
            form.reset();
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async handleContactForm(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const button = form.querySelector('button');
        const originalText = button.textContent;

        button.textContent = 'Sending...';
        button.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    subject: formData.get('subject'),
                    message: formData.get('message')
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Message sent successfully!', 'success');
                form.reset();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact form error (using static mode):', error);
            // In static mode, simulate successful message sending
            this.showNotification('Thank you for your message! Contact form is not available in demo mode.', 'info');
            form.reset();
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    initializeAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature, .testimonial').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    startStatsAnimation() {
        const stats = document.querySelectorAll('.stat-number');
        
        const animateStats = () => {
            stats.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
                let current = 0;

                const updateStat = () => {
                    current += increment;
                    if (current < target) {
                        stat.textContent = Math.floor(current);
                        requestAnimationFrame(updateStat);
                    } else {
                        stat.textContent = target;
                    }
                };

                updateStat();
            });
        };

        // Start animation when hero section is visible
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    heroObserver.unobserve(entry.target);
                }
            });
        });

        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroObserver.observe(heroSection);
        }
    }

    hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
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

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appShowcase = new DynamicAppShowcase();
});

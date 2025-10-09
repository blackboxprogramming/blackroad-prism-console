class AuthManager {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        console.log('🚀 AuthManager initialized');
        console.log('Current token:', this.token ? 'Present' : 'None');
        console.log('Current user:', this.user);
        
        this.setupEventListeners();
        this.updateAuthUI();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout link
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        console.log('📝 Login attempt started');
        
        const form = event.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        console.log('Login credentials:', { username: credentials.username, remember: credentials.remember });
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                console.log('✅ Login successful');
                this.setAuth(data.token, data.user);
                this.showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                console.log('❌ Login failed:', data.message);
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('🔥 Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        console.log('📝 Registration attempt started');
        
        const form = event.target;
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        console.log('Registration data:', { username: userData.username, email: userData.email });

        if (userData.password !== userData.confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok) {
                console.log('✅ Registration successful');
                this.showMessage('Registration successful! Please login.', 'success');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                console.log('❌ Registration failed:', data.message);
                this.showMessage(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('🔥 Registration error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout(event) {
        event.preventDefault();
        console.log('🚪 Logout initiated');
        
        this.clearAuth();
        this.showMessage('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    setAuth(token, user) {
        console.log('🔐 Setting authentication:', { user: user.username });
        
        this.token = token;
        this.user = user;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        this.updateAuthUI();
    }

    clearAuth() {
        console.log('🗑️ Clearing authentication');
        
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        this.updateAuthUI();
    }

    updateAuthUI() {
        const authLink = document.getElementById('auth-link');
        const usernameDisplay = document.getElementById('username-display');
        const userStats = document.getElementById('user-stats');
        
        if (this.user) {
            console.log('🎨 Updating UI for authenticated user:', this.user.username);
            
            if (authLink) {
                authLink.textContent = 'Dashboard';
                authLink.href = '/dashboard';
            }
            
            if (usernameDisplay) {
                usernameDisplay.textContent = this.user.username;
            }
            
            if (userStats) {
                userStats.style.display = 'block';
                this.loadStats();
            }
        } else {
            console.log('🎨 Updating UI for anonymous user');
            
            if (authLink) {
                authLink.textContent = 'Login';
                authLink.href = '/login';
            }
            
            if (userStats) {
                userStats.style.display = 'none';
            }
        }
    }

    async checkAuthStatus() {
        if (!this.token) return;
        
        console.log('🔍 Checking authentication status');
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                console.log('❌ Token invalid, clearing auth');
                this.clearAuth();
            } else {
                console.log('✅ Token valid');
            }
        } catch (error) {
            console.error('🔥 Auth check error:', error);
        }
    }

    async loadStats() {
        console.log('📊 Loading platform statistics');
        
        try {
            const response = await fetch(`${this.apiUrl}/stats`, {
                headers: this.token ? {
                    'Authorization': `Bearer ${this.token}`
                } : {}
            });

            const data = await response.json();
            console.log('Stats loaded:', data);

            this.updateStatsUI(data);
        } catch (error) {
            console.error('🔥 Stats loading error:', error);
        }
    }

    updateStatsUI(stats) {
        const elements = {
            'total-users': stats.totalUsers,
            'online-users': stats.onlineUsers,
            'total-sessions': stats.totalSessions,
            'dashboard-total-users': stats.totalUsers,
            'dashboard-online-users': stats.onlineUsers,
            'dashboard-user-sessions': stats.userSessions
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.textContent = value;
            }
        });
    }

    showMessage(message, type) {
        console.log(`📢 Showing ${type} message:`, message);
        
        // Remove existing messages
        const existing = document.querySelector('.error-message, .success-message');
        if (existing) {
            existing.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;

        // Insert message
        const form = document.querySelector('.form, .auth-form');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    isAuthenticated() {
        return this.token && this.user;
    }

    getAuthHeaders() {
        return this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make it globally available
window.authManager = authManager;

console.log('🔧 Auth system loaded and ready');

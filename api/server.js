const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blackroad-super-secret-key-2024';

// Global stats tracking
let stats = {
    totalUsers: 0,
    onlineUsers: 0,
    totalSessions: 0,
    connections: new Set()
};

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost', 'http://blackroad.io', 'http://www.blackroad.io', 'http://blackroadinc.us', 'http://www.blackroadinc.us'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Database setup
const db = new sqlite3.Database('./blackroad.db', (err) => {
    if (err) {
        console.error('🔥 Database connection error:', err.message);
    } else {
        console.log('🗄️ Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    console.log('🏗️ Initializing database schema...');
    
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        )
    `, (err) => {
        if (err) {
            console.error('🔥 Error creating users table:', err);
        } else {
            console.log('✅ Users table ready');
            createDefaultUser();
        }
    });

    // Sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            token TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `, (err) => {
        if (err) {
            console.error('🔥 Error creating sessions table:', err);
        } else {
            console.log('✅ Sessions table ready');
        }
    });

    // Activity log table
    db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `, (err) => {
        if (err) {
            console.error('🔥 Error creating activity_log table:', err);
        } else {
            console.log('✅ Activity log table ready');
        }
    });

    updateStats();
}

async function createDefaultUser() {
    console.log('👤 Creating default user: alexaamundson');
    
    const hashedPassword = await bcrypt.hash('Aa060070003!', 10);
    
    db.run(`
        INSERT OR IGNORE INTO users (username, email, password)
        VALUES (?, ?, ?)
    `, ['alexaamundson', 'alexa@blackroad.io', hashedPassword], function(err) {
        if (err) {
            console.error('🔥 Error creating default user:', err);
        } else if (this.changes > 0) {
            console.log('✅ Default user created successfully');
            logActivity(this.lastID, 'user_created', 'Default admin user created', '127.0.0.1');
        } else {
            console.log('ℹ️ Default user already exists');
        }
    });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('🔒 Token verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Activity logging
function logActivity(userId, action, details = null, ipAddress = null) {
    db.run(`
        INSERT INTO activity_log (user_id, action, details, ip_address)
        VALUES (?, ?, ?, ?)
    `, [userId, action, details, ipAddress], (err) => {
        if (err) {
            console.error('🔥 Error logging activity:', err);
        } else {
            console.log(`📝 Activity logged: ${action} for user ${userId}`);
        }
    });
}

// Update stats
function updateStats() {
    db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', (err, row) => {
        if (!err && row) {
            stats.totalUsers = row.count;
            console.log('📊 Updated total users:', stats.totalUsers);
        }
    });

    db.get('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1', (err, row) => {
        if (!err && row) {
            stats.totalSessions = row.count;
            console.log('📊 Updated total sessions:', stats.totalSessions);
        }
    });

    stats.onlineUsers = stats.connections.size;
    
    // Broadcast stats to all connected clients
    broadcastStats();
}

function broadcastStats() {
    const message = JSON.stringify({
        type: 'stats_update',
        data: stats
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// WebSocket connections
wss.on('connection', (ws, req) => {
    const clientId = Date.now() + Math.random();
    stats.connections.add(clientId);
    
    console.log('🔌 New WebSocket connection:', clientId);
    console.log('👥 Total connections:', stats.connections.size);
    
    updateStats();

    ws.on('close', () => {
        stats.connections.delete(clientId);
        console.log('🔌 WebSocket disconnected:', clientId);
        console.log('👥 Total connections:', stats.connections.size);
        updateStats();
    });

    ws.on('error', (error) => {
        console.error('🔥 WebSocket error:', error);
        stats.connections.delete(clientId);
        updateStats();
    });
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: stats
    });
});

// User registration
app.post('/api/auth/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    console.log('📝 Registration attempt for:', req.body.username);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(`
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)
        `, [username, email, hashedPassword], function(err) {
            if (err) {
                console.error('🔥 Registration error:', err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                return res.status(500).json({ message: 'Registration failed' });
            }

            console.log('✅ User registered successfully:', username, 'ID:', this.lastID);
            logActivity(this.lastID, 'user_registered', `User ${username} registered`, clientIp);
            updateStats();
            
            res.status(201).json({ 
                message: 'User registered successfully',
                userId: this.lastID
            });
        });
    } catch (error) {
        console.error('🔥 Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', [
    body('username').trim().escape(),
    body('password').exists()
], async (req, res) => {
    console.log('🔐 Login attempt for:', req.body.username);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed' });
    }

    const { username, password, remember } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    db.get(`
        SELECT * FROM users WHERE username = ? AND is_active = 1
    `, [username], async (err, user) => {
        if (err) {
            console.error('🔥 Login database error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                console.log('❌ Invalid password for:', username);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username,
                    email: user.email
                },
                JWT_SECRET,
                { expiresIn: remember ? '30d' : '1d' }
            );

            // Update last login
            db.run(`
                UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
            `, [user.id]);

            // Create session record
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (remember ? 30 : 1));
            
            db.run(`
                INSERT INTO sessions (user_id, token, expires_at)
                VALUES (?, ?, ?)
            `, [user.id, token, expiresAt.toISOString()]);

            console.log('✅ Login successful for:', username);
            logActivity(user.id, 'user_login', `User logged in from ${clientIp}`, clientIp);
            updateStats();

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.created_at,
                    lastLogin: user.last_login
                }
            });
        } catch (error) {
            console.error('🔥 Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});

// Token verification
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    console.log('🔍 Token verification for user:', req.user.username);
    res.json({ 
        valid: true, 
        user: req.user 
    });
});

// Get platform statistics
app.get('/api/stats', (req, res) => {
    console.log('📊 Stats requested');
    
    let userSessions = 0;
    if (req.headers.authorization) {
        // Get user-specific session count
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            db.get(`
                SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND is_active = 1
            `, [decoded.userId], (err, row) => {
                if (!err && row) {
                    userSessions = row.count;
                }
            });
        } catch (error) {
            console.log('Token verification failed for stats');
        }
    }

    res.json({
        totalUsers: stats.totalUsers,
        onlineUsers: stats.onlineUsers,
        totalSessions: stats.totalSessions,
        userSessions: userSessions,
        timestamp: new Date().toISOString()
    });
});

// Get user activity
app.get('/api/user/activity', authenticateToken, (req, res) => {
    console.log('📋 Activity log requested for user:', req.user.username);
    
    db.all(`
        SELECT action, details, ip_address, created_at
        FROM activity_log
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    `, [req.user.userId], (err, rows) => {
        if (err) {
            console.error('🔥 Error fetching activity:', err);
            return res.status(500).json({ message: 'Failed to fetch activity' });
        }

        res.json({ activities: rows || [] });
    });
});

// Sample API endpoints
app.get('/api/services', (req, res) => {
    console.log('🛠️ Services list requested');
    res.json([
        { id: 1, name: 'Web Development', description: 'Custom web applications', price: '$5,000+' },
        { id: 2, name: 'Digital Strategy', description: 'Digital transformation consulting', price: '$2,500+' },
        { id: 3, name: 'Cloud Solutions', description: 'Cloud infrastructure and deployment', price: '$3,000+' },
        { id: 4, name: 'Mobile Apps', description: 'iOS and Android applications', price: '$8,000+' },
        { id: 5, name: 'E-commerce', description: 'Online store development', price: '$4,000+' }
    ]);
});

app.post('/api/contact', [
    body('name').trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('message').trim().escape()
], (req, res) => {
    console.log('📬 Contact form submission:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed' });
    }

    // Here you would typically save to database or send email
    res.json({ 
        message: 'Thank you for your message. We will get back to you soon!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    console.log('❓ 404 - Route not found:', req.path);
    res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
    console.log('🚀 BlackRoad API server started');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSocket server ready`);
    console.log('📊 Real-time stats broadcasting enabled');
    
    // Update stats every 30 seconds
    setInterval(updateStats, 30000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    
    db.close((err) => {
        if (err) {
            console.error('🔥 Error closing database:', err.message);
        } else {
            console.log('🗄️ Database connection closed');
        }
    });
    
    server.close(() => {
        console.log('📡 Server closed');
        process.exit(0);
    });
});

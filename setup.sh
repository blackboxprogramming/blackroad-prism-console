#!/bin/bash

echo "Setting up BlackRoad websites..."

# Create necessary directories
mkdir -p public/css
mkdir -p public/js
mkdir -p public/images
mkdir -p logs/nginx
mkdir -p api

# Add entries to /etc/hosts for local development (requires sudo)
echo "Adding entries to /etc/hosts..."
if ! grep -q "blackroad.io" /etc/hosts; then
    echo "127.0.0.1 blackroad.io www.blackroad.io" | sudo tee -a /etc/hosts
fi

if ! grep -q "blackroadinc.us" /etc/hosts; then
    echo "127.0.0.1 blackroadinc.us www.blackroadinc.us" | sudo tee -a /etc/hosts
fi

# Create a simple API server if the api directory doesn't exist
if [ ! -f "api/package.json" ]; then
    echo "Creating simple API server..."
    cat > api/package.json << 'EOF'
{
  "name": "blackroad-api",
  "version": "1.0.0",
  "description": "BlackRoad API Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

    cat > api/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Sample API endpoints
app.get('/api/services', (req, res) => {
    res.json([
        { id: 1, name: 'Web Development', description: 'Custom web applications' },
        { id: 2, name: 'Digital Strategy', description: 'Digital transformation consulting' },
        { id: 3, name: 'Cloud Solutions', description: 'Cloud infrastructure and deployment' }
    ]);
});

app.post('/api/contact', (req, res) => {
    console.log('Contact form submission:', req.body);
    res.json({ message: 'Thank you for your message. We will get back to you soon!' });
});

app.listen(PORT, () => {
    console.log(`BlackRoad API server running on port ${PORT}`);
});
EOF
fi

# Create favicon
if [ ! -f "public/favicon.ico" ]; then
    echo "Creating favicon placeholder..."
    echo "BlackRoad favicon placeholder" > public/favicon.ico
fi

# Set proper permissions
chmod +x setup.sh
chmod -R 755 public/

echo "Setup complete!"
echo ""
echo "To start the websites (quick):"
echo "1. Run: ./setup.sh"
echo "2. Run: python3 -m http.server 8000 (for static preview) OR docker-compose up -d (if configured)"
echo "3. Open your browser to: http://localhost:8000 or http://blackroad.io if hosts updated"
echo ""
echo "To stop: docker-compose down"
echo "To stop: docker-compose down"

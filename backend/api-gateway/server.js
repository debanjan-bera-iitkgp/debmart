// backend/api-gateway/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========

// CORS
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true
}));

// JSON parsing
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// ========== API ROUTES ==========

// Auth Service
app.use('/api/auth', createProxyMiddleware({
    target: 'http://auth-service:5001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/'
    }
}));

// Product Service
app.use('/api/products', createProxyMiddleware({
    target: 'http://product-service:5002',
    changeOrigin: true,
    pathRewrite: {
        '^/api/products': '/'
    }
}));

// Cart Service
app.use('/api/cart', createProxyMiddleware({
    target: 'http://cart-service:5003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/cart': '/'
    }
}));

// Order Service
app.use('/api/orders', createProxyMiddleware({
    target: 'http://order-service:5004',
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders': '/'
    }
}));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            auth: 'http://auth-service:5001',
            products: 'http://product-service:5002',
            cart: 'http://cart-service:5003',
            orders: 'http://order-service:5004'
        }
    });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
    console.log(` API Gateway running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});
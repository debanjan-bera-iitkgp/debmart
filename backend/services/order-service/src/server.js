// backend/services/order-service/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Order = require('./models/Order');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== DATABASE ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order-service';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(' Order Service connected to MongoDB'))
.catch(err => console.error(' MongoDB connection error:', err));

// ========== ROUTES ==========

// Create order
app.post('/', async (req, res) => {
    try {
        const { userId, items, total, shippingAddress, paymentMethod } = req.body;

        // Validate required fields
        if (!userId || !items || !total || !shippingAddress || !paymentMethod) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const order = new Order({
            userId,
            items,
            total,
            shippingAddress,
            paymentMethod
        });

        await order.save();

        res.status(201).json({
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orders by user ID
app.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by order ID
app.get('/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
app.patch('/:orderId/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders (Admin only)
app.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
app.delete('/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                error: 'Cannot cancel delivered order'
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({
        service: 'order-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(` Order Service running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});
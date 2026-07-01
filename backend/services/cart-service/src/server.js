// backend/services/cart-service/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Cart = require('./models/Cart');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== DATABASE ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cart-service';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(' Cart Service connected to MongoDB'))
.catch(err => console.error(' MongoDB connection error:', err));

// ========== ROUTES ==========

// Get cart
app.get('/:userId', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, items: [] });
            await cart.save();
        }
        
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add to cart
app.post('/:userId', async (req, res) => {
    try {
        const { productId, name, price, image, quantity } = req.body;
        
        let cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.productId.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity || 1;
        } else {
            cart.items.push({
                productId,
                name,
                price,
                image,
                quantity: quantity || 1
            });
        }

        // Calculate total
        cart.total = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        cart.updatedAt = new Date();
        await cart.save();

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update quantity
app.put('/:userId/:productId', async (req, res) => {
    try {
        const { quantity } = req.body;
        
        let cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(
            item => item.productId.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity;
        
        // Calculate total
        cart.total = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        cart.updatedAt = new Date();
        await cart.save();

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from cart
app.delete('/:userId/:productId', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== req.params.productId
        );
        
        // Calculate total
        cart.total = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        cart.updatedAt = new Date();
        await cart.save();

        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear cart
app.delete('/:userId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = [];
        cart.total = 0;
        cart.updatedAt = new Date();
        await cart.save();

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({
        service: 'cart-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(` Cart Service running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});
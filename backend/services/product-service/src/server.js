// backend/services/product-service/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const redis = require('redis');
const Product = require('./models/Product');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== DATABASE ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product-service';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(' Product Service connected to MongoDB'))
.catch(err => console.error(' MongoDB connection error:', err));

// ========== REDIS ==========
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error(' Redis error:', err));
redisClient.on('connect', () => console.log(' Product Service connected to Redis'));

(async () => {
    await redisClient.connect();
})();

// ========== SEED PRODUCTS ==========
async function seedProducts() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            const products = [
                {
                    name: "Wireless Headphones",
                    category: "Electronics",
                    brand: "Sony",
                    price: 2999,
                    oldPrice: 3499,
                    rating: 4.6,
                    stock: 50,
                    image: "/images/headphone.jpg",
                    description: "Premium wireless Bluetooth headphones with deep bass, noise isolation and up to 30 hours of battery life."
                },
                {
                    name: "Gaming Keyboard",
                    category: "Electronics",
                    brand: "Redragon",
                    price: 2499,
                    oldPrice: 2999,
                    rating: 4.5,
                    stock: 30,
                    image: "/images/keyboard.jpg",
                    description: "Mechanical RGB gaming keyboard with anti-ghosting keys and customizable lighting effects."
                },
                {
                    name: "Running Shoes",
                    category: "Fashion",
                    brand: "Nike",
                    price: 3499,
                    oldPrice: 4299,
                    rating: 4.8,
                    stock: 40,
                    image: "/images/shoes.jpg",
                    description: "Comfortable lightweight running shoes designed for everyday training and outdoor sports."
                },
                {
                    name: "Smart Watch",
                    category: "Electronics",
                    brand: "Noise",
                    price: 4999,
                    oldPrice: 5999,
                    rating: 4.7,
                    stock: 25,
                    image: "/images/watch.jpg",
                    description: "Feature-rich smartwatch with AMOLED display, heart-rate monitoring and fitness tracking."
                },
                {
                    name: "Laptop Backpack",
                    category: "Accessories",
                    brand: "Skybags",
                    price: 1799,
                    oldPrice: 2299,
                    rating: 4.4,
                    stock: 40,
                    image: "/images/backpack.jpg",
                    description: "Water-resistant laptop backpack with multiple compartments and USB charging port."
                },
                {
                    name: "Wireless Mouse",
                    category: "Electronics",
                    brand: "Logitech",
                    price: 999,
                    oldPrice: 1299,
                    rating: 4.6,
                    stock: 50,
                    image: "/images/mouse.jpg",
                    description: "Ergonomic wireless mouse with adjustable DPI and long battery life."
                },
                {
                    name: "Bluetooth Speaker",
                    category: "Electronics",
                    brand: "JBL",
                    price: 2699,
                    oldPrice: 3199,
                    rating: 4.7,
                    stock: 22,
                    image: "/images/speaker.jpg",
                    description: "Portable Bluetooth speaker with powerful bass, IPX7 waterproof design and 12-hour playback."
                },
                {
                    name: "Men's Hoodie",
                    category: "Fashion",
                    brand: "Puma",
                    price: 1999,
                    oldPrice: 2499,
                    rating: 4.5,
                    stock: 28,
                    image: "/images/hoodie.jpg",
                    description: "Soft cotton hoodie suitable for casual wear with premium comfort and fit."
                }
            ];

            await Product.insertMany(products);
            console.log(' Products seeded successfully');
        }
    } catch (error) {
        console.error(' Seed error:', error);
    }
}

seedProducts();

// ========== ROUTES ==========

// Get all products (with Redis caching)
app.get('/', async (req, res) => {
    try {
        const cacheKey = 'products:all';
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const products = await Product.find();
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID
app.get('/:id', async (req, res) => {
    try {
        const cacheKey = `product:${req.params.id}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search products
app.get('/search/:keyword', async (req, res) => {
    try {
        const keyword = req.params.keyword;
        const products = await Product.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } }
            ]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (Admin only)
app.post('/', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        await redisClient.del('products:all');
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
app.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await redisClient.del('products:all');
        await redisClient.del(`product:${req.params.id}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await redisClient.del('products:all');
        await redisClient.del(`product:${req.params.id}`);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({
        service: 'product-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(` Product Service running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});
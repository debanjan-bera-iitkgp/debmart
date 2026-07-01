// backend/services/product-service/src/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    image: {
        type: String,
        default: '/images/default-product.jpg'
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
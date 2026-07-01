// backend/services/cart-service/src/models/Cart.js
const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    }
});

const CartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    items: [CartItemSchema],
    total: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', CartSchema);
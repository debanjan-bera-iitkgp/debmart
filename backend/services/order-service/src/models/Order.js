// backend/services/order-service/src/models/Order.js
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    items: [OrderItemSchema],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'upi', 'card', 'netbanking'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate order ID before saving
OrderSchema.pre('save', function(next) {
    if (!this.orderId) {
        this.orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
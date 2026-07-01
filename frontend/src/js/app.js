// ==========================================
//   DEBMart — Main Application
// ==========================================

const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// ==========================================
//   API Functions
// ==========================================

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

// ==========================================
//   Product Functions
// ==========================================

async function loadProducts() {
    try {
        const products = await apiRequest('/products');
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productContainer').innerHTML = `
            <div class="cart-empty">Failed to load products. Please try again.</div>
        `;
    }
}

function displayProducts(products) {
    const container = document.getElementById('productContainer');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">No products found.</div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/300x220/2563EB/FFFFFF?text=Product'}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.category} • ${product.brand || ''}</p>
                <div class="product-rating"> ${product.rating || 0}</div>
                <div class="product-price">₹${product.price}</div>
                <button class="btn-add-cart" onclick="addToCart('${product._id}')">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// ==========================================
//   Cart Functions
// ==========================================

async function addToCart(productId) {
    try {
        // First, get product details
        const product = await apiRequest(`/products/${productId}`);
        
        await apiRequest('/cart/guest', {
            method: 'POST',
            body: JSON.stringify({
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            })
        });
        
        updateCartCount();
        alert(' Added to cart!');
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart. Please try again.');
    }
}

async function loadCart() {
    try {
        const cart = await apiRequest('/cart/guest');
        displayCart(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('cartContainer').innerHTML = `
            <div class="cart-empty">Failed to load cart.</div>
        `;
    }
}

function displayCart(cart) {
    const container = document.getElementById('cartContainer');
    
    if (!cart || !cart.items || cart.items.length === 0) {
        container.innerHTML = `
            <div class="cart-empty"> Your cart is empty. Start shopping!</div>
        `;
        return;
    }

    container.innerHTML = `
        ${cart.items.map(item => `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/80x80/2563EB/FFFFFF?text=Product'}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <div class="cart-item-price">₹${item.price}</div>
                </div>
                <div class="cart-item-actions">
                    <input type="number" min="1" value="${item.quantity}" 
                           onchange="updateCartItem('${item.productId}', this.value)">
                    <button class="btn-remove" onclick="removeFromCart('${item.productId}')">Remove</button>
                </div>
            </div>
        `).join('')}
        <div class="cart-total">
            <h2>Total: ₹${cart.total || 0}</h2>
            <button class="btn-checkout" onclick="checkout()">Proceed to Checkout</button>
        </div>
    `;
}

async function updateCartItem(productId, quantity) {
    try {
        await apiRequest('/cart/guest', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });
        loadCart();
        updateCartCount();
    } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to update cart.');
    }
}

async function removeFromCart(productId) {
    try {
        await apiRequest('/cart/guest', {
            method: 'DELETE',
            body: JSON.stringify({ productId })
        });
        loadCart();
        updateCartCount();
    } catch (error) {
        console.error('Error removing from cart:', error);
        alert('Failed to remove from cart.');
    }
}

async function updateCartCount() {
    try {
        const cart = await apiRequest('/cart/guest');
        const count = document.getElementById('cartCount');
        const totalItems = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        count.textContent = totalItems;
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

function checkout() {
    if (!token) {
        alert('Please login to checkout.');
        return;
    }
    alert('Checkout functionality coming soon!');
}

// ==========================================
//   Category Filter
// ==========================================

async function filterByCategory(category) {
    try {
        const products = await apiRequest('/products');
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    } catch (error) {
        console.error('Error filtering products:', error);
    }
}

// ==========================================
//   Auth Functions
// ==========================================

function redirectToLogin() {
    window.location.href = '#login';
    alert('Login functionality coming soon!');
}

function redirectToRegister() {
    window.location.href = '#register';
    alert('Register functionality coming soon!');
}

// ==========================================
//   Event Listeners
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Load products
    loadProducts();
    
    // Load cart
    loadCart();
    
    // Update cart count
    updateCartCount();
    
    // Category filters
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            filterByCategory(category);
        });
    });
    
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', redirectToLogin);
    document.getElementById('registerBtn').addEventListener('click', redirectToRegister);
});
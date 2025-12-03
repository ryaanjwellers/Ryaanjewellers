// Update your addToCart function
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartModal(); // Add this
    showNotification(`${product.name} added to cart!`);
}

// Add cart modal
function showCartModal() {
    const modal = document.createElement('div');
    modal.className = 'modal cart-modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <h3>Your Cart (${cart.length} items)</h3>
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" width="80">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>AED ${item.price.toLocaleString()} × ${item.quantity}</p>
                        </div>
                        <button onclick="removeFromCart(${item.id})">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="cart-total">
                <h4>Total: AED ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</h4>
            </div>
            <button class="btn btn-gold" onclick="proceedToCheckout()" style="width: 100%; margin-top: 20px;">
                Proceed to Checkout
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update cart button to show modal
document.querySelector('.cart-btn').addEventListener('click', showCartModal);

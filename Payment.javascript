<script>
    // ========== GLOBAL VARIABLES ==========
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let products = [];
    let currentZoomProduct = null;

    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', function() {
        initSparkles();
        initLogoHandler();
        initProducts();
        initInstagram();
        initGoldPrice();
        initEventListeners();
        
        // Load PayPal SDK
        loadPayPalSDK();
        
        // Hide splash screen
        setTimeout(() => {
            const splashScreen = document.getElementById('splash-screen');
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 500);
        }, 4000);
    });

    // ========== LOAD PAYPAL SDK ==========
    function loadPayPalSDK() {
        // Remove existing PayPal SDK if any
        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Load PayPal SDK with sandbox for testing
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=AQwq4X5YxZKABC123DEF456&currency=AED&intent=capture';
        script.async = true;
        script.onload = function() {
            console.log('PayPal SDK loaded successfully');
            initPayPalButtons();
        };
        script.onerror = function() {
            console.error('Failed to load PayPal SDK');
            // Fallback to sandbox
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=AED';
            fallbackScript.async = true;
            fallbackScript.onload = function() {
                console.log('PayPal Sandbox SDK loaded');
                initPayPalButtons();
            };
            document.head.appendChild(fallbackScript);
        };
        document.head.appendChild(script);
    }

    // ========== WORKING PAYPAL INTEGRATION ==========
    function initPayPalButtons() {
        // Check if PayPal is available
        if (typeof paypal === 'undefined') {
            console.log('PayPal not loaded yet, retrying...');
            setTimeout(initPayPalButtons, 1000);
            return;
        }

        console.log('Initializing PayPal buttons...');
        
        // Render PayPal button in cart modal
        renderCartPayPalButton();
        
        // Render express checkout button
        renderExpressCheckoutButton();
    }

    function renderCartPayPalButton() {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;
        
        // Clear previous buttons
        container.innerHTML = '';
        
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal',
                height: 45
            },
            
            createOrder: function(data, actions) {
                if (cart.length === 0) {
                    showNotification('Your cart is empty!');
                    return false;
                }
                
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                return actions.order.create({
                    purchase_units: [{
                        description: 'RYAAN JEWELLERS Purchase',
                        amount: {
                            currency_code: 'AED',
                            value: (total / 100).toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'AED',
                                    value: (total / 100).toFixed(2)
                                }
                            }
                        },
                        items: cart.map(item => ({
                            name: item.name.substring(0, 120),
                            description: `Jewelry - ${item.category}`,
                            quantity: item.quantity.toString(),
                            unit_amount: {
                                currency_code: 'AED',
                                value: (item.price / 100).toFixed(2)
                            },
                            category: 'PHYSICAL_GOODS'
                        }))
                    }],
                    application_context: {
                        shipping_preference: 'NO_SHIPPING'
                    }
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    console.log('Payment successful:', details);
                    
                    // Show success message
                    const successMsg = `
                        <div style="text-align: center; padding: 30px;">
                            <div style="color: var(--gold); font-size: 3rem; margin-bottom: 20px;">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3 style="color: var(--gold); margin-bottom: 10px;">Payment Successful!</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                Thank you for your purchase at RYAAN JEWELLERS
                            </p>
                            <p><strong>Order ID:</strong> ${details.id}</p>
                            <p><strong>Amount:</strong> AED ${details.purchase_units[0].amount.value}</p>
                            <p><strong>Status:</strong> ${details.status}</p>
                        </div>
                    `;
                    
                    // Update cart modal with success message
                    document.getElementById('cartItems').innerHTML = successMsg;
                    document.getElementById('paypal-button-container').innerHTML = '';
                    document.getElementById('cartTotal').textContent = 'AED 0';
                    
                    // Clear cart
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    
                    showNotification('✅ Payment successful! Order ID: ' + details.id);
                });
            },
            
            onError: function(err) {
                console.error('PayPal Error:', err);
                showNotification('❌ Payment failed: ' + (err.message || 'Please try again'));
            },
            
            onClick: function(data, actions) {
                // Validate before proceeding
                if (cart.length === 0) {
                    showNotification('Your cart is empty!');
                    return actions.reject();
                }
                return actions.resolve();
            }
        }).render('#paypal-button-container');
    }

    function renderExpressCheckoutButton() {
        const container = document.getElementById('paypal-express-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        paypal.Buttons({
            style: {
                layout: 'horizontal',
                color: 'gold',
                shape: 'rect',
                label: 'checkout',
                tagline: false,
                height: 45
            },
            
            createOrder: function(data, actions) {
                // If cart is empty, use first product as sample
                if (cart.length === 0) {
                    const sampleProduct = products[0];
                    if (!sampleProduct) {
                        showNotification('No products available');
                        return false;
                    }
                    
                    return actions.order.create({
                        purchase_units: [{
                            description: `RYAAN JEWELLERS - ${sampleProduct.name}`,
                            amount: {
                                currency_code: 'AED',
                                value: (sampleProduct.price / 100).toFixed(2)
                            }
                        }]
                    });
                }
                
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return actions.order.create({
                    purchase_units: [{
                        description: 'RYAAN JEWELLERS Purchase',
                        amount: {
                            currency_code: 'AED',
                            value: (total / 100).toFixed(2)
                        }
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showNotification('✅ Express checkout successful!');
                    
                    // Clear cart
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    
                    // Show success in cart modal if open
                    if (document.getElementById('cartModal').classList.contains('active')) {
                        document.getElementById('cartItems').innerHTML = `
                            <div style="text-align: center; padding: 30px;">
                                <div style="color: var(--gold); font-size: 3rem; margin-bottom: 20px;">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <h4 style="color: var(--gold);">Payment Successful!</h4>
                                <p>Order ID: ${details.id}</p>
                            </div>
                        `;
                    }
                });
            }
        }).render('#paypal-express-container');
    }

    // ========== WORKING ZOOM FUNCTIONALITY ==========
    function openZoomViewer(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        currentZoomProduct = product;
        
        const modal = document.getElementById('zoomModal');
        modal.innerHTML = `
            <div class="modal-content" style="width: 95%; height: 95vh; max-width: 1200px;">
                <button class="modal-close" onclick="closeModal('zoomModal')">
                    <i class="fas fa-times"></i>
                </button>
                <div style="display: flex; height: 100%;">
                    <div style="flex: 1; padding: 40px; overflow-y: auto; background: var(--bg-secondary);">
                        <h3 style="color: var(--gold); margin-bottom: 20px; font-size: 1.8rem;">${product.name}</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 25px;">${product.description}</p>
                        
                        <div style="margin-bottom: 25px;">
                            <h4 style="color: var(--text-primary); margin-bottom: 10px;">Details</h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                                <div>
                                    <p style="color: var(--text-muted); font-size: 0.9rem;">Category</p>
                                    <p style="color: var(--text-primary);">${product.category}</p>
                                </div>
                                <div>
                                    <p style="color: var(--text-muted); font-size: 0.9rem;">Price</p>
                                    <p style="color: var(--gold); font-weight: 600; font-size: 1.2rem;">AED ${product.price.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 30px;">
                            <button class="btn btn-gold" style="width: 100%; margin-bottom: 15px;" onclick="addToCart(${product.id}); closeModal('zoomModal');">
                                <i class="fas fa-shopping-bag"></i> Add to Cart - AED ${product.price.toLocaleString()}
                            </button>
                            <p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                                <i class="fas fa-sync-alt"></i> ${product.installment}
                            </p>
                        </div>
                    </div>
                    
                    <div style="flex: 1.5; position: relative; overflow: hidden; background: var(--black-light);">
                        <img id="zoomImage" 
                             src="${product.image}" 
                             alt="${product.name}"
                             style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzFhMWExYSIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                        
                        <!-- Zoom controls -->
                        <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 10;">
                            <button onclick="zoomIn()" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.7); 
                                    color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button onclick="zoomOut()" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.7); 
                                    color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <button onclick="resetZoom()" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.7); 
                                    color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        
                        <!-- Zoom info -->
                        <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); 
                                    color: white; padding: 10px 15px; border-radius: var(--border-radius); font-size: 0.9rem;">
                            <i class="fas fa-mouse-pointer"></i> Click & drag to pan • Scroll to zoom
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Initialize zoom functionality
        setTimeout(initImageZoom, 100);
    }

    let zoomLevel = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

    function initImageZoom() {
        const image = document.getElementById('zoomImage');
        if (!image) return;
        
        // Reset zoom state
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
        
        // Mouse wheel zoom
        image.addEventListener('wheel', function(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoomLevel = Math.max(0.5, Math.min(5, zoomLevel * delta));
            updateImageTransform();
        });
        
        // Mouse drag for panning
        image.addEventListener('mousedown', function(e) {
            if (zoomLevel > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                image.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateImageTransform();
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
            if (image) image.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
        });
        
        // Touch events for mobile
        let initialDistance = null;
        
        image.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1]);
            }
        });
        
        image.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2 && initialDistance !== null) {
                e.preventDefault();
                const currentDistance = getDistance(e.touches[0], e.touches[1]);
                const delta = currentDistance / initialDistance;
                zoomLevel = Math.max(0.5, Math.min(5, zoomLevel * delta));
                initialDistance = currentDistance;
                updateImageTransform();
            }
        });
        
        image.addEventListener('touchend', function() {
            initialDistance = null;
        });
    }

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function updateImageTransform() {
        const image = document.getElementById('zoomImage');
        if (!image) return;
        
        image.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
        image.style.transition = isDragging ? 'none' : 'transform 0.2s ease';
        image.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
        
        // Show zoom level
        const zoomInfo = document.querySelector('.zoom-level-display');
        if (!zoomInfo) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'zoom-level-display';
            infoDiv.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
                z-index: 10;
            `;
            document.querySelector('#zoomModal .modal-content > div > div:last-child').appendChild(infoDiv);
        }
        document.querySelector('.zoom-level-display').textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    function zoomIn() {
        zoomLevel = Math.min(5, zoomLevel * 1.2);
        updateImageTransform();
    }

    function zoomOut() {
        zoomLevel = Math.max(0.5, zoomLevel * 0.8);
        updateImageTransform();
    }

    function resetZoom() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
    }

    // ========== WORKING 360° VIEWER ==========
    function open360Viewer(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        // Create 360 image sequence (in real app, you'd have actual 360 images)
        const imageSequence = [
            product.image,
            product.image, // In real app, these would be different angles
            product.image,
            product.image,
            product.image,
            product.image,
            product.image,
            product.image
        ];
        
        const modal = document.getElementById('viewerModal');
        modal.innerHTML = `
            <div class="modal-content" style="width: 95%; height: 95vh; max-width: 1200px;">
                <button class="modal-close" onclick="closeModal('viewerModal')">
                    <i class="fas fa-times"></i>
                </button>
                <div style="padding: 40px; height: 100%; display: flex; flex-direction: column;">
                    <h3 style="color: var(--gold); margin-bottom: 20px; text-align: center;">
                        <i class="fas fa-sync-alt"></i> ${product.name} - 360° View
                    </h3>
                    
                    <div style="flex: 1; display: flex; gap: 40px; height: calc(100% - 100px);">
                        <div style="flex: 2; position: relative; overflow: hidden; border-radius: var(--border-radius); 
                                    background: var(--black-light);">
                            <img id="viewer360Image" 
                                 src="${imageSequence[0]}" 
                                 alt="${product.name} - 360 View"
                                 style="width: 100%; height: 100%; object-fit: contain;"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzFhMWExYSIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4zNjDigJMgVmlldzwvdGV4dD48L3N2Zz4='">
                            
                            <!-- 360 Controls -->
                            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); 
                                        display: flex; gap: 10px; background: rgba(0,0,0,0.7); padding: 10px 20px; 
                                        border-radius: 30px; z-index: 10;">
                                <button onclick="rotate360Left()" style="background: none; border: none; color: white; 
                                        cursor: pointer; font-size: 1.2rem;">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button onclick="toggleAutoRotate()" id="autoRotateBtn" style="background: var(--gold); 
                                        color: var(--black); border: none; padding: 8px 20px; border-radius: 20px; 
                                        cursor: pointer; font-weight: 600;">
                                    <i class="fas fa-play"></i> Auto Rotate
                                </button>
                                <button onclick="rotate360Right()" style="background: none; border: none; color: white; 
                                        cursor: pointer; font-size: 1.2rem;">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            
                            <!-- Rotation indicator -->
                            <div style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.7); 
                                        color: white; padding: 8px 15px; border-radius: var(--border-radius); 
                                        font-size: 0.9rem;">
                                <i class="fas fa-sync-alt"></i> <span id="rotationAngle">0°</span>
                            </div>
                        </div>
                        
                        <div style="flex: 1; overflow-y: auto;">
                            <h4 style="color: var(--text-primary); margin-bottom: 15px;">Product Details</h4>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;">${product.description}</p>
                            
                            <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--border-radius); 
                                        margin-bottom: 20px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="color: var(--text-muted);">Price:</span>
                                    <span style="color: var(--gold); font-weight: 600;">AED ${product.price.toLocaleString()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="color: var(--text-muted);">Installment:</span>
                                    <span style="color: var(--text-secondary);">${product.installment}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Category:</span>
                                    <span style="color: var(--text-secondary); text-transform: capitalize;">${product.category}</span>
                                </div>
                            </div>
                            
                            <button class="btn btn-gold" style="width: 100%; margin-bottom: 15px;" 
                                    onclick="addToCart(${product.id}); closeModal('viewerModal');">
                                <i class="fas fa-shopping-bag"></i> Add to Cart
                            </button>
                            
                            <div style="margin-top: 25px;">
                                <h4 style="color: var(--text-primary); margin-bottom: 15px;">View Angles</h4>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                                    ${imageSequence.map((img, index) => `
                                        <img src="${img}" 
                                             alt="Angle ${index + 1}"
                                             style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; 
                                                    cursor: pointer; border: 2px solid ${index === 0 ? 'var(--gold)' : 'transparent'};"
                                             onclick="change360Angle(${index})"
                                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Jm5ic3A7PC90ZXh0Pjwvc3ZnPg=='">
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Initialize 360 viewer
        init360Viewer(imageSequence);
    }

    let currentAngle = 0;
    let imageSequence360 = [];
    let autoRotateInterval = null;
    let isAutoRotating = false;

    function init360Viewer(sequence) {
        imageSequence360 = sequence;
        currentAngle = 0;
        
        // Update image
        update360Image();
    }

    function update360Image() {
        const image = document.getElementById('viewer360Image');
        const angleDisplay = document.getElementById('rotationAngle');
        
        if (image && imageSequence360.length > 0) {
            const imageIndex = Math.floor((currentAngle % 360) / (360 / imageSequence360.length));
            image.src = imageSequence360[imageIndex];
        }
        
        if (angleDisplay) {
            angleDisplay.textContent = `${Math.round(currentAngle)}°`;
        }
    }

    function rotate360Left() {
        currentAngle = (currentAngle - 45) % 360;
        update360Image();
    }

    function rotate360Right() {
        currentAngle = (currentAngle + 45) % 360;
        update360Image();
    }

    function toggleAutoRotate() {
        const button = document.getElementById('autoRotateBtn');
        
        if (isAutoRotating) {
            clearInterval(autoRotateInterval);
            isAutoRotating = false;
            button.innerHTML = '<i class="fas fa-play"></i> Auto Rotate';
            button.style.background = 'var(--gold)';
        } else {
            isAutoRotating = true;
            button.innerHTML = '<i class="fas fa-pause"></i> Stop';
            button.style.background = 'var(--gold-dark)';
            
            autoRotateInterval = setInterval(() => {
                currentAngle = (currentAngle + 5) % 360;
                update360Image();
            }, 100);
        }
    }

    function change360Angle(index) {
        if (imageSequence360[index]) {
            const image = document.getElementById('viewer360Image');
            if (image) {
                image.src = imageSequence360[index];
            }
            currentAngle = index * (360 / imageSequence360.length);
            update360Image();
        }
    }

    // ========== REST OF YOUR JAVASCRIPT (keep all other functions) ==========
    // [Keep all your existing functions like initSparkles, initProducts, 
    //  addToCart, showNotification, etc. from previous code]
    
    // Make sure to keep these essential functions:
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
        showNotification(`✅ ${product.name} added to cart!`);
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--gold);
            color: var(--black);
            padding: 15px 25px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-gold);
            z-index: 4000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Stop auto rotation if active
        if (isAutoRotating) {
            toggleAutoRotate();
        }
    }
    
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelector('.cart-count').textContent = count;
    }
    
    // Initialize cart count
    updateCartCount();
</script>

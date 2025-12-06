/* =====================
   CONFIGURATION
   - Updated with your actual file names
   ===================== */
const RAW_BASE = 'https://raw.githubusercontent.com/ryaanjewellers007/ryaanjewellers007/main/';
const LOGO_CANDIDATES = ['Logo new ryaan.png'];

// Your uploaded products with correct file names
const PRODUCTS = [
  { 
    id: 'heart_bangle', 
    title: 'Heart Design Bangle', 
    price: 1850, 
    purity: 18, 
    weight: 7.5, 
    category: 'bangles',
    collection: 'Romantic Collection',
    description: 'Elegant heart-shaped bangle in 18K gold, perfect for expressing love.',
    features: ['Heart Motif', 'High Polish Finish', 'Adjustable Fit'],
    images: ['Heart Bangle.jpg']
  },
  { 
    id: 'butterfly_ring', 
    title: 'Butterfly Diamond Ring', 
    price: 2450, 
    purity: 18, 
    weight: 4.8, 
    category: 'rings',
    collection: 'Nature Collection',
    description: 'Delicate butterfly ring with diamond accents, symbolizing transformation.',
    features: ['Diamond Accents', 'Butterfly Design', 'Size Adjustable'],
    images: ['Batterfly Ring.jpg']
  },
  { 
    id: 'chopard_earring', 
    title: 'Chopard Inspired Earrings', 
    price: 3200, 
    purity: 18, 
    weight: 5.2, 
    category: 'earrings',
    collection: 'Luxury Collection',
    description: 'Luxury earrings inspired by Chopard designs with premium finish.',
    features: ['Chopard Style', 'Premium Finish', 'Evening Wear'],
    images: ['Chopard Earring.jpg']
  },
  { 
    id: 'chaumet_bangle', 
    title: 'Chaumet Style Bangle', 
    price: 4200, 
    purity: 18, 
    weight: 9.8, 
    category: 'bangles',
    collection: 'High Jewelry',
    description: 'Statement bangle inspired by Chaumet haute joaillerie.',
    features: ['Statement Piece', 'French Design', 'Heirloom Quality'],
    images: ['Channel Bangles.jpg']  // Assuming this is the Chaumet bangle
  },
  { 
    id: 'collection_s1', 
    title: 'Floral Necklace S1', 
    price: 1950, 
    purity: 18, 
    weight: 6.3, 
    category: 'necklaces',
    collection: 'Signature Collection',
    description: 'Floral motif necklace from our signature collection.',
    features: ['Floral Design', 'Pendant Necklace', '18" Chain'],
    images: ['S_1.jpg']
  },
  { 
    id: 'collection_s10', 
    title: 'Diamond Bangle S10', 
    price: 3650, 
    purity: 18, 
    weight: 8.5, 
    category: 'bangles',
    collection: 'Signature Collection',
    description: 'Diamond-studded bangle with contemporary design.',
    features: ['Diamond Studded', 'Contemporary Design', 'Secure Clasp'],
    images: ['S_10.jpg']
  },
  { 
    id: 'collection_s11', 
    title: 'Statement Earrings S11', 
    price: 2850, 
    purity: 18, 
    weight: 7.1, 
    category: 'earrings',
    collection: 'Signature Collection',
    description: 'Bold statement earrings with geometric design.',
    features: ['Geometric Design', 'Statement Piece', 'Lightweight'],
    images: ['S_11.jpg']
  }
];

// Collections based on your products
const COLLECTIONS = [
  { name: 'Romantic Collection', count: 1, image: 'heart_bangle' },
  { name: 'Nature Collection', count: 1, image: 'butterfly_ring' },
  { name: 'Luxury Collection', count: 1, image: 'chopard_earring' },
  { name: 'High Jewelry', count: 1, image: 'chaumet_bangle' },
  { name: 'Signature Collection', count: 3, image: 'collection_s1' }
];
// Image loading utility
function loadImage(element, filename) {
  if (!filename) return;
  
  const img = new Image();
  const url = RAW_BASE + encodeURI(filename);
  
  img.onload = function() {
    if (element.tagName === 'IMG') {
      element.src = url;
      element.style.opacity = 1;
    }
  };
  
  img.onerror = function() {
    console.warn(`Image not found: ${filename}`);
    // Fallback to a placeholder
    if (element.tagName === 'IMG') {
      element.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23121212"/><text x="200" y="150" font-family="Arial" font-size="16" fill="%23d4af37" text-anchor="middle">Ryaan Jewellers</text></svg>';
    }
  };
  
  img.src = url;
}

// Load all logos
document.addEventListener('DOMContentLoaded', function() {
  const logos = document.querySelectorAll('#splashLogo, #mainLogo, #footerLogo');
  logos.forEach(logo => {
    loadImage(logo, 'Logo new ryaan.png');
  });
});
// In the renderProducts function, update the image loading:
function renderProducts(list = PRODUCTS) {
  productSlider.innerHTML = '';
  
  list.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img class="product-img" alt="${product.title}" 
           style="opacity:0; transition:opacity 0.3s ease">
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-meta">
          <span>${product.purity}K • ${product.weight}g</span>
          <span>${product.collection}</span>
        </div>
        <div class="product-price">AED ${product.price.toLocaleString()}</div>
        <div class="product-actions">
          <button class="btn-view" onclick="viewProduct('${product.id}')">
            <i class="fas fa-search"></i> View
          </button>
          <button class="btn-cart" onclick="addToCart('${product.id}')">
            <i class="fas fa-shopping-bag"></i> Add
          </button>
        </div>
      </div>
    `;
    
    // Load the product image
    const img = div.querySelector('.product-img');
    loadImage(img, product.images[0]);
    
    productSlider.appendChild(div);
  });
}

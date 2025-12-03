// Add to cart function needs checkout integration
function proceedToCheckout() {
    // Example with Stripe
    const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
    const lineItems = cart.map(item => ({
        price_data: {
            currency: 'aed',
            product_data: {
                name: item.name,
                images: [item.image],
            },
            unit_amount: item.price * 100, // Convert to cents
        },
        quantity: item.quantity,
    }));
    
    // Call your backend to create checkout session
}

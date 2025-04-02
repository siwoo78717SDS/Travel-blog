
const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY');
const membershipBtn = document.getElementById('membershipBtn');
const modal = document.getElementById('membership-modal');
const subscribeBtn = document.getElementById('subscribeBtn');
const vipSection = document.getElementById('vip-section');

// Check VIP status on load
document.addEventListener('DOMContentLoaded', checkVIP);

// Show membership modal
membershipBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Subscribe button click handler
subscribeBtn.addEventListener('click', subscribeVIP);

// Check if user is VIP
function checkVIP() {
    const isVip = localStorage.getItem('vipUser') === 'true';
    if (isVip) {
        vipSection.style.display = 'block';
        membershipBtn.style.display = 'none';
    }
}

// Handle VIP subscription
async function subscribeVIP() {
    try {
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
        });
        const session = await response.json();
        
        // Redirect to Stripe checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Payment Error:', error);
        alert('Something went wrong with the payment process.');
    }
}

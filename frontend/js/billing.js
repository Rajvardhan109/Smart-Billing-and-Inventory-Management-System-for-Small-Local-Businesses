/* ============================================================
   SmartBill — Billing Page
   ============================================================ */

let allProducts = [];
let cart = []; // { productId, name, price, stock, quantity }

// ------- Load Product Picker -------
async function loadProductPicker() {
    try {
        allProducts = await api.get('/products');
        renderProductPicker(allProducts);
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

function renderProductPicker(list) {
    const el = document.getElementById('productPickList');
    const inStock = list.filter((p) => p.quantity > 0);

    if (inStock.length === 0) {
        el.innerHTML = `
            <div class="product-pick-empty">
                <i class="fas fa-box-open"></i>
                <p>No matching in-stock products found.</p>
            </div>`;
        return;
    }

    el.innerHTML = inStock
        .map(
            (p) => `
        <div class="product-pick-item">
            <div class="product-pick-info">
                <span class="product-pick-name">${escapeHtml(p.name)}</span>
                <span class="product-pick-meta">
                    ${formatRupees(p.price)} · ${p.quantity} in stock
                    ${p.category ? `· <span class="pick-category">${escapeHtml(p.category)}</span>` : ''}
                </span>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="addToCart(${p.id})">
                <i class="fas fa-plus"></i> Add
            </button>
        </div>
    `
        )
        .join('');
}

// ------- Search -------
document.getElementById('productSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allProducts.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    renderProductPicker(filtered);
});

// ------- Cart Operations -------
function addToCart(productId) {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
        if (existing.quantity < product.quantity) {
            existing.quantity += 1;
        } else {
            showNotification(`Only ${product.quantity} in stock.`, 'warning');
            return;
        }
    } else {
        cart.push({
            productId,
            name: product.name,
            price: Number(product.price),
            stock: product.quantity,
            quantity: 1,
        });
    }
    renderCart();
    showNotification(`${product.name} added to cart`, 'success');
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find((c) => c.productId === productId);
    if (!item) return;
    quantity = Math.max(1, Math.min(Number(quantity) || 1, item.stock));
    item.quantity = quantity;
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter((c) => c.productId !== productId);
    renderCart();
}

function renderCart() {
    const el = document.getElementById('cartList');
    const countEl = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
    countEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

    if (cart.length === 0) {
        el.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-cart-shopping"></i>
                <p>Cart is empty. Pick a product above.</p>
            </div>`;
    } else {
        el.innerHTML = `
            <div class="cart-items">
                ${cart
                    .map(
                        (item) => `
                    <div class="cart-row">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${escapeHtml(item.name)}</span>
                            <span class="cart-item-price">${formatRupees(item.price)} each</span>
                        </div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateCartQuantity(${item.productId}, ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" min="1" max="${item.stock}" value="${item.quantity}" 
                                   onchange="updateCartQuantity(${item.productId}, this.value)" class="qty-input">
                            <button class="qty-btn" onclick="updateCartQuantity(${item.productId}, ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <span class="cart-item-total">${formatRupees(item.price * item.quantity)}</span>
                        <button class="cart-item-remove" title="Remove" onclick="removeFromCart(${item.productId})">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                `
                    )
                    .join('')}
            </div>`;
    }

    updateTotals();
}

// ------- Totals -------
function updateTotals() {
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const discount = Number(document.getElementById('discount').value) || 0;
    const total = Math.max(subtotal - discount, 0);

    document.getElementById('totalSubtotal').textContent = formatRupees(subtotal);
    document.getElementById('totalDiscount').textContent = `- ${formatRupees(discount)}`;
    document.getElementById('totalGrand').textContent = formatRupees(total);
}

document.getElementById('discount').addEventListener('input', updateTotals);

// ------- Checkout -------
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    if (cart.length === 0) {
        showNotification('Add at least one product to the cart.', 'warning');
        return;
    }

    const payload = {
        customerName: document.getElementById('custName').value.trim() || 'Walk-in Customer',
        customerPhone: document.getElementById('custPhone').value.trim() || null,
        paymentMethod: document.getElementById('payMethod').value,
        discount: Number(document.getElementById('discount').value) || 0,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
    };

    const btn = document.getElementById('checkoutBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Generating...</span>';

    try {
        const result = await api.post('/billing', payload);
        showNotification(`Bill ${result.sale.invoice_number} generated successfully!`, 'success');

        // Reset the form
        cart = [];
        renderCart();
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('discount').value = 0;
        updateTotals();
        loadProductPicker();

        // Open the invoice PDF
        const token = localStorage.getItem('token');
        const pdfUrl = result.pdfUrl + `?token=${token}`;
        window.open(pdfUrl, '_blank');
    } catch (err) {
        showNotification(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-receipt"></i> <span>Generate Bill & Invoice</span>';
    }
});

// ------- Init -------
loadProductPicker();

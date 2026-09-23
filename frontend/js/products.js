/* ============================================================
   SmartBill — Products Page
   ============================================================ */

let products = [];

const backdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');

// ------- Modal -------
function openModal(product = null) {
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('fName').value = product ? product.name : '';
    document.getElementById('fCategory').value = product ? product.category : '';
    document.getElementById('fCostPrice').value = product ? (product.cost_price || 0) : '';
    document.getElementById('fPrice').value = product ? product.price : '';
    document.getElementById('fQuantity').value = product ? product.quantity : '';
    document.getElementById('fThreshold').value = product ? product.low_stock_threshold : 5;
    modalTitle.textContent = product ? 'Edit Product' : 'Add Product';
    backdrop.classList.add('open');
}

function closeModal() {
    backdrop.classList.remove('open');
}

document.getElementById('openAddBtn').addEventListener('click', () => openModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
});

// Save product
document.getElementById('modalSave').addEventListener('click', async () => {
    const id = document.getElementById('productId').value;
    const payload = {
        name: document.getElementById('fName').value.trim(),
        category: document.getElementById('fCategory').value.trim() || 'General',
        cost_price: Number(document.getElementById('fCostPrice').value),
        price: Number(document.getElementById('fPrice').value),
        quantity: Number(document.getElementById('fQuantity').value),
        low_stock_threshold: Number(document.getElementById('fThreshold').value),
    };

    if (!payload.name || isNaN(payload.price) || isNaN(payload.quantity)) {
        showNotification('Please fill in name, price and quantity.', 'error');
        return;
    }

    try {
        if (id) {
            await api.put(`/products/${id}`, payload);
            showNotification('Product updated successfully!', 'success');
        } else {
            await api.post('/products', payload);
            showNotification('Product added successfully!', 'success');
        }
        closeModal();
        loadProducts();
    } catch (err) {
        showNotification(err.message, 'error');
    }
});

// ------- Delete -------
async function deleteProduct(id, name) {
    if (!confirm(`Remove "${name}" from the catalogue?`)) return;
    try {
        await api.del(`/products/${id}`);
        showNotification('Product removed.', 'success');
        loadProducts();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

// ------- Edit -------
function editProduct(id) {
    const product = products.find((p) => p.id === id);
    if (product) openModal(product);
}

// ------- Load & Render -------
async function loadProducts() {
    try {
        products = await api.get('/products');
        renderProducts(products);
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

function renderProducts(list) {
    const body = document.getElementById('productsBody');

    if (list.length === 0) {
        body.innerHTML = `<tr><td colspan="7" class="table-empty">
            <i class="fas fa-box-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
            No products found. Add your first product!
        </td></tr>`;
        return;
    }

    body.innerHTML = list
        .map((p) => {
            const isLow = p.quantity <= p.low_stock_threshold && p.quantity > 0;
            const isOut = p.quantity === 0;
            let statusBadge = '<span class="badge badge-success">In Stock</span>';
            if (isOut) statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
            else if (isLow) statusBadge = '<span class="badge badge-warning">Low Stock</span>';

            return `
            <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.category)}</td>
                <td>${formatRupees(p.price)}</td>
                <td>
                    <span class="stock-value ${isOut ? 'stock-out' : isLow ? 'stock-low' : 'stock-ok'}">
                        ${p.quantity}
                    </span>
                </td>
                <td>${p.low_stock_threshold}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id}, '${escapeHtml(p.name).replace(/'/g, "\\'")}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

// ------- Search & Filter -------
const searchInput = document.getElementById('productSearch');
const stockFilter = document.getElementById('stockFilter');

function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const filter = stockFilter.value;

    let filtered = products.filter(
        (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );

    if (filter === 'in-stock') {
        filtered = filtered.filter((p) => p.quantity > p.low_stock_threshold);
    } else if (filter === 'low-stock') {
        filtered = filtered.filter((p) => p.quantity <= p.low_stock_threshold && p.quantity > 0);
    } else if (filter === 'out-of-stock') {
        filtered = filtered.filter((p) => p.quantity === 0);
    }

    renderProducts(filtered);
}

searchInput.addEventListener('input', applyFilters);
stockFilter.addEventListener('change', applyFilters);

// ------- Init -------
loadProducts();

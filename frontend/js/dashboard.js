/* ============================================================
   SmartBill — Dashboard Page
   ============================================================ */

async function loadDashboard() {
    try {
        const s = await api.get('/dashboard/summary');

        // Update summary cards
        document.getElementById('totalProducts').textContent = s.totalProducts;
        document.getElementById('totalRevenue').textContent = formatRupees(s.todayRevenue);
        document.getElementById('totalSales').textContent = s.todaySalesCount;
        document.getElementById('lowStockCount').textContent = s.lowStockCount;

        // Low stock table
        const lowStockBody = document.getElementById('lowStockTableBody');
        if (s.lowStockProducts.length === 0) {
            lowStockBody.innerHTML = `<tr><td colspan="5" class="table-empty">
                <i class="fas fa-check-circle" style="color: var(--color-success); margin-right: 0.5rem;"></i>
                All items are well-stocked!
            </td></tr>`;
        } else {
            lowStockBody.innerHTML = s.lowStockProducts
                .map(
                    (p) => `
                <tr>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td>${escapeHtml(p.category || 'General')}</td>
                    <td>${formatRupees(p.price || 0)}</td>
                    <td>
                        <span class="stock-value ${p.quantity === 0 ? 'stock-out' : 'stock-low'}">
                            ${p.quantity}
                        </span>
                    </td>
                    <td>
                        ${
                            p.quantity === 0
                                ? '<span class="badge badge-danger">Out of Stock</span>'
                                : '<span class="badge badge-warning">Low Stock</span>'
                        }
                    </td>
                </tr>
            `
                )
                .join('');
        }

        // Recent sales table
        const recentBody = document.getElementById('recentSalesTableBody');
        if (s.recentSales.length === 0) {
            recentBody.innerHTML = `<tr><td colspan="4" class="table-empty">
                No bills generated yet. <a href="billing.html" style="color: var(--color-accent);">Create your first bill →</a>
            </td></tr>`;
        } else {
            recentBody.innerHTML = s.recentSales
                .map(
                    (sale) => `
                <tr>
                    <td><code>${sale.invoice_number}</code></td>
                    <td>${escapeHtml(sale.customer_name)}</td>
                    <td>${formatDateTime(sale.created_at)}</td>
                    <td><strong>${formatRupees(sale.total_amount)}</strong></td>
                </tr>
            `
                )
                .join('');
        }
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

loadDashboard();

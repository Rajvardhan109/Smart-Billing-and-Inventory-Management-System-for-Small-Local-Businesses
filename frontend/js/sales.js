/* ============================================================
   SmartBill — Sales History Page
   ============================================================ */

async function loadSales() {
    try {
        const sales = await api.get('/sales?limit=200');
        const body = document.getElementById('salesBody');

        // Update summary cards
        const totalCount = document.getElementById('totalSalesCount');
        const totalRevenue = document.getElementById('totalSalesRevenue');
        if (totalCount) totalCount.textContent = sales.length;
        if (totalRevenue) {
            const revenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
            totalRevenue.textContent = formatRupees(revenue);
        }

        if (sales.length === 0) {
            body.innerHTML = `<tr><td colspan="6" class="table-empty">
                <i class="fas fa-receipt" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                No bills generated yet. <a href="billing.html" style="color: var(--color-accent);">Create your first bill →</a>
            </td></tr>`;
            return;
        }

        body.innerHTML = sales
            .map(
                (sale) => `
            <tr>
                <td><code>${sale.invoice_number}</code></td>
                <td>${formatDateTime(sale.created_at)}</td>
                <td>${escapeHtml(sale.customer_name)}</td>
                <td>
                    <span class="badge badge-${
                        sale.payment_method === 'Cash' ? 'success' : sale.payment_method === 'UPI' ? 'info' : 'warning'
                    }">
                        ${sale.payment_method === 'Cash' ? '💵' : sale.payment_method === 'UPI' ? '📱' : '💳'} 
                        ${sale.payment_method}
                    </span>
                </td>
                <td><strong>${formatRupees(sale.total_amount)}</strong></td>
                <td>
                    <a class="btn btn-sm btn-secondary" href="/api/billing/invoice/${sale.invoice_number}/pdf?token=${localStorage.getItem('token')}" target="_blank" title="View Invoice">
                        <i class="fas fa-file-pdf"></i>
                        <span>Invoice</span>
                    </a>
                </td>
            </tr>
        `
            )
            .join('');
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

loadSales();

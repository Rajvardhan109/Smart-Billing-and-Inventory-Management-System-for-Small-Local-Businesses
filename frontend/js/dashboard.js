/* ============================================================
   SmartBill - Dashboard Page
   ============================================================ */
let analyticsChartInstance = null;
let currentAnalyticsData = null;

async function loadDashboard() {
    try {
        const s = await api.get('/dashboard/summary');

        document.getElementById('totalProducts').textContent = s.totalProducts;
        document.getElementById('totalItemsInStock').textContent = s.totalItemsInStock;
        
        document.getElementById('todayRevenue').textContent = formatRupees(s.todayRevenue);
        document.getElementById('todaySalesCount').textContent = s.todaySalesCount;
        
        document.getElementById('allTimeSales').textContent = formatRupees(s.allTimeSales);
        document.getElementById('allTimeProfit').textContent = formatRupees(s.allTimeProfit);
        
        document.getElementById('lowStockCount').textContent = s.lowStockCount;

        const lowStockBody = document.getElementById('lowStockTableBody');
        if (s.lowStockProducts.length === 0) {
            lowStockBody.innerHTML = `<tr><td colspan="5" class="table-empty">All items are well-stocked!</td></tr>`;
        } else {
            lowStockBody.innerHTML = s.lowStockProducts.map(p => {
                const isOut = p.quantity === 0;
                let statusBadge = '<span class="badge badge-warning">Low Stock</span>';
                if (isOut) statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
                return `<tr>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td>${escapeHtml(p.category)}</td>
                    <td>${formatRupees(p.price)}</td>
                    <td><span class="stock-value ${isOut ? 'stock-out' : 'stock-low'}">${p.quantity}</span></td>
                    <td>${statusBadge}</td>
                </tr>`;
            }).join('');
        }

        const recentBody = document.getElementById('recentSalesTableBody');
        if (s.recentSales.length === 0) {
            recentBody.innerHTML = `<tr><td colspan="4" class="table-empty">No bills generated yet.</td></tr>`;
        } else {
            recentBody.innerHTML = s.recentSales.map(sale => `<tr>
                <td><code>${escapeHtml(sale.invoice_number)}</code></td>
                <td>${escapeHtml(sale.customer_name)}</td>
                <td>${new Date(sale.created_at).toLocaleString()}</td>
                <td><strong>${formatRupees(sale.total_amount)}</strong></td>
            </tr>`).join('');
        }
        
        await loadAnalytics();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function loadAnalytics() {
    try {
        currentAnalyticsData = await api.get('/dashboard/analytics');
        renderChart('daily');
        
        document.getElementById('analyticsTimeframe').addEventListener('change', (e) => {
            renderChart(e.target.value);
        });
    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

function renderChart(timeframe) {
    if (!currentAnalyticsData) return;
    
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    let labels = [];
    let salesData = [];
    let profitData = [];
    
    if (timeframe === 'daily') {
        const data = currentAnalyticsData.salesByDate || [];
        labels = data.map(d => new Date(d.date).toLocaleDateString());
        salesData = data.map(d => d.sales);
        profitData = data.map(d => d.profit);
    } else {
        const data = currentAnalyticsData.salesByMonth || [];
        labels = data.map(d => {
            const parts = d.month.split('-');
            const date = new Date(parts[0], parts[1] - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        });
        salesData = data.map(d => d.sales);
        profitData = data.map(d => d.profit);
    }

    if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
    }

    analyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Total Sales',
                    data: salesData.length > 0 ? salesData : [0],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Total Profit',
                    data: profitData.length > 0 ? profitData : [0],
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: getComputedStyle(document.body).getPropertyValue('--color-text') }
                }
            },
            scales: {
                x: {
                    ticks: { color: getComputedStyle(document.body).getPropertyValue('--color-text-muted') },
                    grid: { color: getComputedStyle(document.body).getPropertyValue('--color-border') }
                },
                y: {
                    ticks: { 
                        color: getComputedStyle(document.body).getPropertyValue('--color-text-muted'),
                        callback: function(value) { return 'Rs ' + value; }
                    },
                    grid: { color: getComputedStyle(document.body).getPropertyValue('--color-border') }
                }
            }
        }
    });
}

function applyRoleRestrictions() {
    const userStr = localStorage.getItem('smartbill_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (currentUser && currentUser.role === 'cashier') {
        const sensitiveElements = document.querySelectorAll('.admin-only');
        sensitiveElements.forEach(el => el.style.display = 'none');
    }
}

applyRoleRestrictions();
loadDashboard();

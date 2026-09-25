/* ============================================================
   SmartBill — Main JavaScript (Shared Utilities)
   ============================================================ */

// ------- Auth Guard -------
const publicPages = ['index.html', 'login.html', 'signup.html', ''];
const currentPage = window.location.pathname.split('/').pop();

if (!publicPages.includes(currentPage)) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// ------- API Configuration -------
// ------- API Configuration -------
// Using relative path so it works everywhere (Localhost, Vercel, or LocalTunnel)
const API_BASE = '/api';

async function apiRequest(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        headers,
        ...options,
    });

    if (res.status === 401 || res.status === 403) {
        window.logout();
        return null;
    }

    let data = null;
    try {
        data = await res.json();
    } catch (_) {
        /* no body */
    }

    if (!res.ok) {
        throw new Error((data && data.error) || 'API request failed');
    }
    return data;
}

const api = {
    get: (path) => apiRequest(path),
    post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
    del: (path) => apiRequest(path, { method: 'DELETE' }),
};

// ------- Formatting Helpers -------
function formatRupees(n) {
    return `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso) {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ------- Notifications / Toast -------
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slideIn`;
    
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info',
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Legacy alias
function showToast(message, isError = false) {
    showNotification(message, isError ? 'error' : 'success');
}

// ------- Navigation -------
document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            document.body.classList.toggle('sidebar-open');
        });

        // Close sidebar on overlay click (mobile)
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Set current date
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    // Set Welcome Message
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.firstName) {
                welcomeEl.innerHTML = `Welcome back, <span class="text-gradient">${user.firstName}</span>!`;
            }
        } catch (e) {}
    }

    // Settings Page Logic
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('set_email').value = user.email || '';
            document.getElementById('set_fname').value = user.firstName || '';
            document.getElementById('set_lname').value = user.lastName || '';
            document.getElementById('set_store').value = user.storeName || '';
        }

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveSettingsBtn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const payload = {
                email: document.getElementById('set_email').value,
                firstName: document.getElementById('set_fname').value,
                lastName: document.getElementById('set_lname').value,
                storeName: document.getElementById('set_store').value,
            };

            try {
                const data = await api.put('/auth/profile', payload);
                localStorage.setItem('user', JSON.stringify(data.user));
                showNotification('Profile updated successfully!', 'success');
                // Update welcome message if present
                const welcomeEl = document.getElementById('welcomeMessage');
                if (welcomeEl && data.user.firstName) {
                    welcomeEl.innerHTML = `Welcome back, <span class="text-gradient">${data.user.firstName}</span>!`;
                }
            } catch (err) {
                showNotification(err.message || 'Failed to update profile.', 'error');
            } finally {
                btn.innerHTML = originalHtml;
            }
        });
    }

    // Animate counters in hero section
    animateCounters();

    // Intersection Observer for animations
    observeAnimations();

    // Init 3D Tilt for cards
    // init3DTilt();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('open')) {
                    hamburger.classList.remove('active');
                    mobileMenu.classList.remove('open');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    });
});

// ------- Counter Animation -------
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(eased * target).toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        // Only animate when visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(update);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(counter);
    });
}

// ------- Intersection Observer for Animations -------
function observeAnimations() {
    const elements = document.querySelectorAll('.animate-fadeInUp');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
}

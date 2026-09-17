// Google Auth Callback
async function handleCredentialResponse(response) {
    try {
        const data = await api.post('/auth/google', { credential: response.credential });
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showNotification('Successfully logged in with Google!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
        showNotification(err.message || 'Google login failed.', 'error');
    }
}

// Setup Standard Form Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const data = await api.post('/auth/login', { email, password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showNotification('Successfully logged in!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (err) {
                showNotification(err.message || 'Login failed.', 'error');
                btn.innerHTML = originalContent;
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            const firstName = document.getElementById('fname').value;
            const lastName = document.getElementById('lname').value;
            const storeName = document.getElementById('store').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const data = await api.post('/auth/signup', { firstName, lastName, storeName, email, password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showNotification('Account created successfully!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (err) {
                showNotification(err.message || 'Signup failed.', 'error');
                btn.innerHTML = originalContent;
            }
        });
    }
});

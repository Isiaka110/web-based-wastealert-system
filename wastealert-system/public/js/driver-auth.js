// public/js/driver-auth.js (WASTEALERT DRIVER AUTH LOGIC)

const API_URL = 'http://localhost:5000/api/drivers/auth';
const DASHBOARD_URL = 'driver-dashboard.html';

$(document).ready(function() {
    // Check if driver is already logged in
    if (localStorage.getItem('driverToken')) {
        window.location.href = DASHBOARD_URL;
    }

    // Toggle between login and registration forms
    $('#showRegisterBtn').on('click', showRegister);
    $('#showLoginBtn').on('click', showLogin);

    // Form submission handlers
    $('#loginForm').on('submit', handleLogin);
    $('#registerForm').on('submit', handleRegister);
});

// =================================================================
// FORM TOGGLE FUNCTIONS
// =================================================================

function showRegister() {
    $('#loginSection').addClass('hidden');
    $('#registerSection').removeClass('hidden');
    $('#pageTitle').text('Driver Registration | WasteAlert');
    $('#subTitle').text('Create your driver account');
    hideStatusMessage();
}

function showLogin() {
    $('#registerSection').addClass('hidden');
    $('#loginSection').removeClass('hidden');
    $('#pageTitle').text('Driver Login | WasteAlert');
    $('#subTitle').text('Sign in to start your session');
    hideStatusMessage();
}

// =================================================================
// AUTH HANDLERS
// =================================================================

async function handleLogin(e) {
    e.preventDefault();
    showStatusMessage('Logging in...', 'info');

    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('driverToken', data.token);
            showStatusMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = DASHBOARD_URL;
            }, 1000);
        } else {
            showStatusMessage(data.error || 'Login failed. Check credentials.', 'error');
        }
    } catch (err) {
        console.error("Login Error:", err);
        showStatusMessage('Network error during login.', 'error');
    } finally {
        hideStatusMessage(3000);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showStatusMessage('Registering driver...', 'info');

    const name = $('#registerName').val().trim();
    const email = $('#registerEmail').val().trim();
    const password = $('#registerPassword').val();

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // New driver registered successfully (and truck profile created)
            localStorage.setItem('driverToken', data.token);
            showStatusMessage('Registration successful! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = DASHBOARD_URL;
            }, 1000);
        } else {
            showStatusMessage(data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        console.error("Registration Error:", err);
        showStatusMessage('Network error during registration.', 'error');
    } finally {
        hideStatusMessage(4000);
    }
}

// =================================================================
// UTILITIES
// =================================================================

function showStatusMessage(text, type) {
    const messageDiv = $('#statusMessage');
    messageDiv.removeClass().addClass('fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl font-medium');
    
    if (type === 'success') {
        messageDiv.addClass('bg-green-100 text-green-700').html(`✅ ${text}`).show();
    } else if (type === 'error') {
        messageDiv.addClass('bg-red-100 text-red-700').html(`❌ ${text}`).show();
    } else { // info
        messageDiv.addClass('bg-blue-100 text-blue-700').html(`ℹ️ ${text}`).show();
    }
}

function hideStatusMessage(delay = 0) {
    if (delay > 0) {
        setTimeout(() => $('#statusMessage').hide(), delay);
    } else {
        $('#statusMessage').hide();
    }
}
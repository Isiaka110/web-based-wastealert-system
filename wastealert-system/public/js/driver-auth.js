// public/js/driver-auth.js (EMIWIP FLEET OPERATOR AUTH LOGIC - ROBUST)

const API_URL = 'http://localhost:5000/api/drivers/auth';
const DASHBOARD_URL = 'driver-dashboard.html';
const LOGIN_URL = 'driver-auth.html'; 

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
// FORM TOGGLE FUNCTIONS (EMIWIP Terminology)
// =================================================================

function showRegister() {
    $('#loginSection').addClass('hidden');
    $('#registerSection').removeClass('hidden');
    $('#pageTitle').text('Fleet Unit Registration | EMIWIP');
    $('#subTitle').text('Create your Fleet Operator account and register your Unit');
    hideStatusMessage();
}

function showLogin() {
    $('#registerSection').addClass('hidden');
    $('#loginSection').removeClass('hidden');
    $('#pageTitle').text('Fleet Operator Login | EMIWIP');
    $('#subTitle').text('Sign in to start your session');
    hideStatusMessage();
}

// =================================================================
// AUTH HANDLERS
// =================================================================

async function handleLogin(e) {
    e.preventDefault();
    const $submitBtn = $('#loginBtn');
    setButtonLoading($submitBtn, true, 'Signing In...');
    showStatusMessage('Attempting sign in...', 'info');

    const formData = {
        email: $('#loginEmail').val(),
        password: $('#loginPassword').val(),
    };

    try {
        const response = await fetch(API_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Store token and user data
            localStorage.setItem('driverToken', data.user.token);
            localStorage.setItem('driverUserData', JSON.stringify(data.user)); 
            
            showStatusMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = DASHBOARD_URL;
            }, 1000);
        } else {
            // Error: Handle 401 (Invalid) and 403 (Pending Approval)
            const errorMessage = data.error || 'Login failed. Please check your credentials.';
            showStatusMessage(errorMessage, 'error');
        }
    } catch (err) {
        console.error("Login Error:", err);
        showStatusMessage('Network error. Could not connect to the EMIWIP server.', 'error');
    } finally {
        setButtonLoading($submitBtn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const $submitBtn = $('#registerBtn');
    setButtonLoading($submitBtn, true, 'Registering...');
    showStatusMessage('Processing registration...', 'info');

    const formData = {
        username: $('#registerUsername').val(),
        email: $('#registerEmail').val(),
        password: $('#registerPassword').val(),
        license_plate: $('#registerLicensePlate').val().toUpperCase(), 
        capacity_tons: parseFloat($('#registerCapacityTons').val()),
    };
    
    if (isNaN(formData.capacity_tons) || formData.capacity_tons <= 0) {
        showStatusMessage('Capacity must be a positive number.', 'error');
        setButtonLoading($submitBtn, false);
        return;
    }

    try {
        const response = await fetch(API_URL + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            showStatusMessage(data.message || 'Registration successful. Waiting for Portal Manager approval.', 'success');
            setTimeout(() => {
                window.location.href = LOGIN_URL;
            }, 3000);
        } else {
            // CRITICAL FIX: Handles the E11000/400 errors gracefully
            const errorMessage = data.error || 'Registration failed.';
            showStatusMessage(errorMessage, 'error');
        }
    } catch (err) {
        console.error("Registration Error:", err);
        showStatusMessage('Network error during registration.', 'error');
    } finally {
        setButtonLoading($submitBtn, false);
    }
}

// =================================================================
// UTILITIES (setButtonLoading, showStatusMessage, hideStatusMessage)
// =================================================================
function setButtonLoading($btn, isLoading, loadingText = 'Processing...') {
    const originalText = $btn.data('original-text') || $btn.text();
    $btn.data('original-text', originalText);
    
    $btn.prop('disabled', isLoading);
    if (isLoading) {
        $btn.text(loadingText);
    } else {
        $btn.text(originalText);
    }
}

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
    setTimeout(hideStatusMessage, 5000);
}

function hideStatusMessage() {
    $('#statusMessage').fadeOut('slow');
}
// public/js/driver-auth.js (Driver Authentication Logic)

const API_AUTH_URL = 'http://localhost:5000/api/drivers/auth';
const DRIVER_DASHBOARD_URL = 'driver-dashboard.html'; // The page where drivers submit their details

$(document).ready(function() {
    // Check if the user is already logged in (token exists)
    if (localStorage.getItem('driverToken')) {
        window.location.href = DRIVER_DASHBOARD_URL;
        return;
    }

    $('#authForm').on('submit', handleAuthSubmit);
    
    // Add event listener to switch between login and signup modes
    $('#toggleAuthMode').on('click', toggleAuthMode);
});

// =================================================================
// PART 1: UI LOGIC
// =================================================================

function toggleAuthMode(e) {
    e.preventDefault();
    const isLogin = $('#authForm').hasClass('login-mode');
    
    // Toggle the form class
    $('#authForm').toggleClass('login-mode signup-mode');
    
    // Toggle input visibility (Driver Name and Confirm Password needed for signup)
    $('.signup-only').toggleClass('hidden');
    
    // Update button text and link text
    if (isLogin) {
        // Switching to SIGNUP mode
        $('#authTitle').text('Driver Sign Up');
        $('#authSubmitBtn').text('Register & Sign In');
        $('#toggleAuthMode').html('Already have an account? <u>Sign In</u>');
    } else {
        // Switching to SIGN IN mode
        $('#authTitle').text('Driver Sign In');
        $('#authSubmitBtn').text('Sign In');
        $('#toggleAuthMode').html('Need an account? <u>Sign Up</u>');
    }
}

// =================================================================
// PART 2: AUTHENTICATION LOGIC
// =================================================================

async function handleAuthSubmit(e) {
    e.preventDefault();
    const isLoginMode = $('#authForm').hasClass('login-mode');
    
    const email = $('#email').val().trim();
    const password = $('#password').val().trim();
    
    if (!email || !password) {
        return showStatusMessage('Please enter email and password.', 'error');
    }

    let endpoint = '';
    let body = {};
    
    if (isLoginMode) {
        // --- SIGN IN LOGIC ---
        endpoint = '/login';
        body = { email, password };
        showStatusMessage('Logging in...', 'info');
    } else {
        // --- SIGN UP LOGIC ---
        const name = $('#driverName').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim();
        
        if (!name || password !== confirmPassword) {
            return showStatusMessage('Please enter your name and ensure passwords match.', 'error');
        }
        
        endpoint = '/register';
        body = { name, email, password };
        showStatusMessage('Registering new driver...', 'info');
    }
    
    // Execute API Call
    try {
        const response = await fetch(API_AUTH_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success: Store token and redirect
            localStorage.setItem('driverToken', data.token);
            showStatusMessage('Success! Redirecting to dashboard.', 'success');
            setTimeout(() => {
                window.location.href = DRIVER_DASHBOARD_URL;
            }, 1000);
        } else {
            // Failure
            showStatusMessage(data.error || 'Authentication failed. Please check your credentials.', 'error');
        }
    } catch (err) {
        console.error("Auth Error:", err);
        showStatusMessage('A network error occurred. Check backend server.', 'error');
    } finally {
        hideStatusMessage(3000);
    }
}

// =================================================================
// PART 3: UTILITIES
// =================================================================

function showStatusMessage(text, type) {
    // Assuming you have a status message div on your HTML page with id="statusMessage"
    const messageDiv = $('#statusMessage');
    messageDiv.removeClass().addClass('p-3 mb-4 text-center font-medium rounded-lg');
    
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
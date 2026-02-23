// public/js/admin-auth.js

// IMPORTANT: Match your Node.js server URL
const LOGIN_API_URL = 'http://localhost:5000/api/auth/login'; 

// Function to handle the form submission
$('#adminLoginForm').on('submit', async function(e) {
    e.preventDefault();
    
    // Disable button and change text while processing
    $('#loginBtn').prop('disabled', true).text('Authenticating...');

    const username = $('#username').val();
    const password = $('#password').val();

    // Prepare the JSON body
    const loginData = { username, password };

    try {
        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS!
            
            // 1. Store the JWT Token securely in the browser's localStorage
            localStorage.setItem('adminToken', data.token);
            
            showMessage('Login Successful! Redirecting...', 'success');
            
            // 2. Redirect the admin to the main Dashboard page (Next Step)
            // We assume the dashboard page will be named 'admin-dashboard.html'
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);

        } else {
            // FAILURE!
            showMessage(data.error || 'Invalid credentials. Please try again.', 'error');
            $('#loginBtn').prop('disabled', false).text('Log In');
        }

    } catch (err) {
        console.error('Network or Server Error:', err);
        showMessage('A network error occurred. Check server status.', 'error');
        $('#loginBtn').prop('disabled', false).text('Log In');
    }
});


// Helper function for showing status messages (copied from report.html)
function showMessage(text, type) {
    const messageDiv = $('#message');
    messageDiv.removeClass().addClass('p-3 mb-4 rounded-lg text-center font-medium');
    
    if (type === 'success') {
        messageDiv.addClass('bg-green-100 text-green-700').html(`✅ ${text}`).show();
    } else if (type === 'error') {
        messageDiv.addClass('bg-red-100 text-red-700').html(`❌ ${text}`).show();
    }
}
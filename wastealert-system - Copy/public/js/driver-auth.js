// public/js/driver-auth.js

const API_URL = 'http://localhost:5000/api/drivers/auth';
const DASHBOARD_URL = 'driver-dashboard.html';

$(document).ready(function () {
    if (localStorage.getItem('driverToken')) {
        window.location.href = DASHBOARD_URL;
        return;
    }

    $('#showRegisterBtn').on('click', showRegister);
    $('#showLoginBtn').on('click', showLogin);
    $('#loginForm').on('submit', handleLogin);
    $('#registerForm').on('submit', handleRegister);
});

/* ---------------- UI TOGGLES ---------------- */
function showRegister() {
    $('#loginSection').addClass('hidden');
    $('#registerSection').removeClass('hidden');
    $('#pageTitle').text('Driver Registration | EMIWIP');
}

function showLogin() {
    $('#registerSection').addClass('hidden');
    $('#loginSection').removeClass('hidden');
    $('#pageTitle').text('Fleet Login | EMIWIP');
}

/* ---------------- LOGIN ---------------- */
async function handleLogin(e) {
    e.preventDefault();

    const email = $('#loginEmail').val().trim().toLowerCase();
    const password = $('#loginPassword').val();
    const btn = $('#loginBtn');

    if (!email || !password) {
        return showStatus('Email and password are required.', 'error');
    }

    setLoading(btn, true, 'AUTHENTICATING...');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        let data;
try {
    data = await res.json();
} catch {
    data = {};
}

if (!res.ok) {
    console.error('REGISTER 400 RESPONSE:', data);
    throw new Error(
        data.error ||
        `Registration failed (HTTP ${res.status}). Check server logs.`
    );
}


        if (!data.token) {
            throw new Error('Authentication token not received.');
        }

        localStorage.setItem('driverToken', data.token);
        showStatus('Login successful. Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = DASHBOARD_URL;
        }, 1200);

    } catch (err) {
        showStatus(err.message, 'error');
    } finally {
        setLoading(btn, false);
    }
}

/* ---------------- REGISTER ---------------- */
async function handleRegister(e) {
    e.preventDefault();

    const btn = $('#registerBtn');

    const payload = {
        username: $('#registerUsername').val().trim().toLowerCase(),
        email: $('#registerEmail').val().trim().toLowerCase(),
        password: $('#registerPassword').val()
    };

    if (!payload.username || !payload.email || !payload.password) {
        return showStatus('All fields are required.', 'error');
    }

    if (payload.password.length < 6) {
        return showStatus('Password must be at least 6 characters.', 'error');
    }

    setLoading(btn, true, 'REGISTERING...');

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await safeJson(res);

        if (!res.ok) {
            throw new Error(
                data.error || 'Registration failed. Email or username may already exist.'
            );
        }

        showStatus(
            'Registration successful. Awaiting admin approval.',
            'success'
        );

        setTimeout(showLogin, 2500);

    } catch (err) {
        showStatus(err.message, 'error');
    } finally {
        setLoading(btn, false);
    }
}

/* ---------------- HELPERS ---------------- */
function setLoading(btn, state, text) {
    const defaultText =
        btn.attr('id') === 'loginBtn'
            ? 'Sign In to Fleet'
            : 'Register Account';

    btn.prop('disabled', state)
       .text(state ? text : defaultText);
}

function showStatus(message, type) {
    const msg = $('#statusMessage');

    msg.stop(true, true)
       .removeClass('hidden bg-red-500 bg-green-500')
       .addClass(type === 'error' ? 'bg-red-500' : 'bg-green-500')
       .text(message)
       .fadeIn(200);

    setTimeout(() => msg.fadeOut(400), 4000);
}

/* ---------------- SAFE JSON PARSER ---------------- */
async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

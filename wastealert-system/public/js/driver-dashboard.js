// public/js/driver-dashboard.js (COMPLETE DRIVER DASHBOARD LOGIC)

// =================================================================
// 1. CONSTANTS AND STATE
// =================================================================

const API_AUTH_URL = 'http://localhost:5000/api/drivers/auth';
const API_REPORTS_URL = 'http://localhost:5000/api/reports'; // <-- CRITICAL: Reports API Base URL
const DASHBOARD_URL = 'driver-dashboard.html';

let driverData = null; 
let assignedReports = []; 

// =================================================================
// 2. INITIALIZATION & AUTHENTICATION
// =================================================================

$(document).ready(function() {
    checkAuthAndInit();

    // Event Listeners
    $('#truckProfileForm').on('submit', handleTruckSubmission);
    $('#logoutBtn').on('click', handleLogout);
    
    // Status Update Listeners (Assuming you have these buttons on report cards)
    $(document).on('click', '.update-status-btn', handleReportStatusUpdate);
});

function checkAuthAndInit() {
    if (!getToken()) {
        window.location.href = 'driver-auth.html';
        return;
    }
    fetchDriverProfile();
    // fetchAssignedReports is called after the profile is fetched 
    // to ensure the truck ID is known, but we call it independently now.
}

function getToken() {
    return localStorage.getItem('driverToken');
}

function handleLogout() {
    localStorage.removeItem('driverToken');
    window.location.href = 'driver-auth.html';
}

// =================================================================
// 3. DATA FETCHING
// =================================================================

async function fetchDriverProfile() {
    showStatusMessage('Loading profile...', 'info');
    try {
        const response = await fetch(API_AUTH_URL + '/profile', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json' 
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            driverData = data.data;
            renderProfile();
            // Only fetch reports if we successfully fetched the profile
            fetchAssignedReports(); 
            showStatusMessage('Profile loaded successfully.', 'success');
        } else {
            // Handle truck not found gracefully (it's now allowed)
            driverData = { user: data.data.user, truck: null };
            renderProfile();
            showStatusMessage(data.error || 'Failed to load profile.', 'error');
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        showStatusMessage('❌ Network error fetching profile. Check server connection.', 'error');
    } finally {
        hideStatusMessage(3000);
    }
}

async function fetchAssignedReports() {
    showStatusMessage('Fetching assigned reports...', 'info');
    try {
        // FIX: Ensure API_REPORTS_URL is used correctly with the /driver suffix.
        const response = await fetch(API_REPORTS_URL + '/driver', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json' 
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            assignedReports = data.data;
            renderReports(); 
            showStatusMessage(`Successfully loaded ${assignedReports.length} reports.`, 'success');
        } else {
            console.error("Server Error Fetching Reports:", data.error);
            showStatusMessage(data.error || 'Failed to load assigned reports.', 'error');
        }
    } catch (err) {
        console.error("Reports Fetch Network Error:", err);
        showStatusMessage('❌ Network error fetching reports. Check server connection and API path.', 'error');
    } finally {
        hideStatusMessage(3000);
    }
}

// =================================================================
// 4. RENDERING
// =================================================================

function renderProfile() {
    if (!driverData) return;
    
    const { user, truck } = driverData; 
    
    $('#driverNameDisplay').text(user.username);
    $('#driverEmailDisplay').text(user.email);
    
    // Default: Not Submitted
    let statusText = 'Not Submitted';
    let statusClass = 'bg-gray-200 text-gray-700'; 
    let containerClass = 'bg-gray-100';
    let formMessage = '<p class="text-blue-700">Please submit your truck details below for admin review.</p>';
    
    // Handle Truck Data if it exists
    if (truck) {
        // Populate the form with current truck details
        $('#licensePlate').val(truck.license_plate);
        $('#capacityTons').val(truck.capacity_tons);
        $('#submitBtn').text('Update Details');

        // Determine status text/class
        if (truck.is_approved === true) {
            statusText = 'Approved (Active Fleet)';
            statusClass = 'badge-approved';
            containerClass = 'bg-green-100';
            formMessage = '<p class="text-green-700">✅ Profile Approved. You are assigned reports based on availability.</p>';
            // Hide the submission form once approved and reports are being fetched
            // $('#truckProfileForm').hide(); // OPTIONAL: Could hide the form if approval is final
        } else if (truck.is_approved === false) {
            statusText = 'Pending Review';
            statusClass = 'badge-pending';
            containerClass = 'bg-amber-100';
            formMessage = '<p class="text-amber-700">⏳ Profile submitted. Awaiting admin approval. You may still update your details.</p>';
        } else { // Implicitly rejected or placeholder for a future rejected field
            statusText = 'Rejected (Review Required)';
            statusClass = 'badge-rejected';
            containerClass = 'bg-red-100';
            formMessage = '<p class="text-red-700">❌ Profile Rejected. Please review details and resubmit.</p>';
        }
    } else {
        // Truck is null
        $('#licensePlate').val('');
        $('#capacityTons').val('');
        $('#submitBtn').text('Submit for Review');
        $('#truckProfileForm').show();
    }

    // Apply status display
    $('#approvalStatus')
        .text(statusText)
        .removeClass('badge-approved badge-pending badge-rejected bg-gray-200 text-gray-700') // Clear previous status
        .addClass(statusClass);

    $('#truckStatusContainer').removeClass().addClass(`text-sm font-medium mt-2 sm:mt-0 p-3 rounded-lg flex items-center space-x-2 ${containerClass}`);
    $('#formStatusMessage').html(formMessage);
}

function renderReports() {
    const container = $('#reportsList');
    container.empty();
    
    if (assignedReports.length === 0) {
        container.append('<p class="text-gray-500 text-center py-4">No reports are currently assigned to your truck.</p>');
        return;
    }

    assignedReports.forEach(report => {
        const statusClass = getStatusClass(report.status);
        const reportCard = `
            <div class="dashboard-card bg-white p-5 rounded-xl shadow-sm mb-4 border-l-4 ${statusClass.border} flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">Report ID: ${report._id.substring(0, 8)}...</h3>
                    <p class="text-sm text-gray-600">Location: ${report.location.name || 'Unavailable'}</p>
                    <p class="text-xs text-gray-500">Reported: ${new Date(report.date_reported).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <span class="${statusClass.bg} ${statusClass.text} px-3 py-1 text-xs font-semibold rounded-full">${report.status}</span>
                    <button data-id="${report._id}" data-current-status="${report.status}" class="update-status-btn bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium py-1 px-3 rounded mt-2 ml-3">
                        ${report.status === 'Assigned' ? 'Mark as En-route' : report.status === 'In Progress' ? 'Mark as Cleared' : 'Update Status'}
                    </button>
                </div>
            </div>
        `;
        container.append(reportCard);
    });
}

// =================================================================
// 5. TRUCK SUBMISSION & REPORT UPDATE
// =================================================================

async function handleTruckSubmission(e) {
    e.preventDefault();

    const license_plate = $('#licensePlate').val().trim();
    const capacity_tons = parseFloat($('#capacityTons').val());
    
    if (isNaN(capacity_tons) || capacity_tons <= 0) {
        showStatusMessage('Capacity must be a positive number.', 'error');
        return;
    }

    showStatusMessage('Submitting truck details...', 'info');

    try {
        const response = await fetch(API_AUTH_URL + '/profile', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ license_plate, capacity_tons })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatusMessage(data.message || 'Details updated successfully.', 'success');
            // Re-fetch profile to update status card
            fetchDriverProfile(); 
        } else {
            showStatusMessage(data.error || 'Failed to submit truck details.', 'error');
        }
    } catch (err) {
        console.error("Submission Error:", err);
        showStatusMessage('❌ Network error during submission.', 'error');
    } finally {
        hideStatusMessage(4000);
    }
}

async function handleReportStatusUpdate(e) {
    const reportId = $(e.currentTarget).data('id');
    const currentStatus = $(e.currentTarget).data('current-status');
    let newStatus = '';
    
    if (currentStatus === 'Assigned') {
        newStatus = 'In Progress';
    } else if (currentStatus === 'In Progress') {
        newStatus = 'Cleared';
    } else {
        showStatusMessage('Status cannot be updated from this state.', 'info');
        return;
    }

    if (!confirm(`Are you sure you want to change report ${reportId.substring(0, 8)}... status to "${newStatus}"?`)) return;

    showStatusMessage(`Updating report ${reportId.substring(0, 8)}... to ${newStatus}...`, 'info');

    try {
        const response = await fetch(`${API_REPORTS_URL}/status/${reportId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatusMessage(`Report status updated to ${newStatus}.`, 'success');
            // Refresh reports list
            fetchAssignedReports(); 
        } else {
            showStatusMessage(data.error || 'Failed to update report status.', 'error');
        }
    } catch (err) {
        console.error("Status Update Error:", err);
        showStatusMessage('❌ Network error updating status.', 'error');
    } finally {
        hideStatusMessage(3000);
    }
}


// =================================================================
// 6. UTILITIES
// =================================================================

function getStatusClass(status) {
    switch (status) {
        case 'New':
            return { border: 'border-l-indigo-600', bg: 'bg-indigo-100', text: 'text-indigo-700' };
        case 'Assigned':
            return { border: 'border-l-blue-600', bg: 'bg-blue-100', text: 'text-blue-700' };
        case 'In Progress':
            return { border: 'border-l-amber-600', bg: 'bg-amber-100', text: 'text-amber-700' };
        case 'Cleared':
            return { border: 'border-l-green-600', bg: 'bg-green-100', text: 'text-green-700' };
        default:
            return { border: 'border-l-gray-300', bg: 'bg-gray-100', text: 'text-gray-700' };
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
}

function hideStatusMessage(delay = 0) {
    if (delay > 0) {
        setTimeout(() => $('#statusMessage').hide(), delay);
    } else {
        $('#statusMessage').hide();
    }
}
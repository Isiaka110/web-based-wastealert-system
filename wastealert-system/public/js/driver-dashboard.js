// public/js/driver-dashboard.js (EMIWIP FLEET OPERATOR DASHBOARD LOGIC - CRITICALLY CORRECTED)

// =================================================================
// 1. CONSTANTS AND STATE
// =================================================================

const API_AUTH_URL = 'http://localhost:5000/api/drivers/auth';
const API_ASSIGNED_REPORTS_URL = 'http://localhost:5000/api/reports/driver/assigned';
const API_CLEARANCE_URL = 'http://localhost:5000/api/reports/driver/clear'; 
const DRIVER_LOGIN_URL = 'driver-auth.html';

let driverData = null; 
let assignedReports = []; 
let currentReportToClear = null; 


// =================================================================
// 2. INITIALIZATION & AUTHENTICATION
// =================================================================

$(document).ready(function() {
    // Event Listeners
    $('#logoutBtn').on('click', handleLogout);
    $('#refreshReportsBtn').on('click', fetchAssignedReports);
    $('#closeClearanceModalBtn').on('click', closeClearanceModal);
    $('#clearanceForm').on('submit', handleClearanceSubmission);
    
    checkAuthAndInit();
});

function getToken() {
    return localStorage.getItem('driverToken');
}

function getAuthHeaders(contentType = 'application/json') {
    const token = getToken();
    const headers = {};
    
    // NOTE: Do not set Content-Type for FormData (file upload) submissions
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

function checkAuthAndInit() {
    const token = getToken();

    if (!token) {
        window.location.href = DRIVER_LOGIN_URL;
        return;
    }
    
    fetchDriverProfile();
}

function handleLogout() {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverUserData');
    window.location.href = DRIVER_LOGIN_URL;
}

// =================================================================
// 3. PROFILE & TRUCK FETCHING/RENDERING
// =================================================================

async function fetchDriverProfile() {
    showStatusMessage('Loading Fleet Operator profile...', 'info');
    try {
        const response = await fetch(API_AUTH_URL + '/profile', {
            method: 'GET',
            headers: getAuthHeaders(null),
        });
        
        if (response.status === 401 || response.status === 403) {
            handleLogout();
            return;
        }

        const result = await response.json();
        
        if (response.ok) {
            driverData = result.data;
            renderProfile(driverData.user, driverData.truck);
            fetchAssignedReports(); 
            
        } else {
            showStatusMessage(result.error || 'Failed to load profile.', 'error');
            renderReports([]); // Clear reports on profile load failure
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        showStatusMessage('❌ Network error fetching profile.', 'error');
    } 
}

function renderProfile(user, truck) {
    $('#driverName').text(user.username);
    $('#driverEmail').text(user.email);
    
    const $statusContainer = $('#truckStatusContainer');
    const $statusBadge = $('#truckStatusBadge');
    
    let plate = 'N/A';
    let capacity = 'N/A';
    let assignedStatus = 'No';
    
    $statusContainer.removeClass().addClass('p-4 rounded-lg mb-4 border-l-4');
    $statusBadge.removeClass();

    if (truck) {
        plate = truck.license_plate;
        capacity = truck.capacity_tons;
        assignedStatus = truck.is_assigned ? 'Yes' : 'No';

        if (truck.is_approved === true) {
            $statusBadge.addClass('badge-approved').text('APPROVED / ACTIVE');
            $statusContainer.addClass('border-l-green-600 bg-green-50');
            $('#truckFormMessage').html('<p class="text-green-700">✅ Profile Approved. You are active for task assignment.</p>');
        } else if (truck.is_approved === false) {
            $statusBadge.addClass('badge-pending').text('PENDING REVIEW');
            $statusContainer.addClass('border-l-amber-600 bg-amber-50');
            $('#truckFormMessage').html('<p class="text-yellow-700">⏳ Profile Pending Review. You cannot be assigned reports yet.</p>');
        } else {
            $statusBadge.addClass('badge-rejected').text('REJECTED');
            $statusContainer.addClass('border-l-red-600 bg-red-50');
            $('#truckFormMessage').html('<p class="text-red-700">❌ Profile Rejected. Please contact the Portal Manager for details.</p>');
        }
    } else {
        $statusBadge.addClass('bg-gray-200 text-gray-700').text('INCOMPLETE');
        $statusContainer.addClass('border-l-gray-400 bg-gray-50');
        $('#truckFormMessage').html('<p class="text-red-700">⚠️ Fleet Unit data is missing or incomplete. Contact support.</p>');
    }

    $('#unitPlate').text(plate);
    $('#unitCapacity').text(capacity);
    $('#isAssignedStatus').text(assignedStatus);
}

// =================================================================
// 4. REPORTS FETCHING AND RENDERING
// =================================================================

async function fetchAssignedReports() {
    $('#loadingMessage').removeClass('hidden');
    $('#noReportsMessage').addClass('hidden');
    $('#assignedReportsList').find('.report-card').remove(); 
    
    // Prevent fetch if truck is not approved
    if (!driverData || !driverData.truck || driverData.truck.is_approved !== true) {
        $('#loadingMessage').addClass('hidden');
        $('#noReportsMessage').text('Your Fleet Unit must be approved by the Portal Manager before reports can be assigned and fetched.');
        $('#noReportsMessage').removeClass('hidden');
        $('#taskCount').text('0');
        return;
    }

    try {
        const response = await fetch(API_ASSIGNED_REPORTS_URL, {
            headers: getAuthHeaders(null)
        });
        
        if (response.status === 401 || response.status === 403) {
            handleLogout(); 
            return;
        }

        const result = await response.json();
        
        if (response.ok) {
            assignedReports = result.data.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));
            renderReports(assignedReports);
        } else {
             throw new Error(result.error || 'Failed to fetch assigned reports.');
        }
        
    } catch (err) {
        console.error('Fetch Assigned Reports Error:', err);
        showStatusMessage(`Fetch Reports Error: ${err.message}`, 'error');
        $('#noReportsMessage').text('Error fetching reports. Check server connection.');
        $('#noReportsMessage').removeClass('hidden');
    } finally {
        $('#loadingMessage').addClass('hidden');
    }
}

function renderReports(reports) {
    const $container = $('#assignedReportsList');
    $container.empty();
    
    const activeReports = reports.filter(r => r.status === 'Assigned' || r.status === 'In Progress');
    const clearedReports = reports.filter(r => r.status === 'Cleared');
    
    $('#taskCount').text(activeReports.length);
    $('#clearanceCount').text(clearedReports.length);
    
    if (reports.length === 0) {
        $('#noReportsMessage').removeClass('hidden').text('You have no active or completed waste reports in your history.');
        return;
    }
    
    reports.forEach(report => {
        $container.append(createReportCardHTML(report));
    });

    $('.complete-task-btn').off('click').on('click', function() {
        const reportId = $(this).data('id');
        currentReportToClear = assignedReports.find(r => r._id === reportId);
        openClearanceModal();
    });
}

function createReportCardHTML(report) {
    const { border, bg, text } = getStatusClass(report.status);
    
    const driverStatus = report.status === 'Assigned' ? 'NEW ASSIGNMENT' : report.status.toUpperCase();
    const canClear = report.status === 'Assigned' || report.status === 'In Progress';

    return `
        <div class="report-card p-4 rounded-lg shadow-md ${bg} ${border} border-l-4">
            <div class="flex items-start justify-between">
                <p class="text-xs font-semibold uppercase ${text} mb-2">${driverStatus}</p>
                ${canClear ? `
                    <button class="complete-task-btn bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg transition" data-id="${report._id}">
                        Mark as Cleared
                    </button>
                ` : `
                    <span class="text-xs text-gray-500 font-semibold">CLEARED ${formatDate(report.proof_of_clearance?.date_cleared)}</span>
                `}
            </div>
            
            <p class="text-sm font-mono text-gray-500 truncate">Record ID: ${report._id.substring(0, 8)}...</p>

            <div class="space-y-1 mt-2 text-sm text-gray-700">
                <p><i class="fas fa-map-marker-alt text-red-500 w-4 mr-2"></i> Location: <span class="font-semibold">${report.location.location_name}</span></p>
                <p><i class="fas fa-route text-blue-500 w-4 mr-2"></i> Area: ${report.location.lga_city}, ${report.location.state_area}</p>
                <p><i class="fas fa-clock text-gray-500 w-4 mr-2"></i> Assigned: ${formatDate(report.date_assigned)}</p>
                <p class="mt-2 text-xs text-gray-500">Details: ${report.description.substring(0, 100)}...</p>
            </div>
        </div>
    `;
}

// =================================================================
// 5. CLEARANCE MODAL LOGIC
// =================================================================

function openClearanceModal() {
    if (!currentReportToClear) return;

    $('#clearanceReportId').text(currentReportToClear._id.substring(0, 8) + '...');
    $('#clearanceLocation').text(currentReportToClear.location.location_name);
    
    $('#clearance-image').val('');
    $('#clearance-notes').val('');
    $('#clearanceMessage').addClass('hidden').empty();

    $('#clearanceModal').removeClass('hidden');
}

function closeClearanceModal() {
    $('#clearanceModal').addClass('hidden');
    currentReportToClear = null;
}

async function handleClearanceSubmission(e) {
    e.preventDefault();
    if (!currentReportToClear) return;
    
    const $form = $(this);
    const $submitBtn = $('#submitClearanceBtn');
    
    // File validation check
    if ($('#clearance-image')[0].files.length === 0) {
        showStatusMessage('Please upload a Proof of Clearance Image.', 'error');
        return;
    }
    
    setButtonLoading($submitBtn, true, 'Uploading Proof...');

    // Use FormData for file upload
    const formData = new FormData($form[0]);
    formData.append('reportId', currentReportToClear._id);

    try {
        const response = await fetch(API_CLEARANCE_URL, {
            method: 'POST',
            // CRITICAL: Do NOT set Content-Type for file uploads with FormData
            headers: { 'Authorization': `Bearer ${getToken()}` }, 
            body: formData,
        });

        if (response.status === 401 || response.status === 403) {
            handleLogout();
            return;
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Clearance submission failed due to an unknown error.');
        }

        showStatusMessage('Task successfully marked as CLEARED! Fleet Unit is now marked Available.', 'success');
        closeClearanceModal();
        await fetchDriverProfile(); // Re-fetch profile and reports to refresh the status/list
        
    } catch (err) {
        console.error('Clearance Error:', err);
        showStatusMessage(`Submission Error: ${err.message}`, 'error');
    } finally {
        setButtonLoading($submitBtn, false, 'Submit Clearance Proof');
    }
}


// =================================================================
// 6. UTILITIES
// =================================================================

function getStatusClass(status) {
    switch (status) {
        case 'New':
            return { border: 'border-l-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' };
        case 'Assigned':
            return { border: 'border-l-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' };
        case 'In Progress':
        case 'In-Progress': 
            return { border: 'border-l-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' };
        case 'Cleared':
            return { border: 'border-l-green-600', bg: 'bg-green-50', text: 'text-green-700' };
        default:
            return { border: 'border-l-gray-300', bg: 'bg-gray-100', text: 'text-gray-700' };
    }
}

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
    setTimeout(() => {
        $('#statusMessage').fadeOut('slow');
    }, 5000);
}

function formatDate(dateString, includeTime = false) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }
    return date.toLocaleDateString('en-US', options);
}
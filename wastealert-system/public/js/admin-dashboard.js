// public/js/admin-dashboard.js (EMIWIP PORTAL MANAGER DASHBOARD LOGIC - CRITICALLY UPDATED)

// =================================================================
// 1. CONSTANTS AND STATE (Updated for EMIWIP Terminology)
// =================================================================

const API_REPORTS_URL = 'http://localhost:5000/api/reports'; 
const API_TRUCKS_URL = 'http://localhost:5000/api/trucks'; 
// API URL remains 'trucks' to match backend routes, but logically refers to Fleet
const API_AVAILABLE_TRUCKS_URL = `${API_REPORTS_URL}/availabletrucks`; 
const ADMIN_LOGIN_URL = 'admin-login.html'; // Portal Manager Login

let reportsData = []; 
let availableFleetUnits = []; // Fleet Units available for assignment dropdown
let allFleetUnits = []; // All Fleet Units for the Fleet Management Modal
let currentReportIdToAssign = null; 
let detailMap = null; // Leaflet map instance for the Detail Modal

// =================================================================
// 2. INITIALIZATION & AUTHENTICATION
// =================================================================

$(document).ready(function() {
    checkAuthAndInit();
});

function getToken() {
    return localStorage.getItem('adminToken');
}

/**
 * Generates the headers object with Authorization token.
 * Prevents sending a malformed 'Bearer ' header if the token is null/empty.
 */
function getAuthHeaders(contentType = 'application/json') {
    const token = getToken();
    const headers = {};
    
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

/**
 * Global function to check for authentication errors (401/403/400 token issues) and redirect.
 * This is the critical fix for the '400 Bad Request' initialization error.
 */
function handleAuthError(response) {
    // Check for common unauthorized/forbidden statuses
    if (response.status === 401 || response.status === 403 || response.status === 400) {
        if (response.status === 400) {
             // 400 is often thrown by the server's 'protect' middleware when a malformed token is sent
             console.error('Authentication check failed (400 Bad Request), forcing logout.');
        }
        showStatusMessage('Session expired or unauthorized. Please log in again.', 'error');
        handleLogout();
        return true; 
    }
    return false;
}

function checkAuthAndInit() {
    if (!getToken()) {
        window.location.href = ADMIN_LOGIN_URL;
        return;
    }
    
    // --- RESPONSIVE BUTTON BINDINGS ---
    $('#logoutBtnDesktop, #logoutBtnMobile').on('click', handleLogout);
    // Button names remain the same for simplicity in HTML
    $('#manageTrucksBtnDesktop, #manageTrucksBtnMobile').on('click', openTruckModal); 

    // Filter
    $('#statusFilter').on('change', filterAndRenderReports);
    
    // --- MODAL BUTTON BINDINGS ---
    // Assignment Modal
    $('#assignmentForm').on('submit', handleTruckAssignment); 
    $('#closeAssignmentModalBtn').on('click', closeAssignmentModal);
    $('#unassignTruckBtn').on('click', handleUnassignment);
    
    // Detail Modal
    $('#openAssignmentModalBtn').on('click', function() {
        // Retrieve the full report object from the data array
        const report = reportsData.find(r => r._id === currentReportIdToAssign);
        // Only open assignment if the status is not 'Cleared'
        if (report && report.status !== 'Cleared') {
            closeDetailModal();
            openAssignmentModal(currentReportIdToAssign);
        } else if (report && report.status === 'Cleared') {
            showStatusMessage('Cleared records cannot be reassigned.', 'info');
        }
    });
    $('#closeDetailModalBtn').on('click', closeDetailModal); 
    $('#deleteReportBtn').on('click', handleDeleteReport);
    
    // Truck Management Modal
    $('#closeTruckModalBtn').on('click', closeTruckModal);
    
    // Initial data fetch
    fetchAllData();
}

// =================================================================
// 3. DATA FETCHING (Updated with handleAuthError checks)
// =================================================================

async function fetchAllData() {
    // Fetch order is important: Reports, then available units, then all units
    await fetchReports();
    await fetchAvailableFleetUnits(); 
    await fetchAllFleetUnits(); 
}

async function fetchReports() {
    $('#loadingMessage').removeClass('hidden');
    $('#reportsContainer').empty().append($('#loadingMessage'));

    try {
        const response = await fetch(API_REPORTS_URL, {
            headers: getAuthHeaders()
        });
        
        if (handleAuthError(response)) return; // CRITICAL: Check for auth error
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} (${response.statusText}) - ${errorText}`);
        }
        
        const result = await response.json();
        reportsData = result.data.sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));
        filterAndRenderReports(); 
    } catch (err) {
        console.error('Fetch Incident Records Error:', err);
        showStatusMessage(`Fetch Incident Records Error: ${err.message}`, 'error');
    } finally {
        $('#loadingMessage').addClass('hidden');
    }
}

async function fetchAvailableFleetUnits() {
    try {
        const response = await fetch(API_AVAILABLE_TRUCKS_URL, {
            headers: getAuthHeaders()
        });
        
        if (handleAuthError(response)) return; // CRITICAL: Check for auth error
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} (${response.statusText})`);
        }
        
        const result = await response.json();
        availableFleetUnits = result.data; 
    } catch (err) {
        console.error('Fetch Available Fleet Units Error:', err);
        showStatusMessage(`Fetch Available Fleet Units Error: ${err.message}`, 'error');
    }
}

async function fetchAllFleetUnits() {
    try {
        const response = await fetch(API_TRUCKS_URL, {
            headers: getAuthHeaders()
        });
        
        if (handleAuthError(response)) return; // CRITICAL: Check for auth error
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} (${response.statusText})`);
        }
        
        const result = await response.json();
        allFleetUnits = result.data; 
    } catch (err) {
        console.error('Fetch All Fleet Units Error:', err);
    }
}

// =================================================================
// 4. REPORT RENDERING & FILTERING
// =================================================================

function filterAndRenderReports() {
    const selectedStatus = $('#statusFilter').val();
    
    const filteredReports = reportsData.filter(report => {
        if (selectedStatus === 'All') return true;
        return report.status === selectedStatus;
    });

    updateSummaryCounts();
    renderReports(filteredReports);
}

function updateSummaryCounts() {
    const counts = {
        'Pending': 0,
        'Assigned': 0,
        'In Progress': 0,
        'Cleared': 0
    };

    reportsData.forEach(report => {
        if (counts.hasOwnProperty(report.status)) {
            counts[report.status]++;
        }
    });

    $('#stat-pending').text(counts.Pending);
    $('#stat-assigned').text(counts.Assigned);
    $('#stat-in-progress').text(counts['In Progress']);
    $('#stat-cleared').text(counts.Cleared);
}

function renderReports(reports) {
    const $container = $('#reportsContainer');
    $container.empty();

    if (reports.length === 0) {
        $('#noReportsMessage').removeClass('hidden');
        return;
    } else {
        $('#noReportsMessage').addClass('hidden');
    }

    reports.forEach(report => {
        $container.append(createReportCardHTML(report));
    });

    // Attach event listeners to the dynamically created buttons
    $('.view-details-btn').off('click').on('click', function() {
        const reportId = $(this).data('id');
        const report = reportsData.find(r => r._id === reportId);
        if (report) {
            openDetailModal(report);
        }
    });
}

// =================================================================
// 5. MODAL RENDERING FUNCTIONS
// =================================================================

function openDetailModal(report) {
    currentReportIdToAssign = report._id;

    // A. Fill Report Details
    $('#detailReportId').text(report._id);
    $('#detailDescription').text(report.description);
    $('#detailDateReported').text(formatDate(report.date_reported, true));
    $('#detailLocationName').text(report.location ? report.location.location_name : 'N/A');
    $('#detailStateLGA').text(report.location ? `${report.location.lga_city || 'N/A'}, ${report.location.state_area || 'N/A'}` : 'N/A');
    $('#detailReporterPhone').text(report.reporter_phone);
    
    // B. Status and Assignment Button Logic
    const { text, bg, border } = getStatusClass(report.status);
    
    // Update status pill
    $('#detailStatus').text(report.status)
                      .removeClass()
                      .addClass(`inline-block px-3 py-1 rounded-full text-xs font-semibold ${text} ${bg} border-l-4 ${border}`);

    // Update assignment info and button state (CRITICAL: Fleet Unit/Operator)
    if (report.assigned_to) {
        $('#detailAssignedTruck').html(`
            <span class="font-bold">${report.assigned_to.license_plate}</span>
            <span class="text-xs text-gray-500 block">${report.assigned_to.driver_name}</span>
        `);
        // Only allow re-assignment if not cleared
        if (report.status !== 'Cleared') {
            $('#openAssignmentModalBtn').text('Re-Assign Fleet Unit').removeClass('bg-indigo-600').addClass('bg-purple-600').prop('disabled', false).show();
        } else {
            $('#openAssignmentModalBtn').hide();
        }
    } else {
        $('#detailAssignedTruck').html('N/A (Unassigned)');
        $('#openAssignmentModalBtn').text('Assign Fleet Unit').removeClass('bg-purple-600').addClass('bg-indigo-600').prop('disabled', false).show();
    }
    
    // Hide assignment button if Cleared
    if (report.status === 'Cleared') {
        $('#openAssignmentModalBtn').hide();
    }

    // C. Image/Proof Logic
    $('#detailOriginalImage').attr('src', report.image_url);
    $('#detailOriginalImageLink').attr('href', report.image_url);

    if (report.proof_of_clearance && report.proof_of_clearance.image_url) {
        $('#proofContainer').removeClass('hidden');
        $('#detailProofImage').attr('src', report.proof_of_clearance.image_url);
        $('#detailProofImageLink').attr('href', report.proof_of_clearance.image_url);
        $('#detailProofNotes').text(report.proof_of_clearance.notes || 'No notes provided.');
        $('#detailProofDate').text(formatDate(report.proof_of_clearance.date_cleared, true));
    } else {
        $('#proofContainer').addClass('hidden');
        $('#detailProofNotes').text('');
    }

    // D. Map Rendering (CRITICAL FIX APPLIED HERE)
    let locationCoords = null;
    const coordsString = report.location_coordinates;
    
    if (coordsString && typeof coordsString === 'string') {
        try {
            // This is the line that was crashing when coordsString was "undefined"
            locationCoords = JSON.parse(coordsString);
        } catch (e) {
            console.warn('Error parsing location coordinates JSON (This is the fix):', e);
            // locationCoords remains null, preventing the map from initializing
        }
    }

    // Initialize map only if we have valid coordinates
    if (locationCoords && locationCoords.lat && locationCoords.lng) {
        initializeMap('detailMap', locationCoords);
        $('#detailMapContainer').removeClass('hidden');
    } else {
        // Hide the map container if coordinates are invalid or missing
        $('#detailMapContainer').addClass('hidden');
    }

    // E. Show Modal
    $('#detailModal').removeClass('hidden');
}

function initializeMap(mapElementId, locationCoords) {
    // If map already exists, destroy it before creating a new one
    if (detailMap) {
        detailMap.remove();
    }
    
    // Create new map instance
    detailMap = L.map(mapElementId).setView([locationCoords.lat, locationCoords.lng], 15);

    // Add base tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(detailMap);

    // Add marker
    L.marker([locationCoords.lat, locationCoords.lng]).addTo(detailMap)
        .bindPopup('Incident Location')
        .openPopup();
}

function closeDetailModal() {
    $('#detailModal').addClass('hidden');
    // Important: destroy the map instance to prevent rendering issues if another one is created
    if (detailMap) {
        detailMap.remove();
        detailMap = null;
    }
}

function openAssignmentModal(reportId) {
    currentReportIdToAssign = reportId;
    $('#reportIdSnippet').text(reportId.substring(0, 8) + '...');
    
    // Render available fleet units into the dropdown
    const $truckSelect = $('#truckSelect');
    $truckSelect.empty();
    $truckSelect.append('<option value="">-- Select Fleet Unit --</option>');
    
    availableFleetUnits.forEach(unit => { 
        $truckSelect.append(
            `<option value="${unit._id}">${unit.license_plate} (${unit.driver_name})</option>`
        );
    });

    // Check current assignment status
    const currentReport = reportsData.find(r => r._id === reportId);
    if (currentReport && currentReport.assigned_to) {
        // Pre-select the currently assigned unit
        $truckSelect.val(currentReport.assigned_to._id);
        $('#unassignTruckBtn').removeClass('hidden');
        $('#assignTruckSubmitBtn').text('Update Assignment');
    } else {
        $truckSelect.val(''); // Ensure nothing is selected
        $('#unassignTruckBtn').addClass('hidden');
        $('#assignTruckSubmitBtn').text('Assign Unit');
    }

    // Reset messages and show modal
    $('#assignmentMessage').addClass('hidden').empty();
    $('#assignmentModal').removeClass('hidden');
}

function closeAssignmentModal() {
    $('#assignmentModal').addClass('hidden');
    $('#assignTruckSubmitBtn').prop('disabled', false); // Ensure button is re-enabled
}

function openTruckModal() {
    // Ensure we fetch the latest data just before opening the modal
    fetchAllFleetUnits().then(() => {
        renderAllTrucksToModal();
        $('#truckModal').removeClass('hidden');
    });
}

function closeTruckModal() {
    $('#truckModal').addClass('hidden');
}

/**
 * Renders the tables for All Fleet Units and Pending Operator Approvals.
 */
function renderAllTrucksToModal() {
    const $allBody = $('#allTrucksTableBody');
    const $pendingBody = $('#pendingDriversTableBody'); // Using 'Drivers' ID from HTML for consistency
    $allBody.empty();
    $pendingBody.empty();

    const pendingUnits = allFleetUnits.filter(unit => unit.is_approved === false); 
    const approvedUnits = allFleetUnits.filter(unit => unit.is_approved === true);
    
    // --- Approved Units Table ---
    if (approvedUnits.length === 0) {
        $('#noAllTrucksMessage').removeClass('hidden');
    } else {
        $('#noAllTrucksMessage').addClass('hidden');
        approvedUnits.forEach(unit => {
            const statusClass = unit.is_assigned ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
            const driverInfo = unit.driver_id ? `${unit.driver_id.username} (${unit.driver_id.email})` : 'N/A';
            $allBody.append(`
                <tr id="unit-row-${unit._id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${unit.license_plate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${driverInfo}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${unit.capacity_m3} m³</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${unit.is_assigned ? 'Busy (Assigned)' : 'Available'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">Yes</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="handleDeleteTruck('${unit._id}')" class="text-red-600 hover:text-red-900 ml-2">Delete</button>
                    </td>
                </tr>
            `);
        });
    }

    // --- Pending Approvals Table ---
    if (pendingUnits.length === 0) {
        $('#noPendingDriversMessage').removeClass('hidden');
    } else {
        $('#noPendingDriversMessage').addClass('hidden');
        pendingUnits.forEach(unit => {
            const driverInfo = unit.driver_id ? unit.driver_id.username : 'N/A';
            $pendingBody.append(`
                <tr id="pending-unit-row-${unit._id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">${unit.driver_id || unit._id.substring(0, 8) + '...'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${unit.license_plate} (${driverInfo})</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${unit.capacity_m3} m³</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="handleTruckApproval('${unit._id}')" class="text-green-600 hover:text-green-900">Approve</button>
                        <button onclick="handleTruckRejection('${unit._id}')" class="text-red-600 hover:text-red-900 ml-2">Reject/Delete</button>
                    </td>
                </tr>
            `);
        });
    }
}

// =================================================================
// 6. ACTION HANDLERS
// =================================================================

async function handleTruckAssignment(e) {
    e.preventDefault();
    const truckId = $('#truckSelect').val();
    if (!truckId || !currentReportIdToAssign) {
        showStatusMessage('Please select a Fleet Unit to assign.', 'error');
        return;
    }
    const $submitBtn = $('#assignTruckSubmitBtn');
    $submitBtn.prop('disabled', true).text('Updating...');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${currentReportIdToAssign}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            // Set assigned_to and update status to 'Assigned'
            body: JSON.stringify({ assigned_to: truckId, status: 'Assigned' })
        });
        
        if (handleAuthError(response)) return;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        showStatusMessage(`Incident Record ${result.data._id.substring(0, 8)}... successfully assigned to Fleet Unit ${result.data.assigned_to.license_plate}.`, 'success');
        closeAssignmentModal();
        await fetchAllData(); 
    } catch (err) {
        console.error('Assignment Error:', err);
        showStatusMessage(`Assignment failed: ${err.message}`, 'error');
    } finally {
        $submitBtn.prop('disabled', false).text('Assign Unit');
    }
}

async function handleUnassignment() {
    if (!currentReportIdToAssign) return;

    if (!confirm('Are you sure you want to unassign this Fleet Unit and set the Incident Record status back to Pending?')) {
        return;
    }

    const $unassignBtn = $('#unassignTruckBtn');
    $unassignBtn.prop('disabled', true).text('Unassigning...');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${currentReportIdToAssign}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            // Clear assigned_to and set status to 'Pending'
            body: JSON.stringify({ assigned_to: null, status: 'Pending' })
        });

        if (handleAuthError(response)) return;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - ${errorText}`);
        }

        showStatusMessage(`Incident Record successfully unassigned. Status set to Pending.`, 'success');
        closeAssignmentModal();
        await fetchAllData();
    } catch (err) {
        console.error('Unassignment Error:', err);
        showStatusMessage(`Unassignment failed: ${err.message}`, 'error');
    } finally {
        $unassignBtn.prop('disabled', false).text('Unassign & Set to Pending');
    }
}

async function handleDeleteReport() {
    if (!currentReportIdToAssign) return;

    if (!confirm(`Are you sure you want to permanently delete Incident Record ${currentReportIdToAssign.substring(0, 8)}...? This action cannot be undone.`)) {
        return;
    }

    const $deleteBtn = $('#deleteReportBtn');
    $deleteBtn.prop('disabled', true).text('Deleting...');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${currentReportIdToAssign}`, {
            method: 'DELETE',
            headers: getAuthHeaders(''), // No content type for DELETE
        });

        if (handleAuthError(response)) return;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - ${errorText}`);
        }

        showStatusMessage(`Incident Record ${currentReportIdToAssign.substring(0, 8)}... successfully deleted.`, 'success');
        closeDetailModal();
        await fetchAllData();
    } catch (err) {
        console.error('Delete Report Error:', err);
        showStatusMessage(`Deletion failed: ${err.message}`, 'error');
    } finally {
        $deleteBtn.prop('disabled', false).text('Delete Record');
    }
}

async function handleTruckApproval(truckId) {
    if (!confirm('Approve this Fleet Unit? The operator will be notified and can start using the app.')) return;
    updateTruckStatus(truckId, { is_approved: true }, 'approved');
}

async function handleTruckRejection(truckId) {
    if (!confirm('Reject and delete this Fleet Unit registration? This will also delete the associated operator account.')) return;
    deleteTruck(truckId);
}

async function handleDeleteTruck(truckId) {
    if (!confirm('Are you sure you want to delete this Fleet Unit and the associated operator account?')) return;
    deleteTruck(truckId);
}

async function updateTruckStatus(truckId, data, actionType) {
    try {
        const response = await fetch(`${API_TRUCKS_URL}/${truckId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (handleAuthError(response)) return;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - ${errorText}`);
        }

        const unit = allFleetUnits.find(u => u._id === truckId);
        const operatorName = unit && unit.driver_id ? unit.driver_id.username : 'the Operator';

        if (actionType === 'approved') {
            showStatusMessage(`Fleet Unit ${unit.license_plate} approved! ${operatorName} can now log in.`, 'success');
        } else {
            showStatusMessage('Fleet Unit status updated successfully.', 'success');
        }

        // Re-fetch and re-render the modals
        await fetchAllFleetUnits();
        renderAllTrucksToModal();
    } catch (err) {
        console.error('Update Fleet Unit Error:', err);
        showStatusMessage(`Update failed: ${err.message}`, 'error');
    }
}

async function deleteTruck(truckId) {
    try {
        const response = await fetch(`${API_TRUCKS_URL}/${truckId}`, {
            method: 'DELETE',
            headers: getAuthHeaders('')
        });

        if (handleAuthError(response)) return;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error Status: ${response.status} - ${errorText}`);
        }

        showStatusMessage('Fleet Unit and associated operator account successfully deleted.', 'success');

        // Re-fetch and re-render the modals
        await fetchAllFleetUnits();
        renderAllTrucksToModal();
    } catch (err) {
        console.error('Delete Fleet Unit Error:', err);
        showStatusMessage(`Deletion failed: ${err.message}`, 'error');
    }
}


// =================================================================
// 9. UTILITIES
// =================================================================

function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = ADMIN_LOGIN_URL;
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
    hideStatusMessage(5000);
}

function hideStatusMessage(delay = 4000) {
    setTimeout(() => {
        $('#statusMessage').fadeOut('slow');
    }, delay);
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

/**
 * Gets the Tailwind CSS classes for a report status card.
 */
function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            // Yellow/Amber for New/Pending reports
            return { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
        case 'Assigned':
            // Indigo for assigned reports
            return { border: 'border-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' };
        case 'In Progress':
        case 'In-Progress': 
            // Blue for reports that are actively being cleared
            return { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' };
        case 'Cleared':
            // Green for completed reports
            return { border: 'border-green-600', bg: 'bg-green-50', text: 'text-green-700' };
        default:
            // Gray fallback
            return { border: 'border-gray-300', bg: 'bg-gray-100', text: 'text-gray-700' };
    }
}

/**
 * Generates the HTML for a single report card in the dashboard.
 * Includes the CRITICAL FIX for location data display.
 * @param {Object} report The report object from the API.
 * @returns {string} The HTML string for the report card.
 */
function createReportCardHTML(report) {
    const { border, bg, text } = getStatusClass(report.status);
    
    const formattedDate = formatDate(report.date_reported); 
    
    // CRITICAL UPDATE: Fleet Unit terminology change
    const truckInfo = report.assigned_to 
        ? report.assigned_to.license_plate
        : 'Not Assigned';

    // CRITICAL FIX: Ensure location data is accessed correctly
    const location = report.location || {}; 
    let locationDisplay;
    if (location.location_name && location.location_name !== 'undefined') {
        locationDisplay = location.location_name;
    } else if (location.lga_city && location.state_area) {
        locationDisplay = `${location.lga_city}, ${location.state_area}`;
    } else {
        locationDisplay = 'Location Unknown';
    }

    return `
        <div class="report-card p-4 rounded-lg shadow-md ${bg} ${border}" data-status="${report.status}">
            <div class="flex items-start justify-between">
                <p class="text-xs font-semibold uppercase ${text} mb-2">${report.status}</p>
                <button 
                    class="view-details-btn text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                    data-id="${report._id}"
                >
                    View Details
                </button>
            </div>
            
            <p class="text-sm font-mono text-gray-500 truncate mb-2">Record ID: ${report._id.substring(0, 8)}...</p>

            <h3 class="text-lg font-bold text-gray-900 mb-2">${report.description.substring(0, 30)}...</h3>
            
            <div class="space-y-1 text-sm text-gray-700">
                <p><i class="fas fa-map-marker-alt text-red-500 w-4 mr-2"></i> ${locationDisplay}</p>
                <p><i class="fas fa-truck text-green-600 w-4 mr-2"></i> Fleet Unit: <span class="font-semibold">${truckInfo}</span></p>
                <p><i class="fas fa-clock text-gray-500 w-4 mr-2"></i> Date: ${formattedDate}</p>
            </div>
        </div>
    `;
}
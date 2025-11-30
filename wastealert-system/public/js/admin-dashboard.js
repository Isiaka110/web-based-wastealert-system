// public/js/admin-dashboard.js (WASTEALERT ADMIN DASHBOARD LOGIC)

const API_REPORTS_URL = 'http://localhost:5000/api/reports'; 
const API_TRUCKS_URL = 'http://localhost:5000/api/trucks'; 

let reportsData = []; 
let trucksData = []; 
let currentReportIdToAssign = null; // State variable for assignment modal

// =================================================================
// PART 1: AUTHENTICATION AND INITIALIZATION
// =================================================================

function checkAuthAndInit() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // --- RESPONSIVE BUTTON BINDINGS (UPDATED) ---
    // Logout Buttons (Desktop & Mobile)
    $('#logoutBtnDesktop, #logoutBtnMobile').on('click', handleLogout);
    
    // Manage Trucks Buttons - NOW OPEN THE MODAL
    $('#manageTrucksBtnDesktop, #manageTrucksBtnMobile, #manageTrucksBtnMain').on('click', openTruckModal); // CHANGED

    // Filter
    $('#statusFilter').on('change', filterAndRenderReports);
    
    // --- MODAL BUTTON BINDINGS ---
    // Assign Truck Modal
    $('#closeAssignModalBtn').on('click', hideAssignTruckModal);
    $('#confirmAssignmentBtn').on('click', handleAssignTruck);
    
    // Proof Review Modal
    $('#closeProofModalBtn').on('click', hideProofReviewModal);
    $('#approveClearanceBtn').on('click', handleApproveClearance);
    $('#rejectClearanceBtn').on('click', handleRejectProof);

    // --- NEW TRUCK MODAL BINDINGS ---
    $('#closeTruckModalBtn').on('click', closeTruckModal);
    $('#addTruckForm').on('submit', handleAddTruck);
    $('#trucksTableBody').on('click', '.toggle-truck-availability', handleToggleTruckStatus); // Delegation for action button
    
    // --- TABLE EVENT BINDINGS (Delegation) ---
    $('#reportsTableBody').on('click', '.action-assign-btn', openAssignTruckModal);
    $('#reportsTableBody').on('click', '.action-clear-btn', handleMarkClearedOrReview); 
    $('#reportsTableBody').on('click', '.view-detail-btn', showDetailModal);

    // Initial data fetch: Reports and Trucks
    Promise.all([fetchReports(), fetchTrucks()]);
}

// =================================================================
// PART 2: DATA FETCHING AND SUMMARY
// =================================================================

async function fetchData(url) {
    const token = localStorage.getItem('adminToken');

    if (!token) { 
        window.location.href = 'admin-login.html';
        return [];
    }
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        if (response.ok) {
            return data.data; 
        } else if (response.status === 401) {
            showStatusMessage('Session expired. Please log in again.', 'error');
            setTimeout(() => handleLogout(), 2000);
            return [];
        } else {
            showStatusMessage(`Failed to fetch data: ${data.error || response.statusText}`, 'error');
            return [];
        }
    } catch (err) {
        console.error('Network Error fetching:', url, err);
        showStatusMessage('A network error occurred. Check backend server.', 'error');
        return [];
    }
}

async function fetchReports() {
    showStatusMessage('Loading reports...', 'info');
    reportsData = await fetchData(API_REPORTS_URL);
    updateSummaryTiles();
    filterAndRenderReports();
    hideStatusMessage(100);
}

async function fetchTrucks() {
    trucksData = await fetchData(API_TRUCKS_URL);
    populateTruckSelect();
    
    // RENDER THE TRUCKS TABLE IF THE MODAL IS OPEN
    if ($('#truckManagementModal').hasClass('flex')) {
        renderTrucksTable(trucksData);
    }
}

function updateSummaryTiles() {
    const pending = reportsData.filter(r => r.status === 'Pending').length;
    const inProgress = reportsData.filter(r => r.status === 'Assigned' || r.status === 'In-Progress').length; 
    const cleared = reportsData.filter(r => r.status === 'Cleared').length;
    
    $('#totalCount').text(reportsData.length);
    $('#pendingCount').text(pending);
    $('#inProgressCount').text(inProgress);
    $('#clearedCount').text(cleared);
}

function filterAndRenderReports() {
    const filterStatus = $('#statusFilter').val();
    let filteredReports = reportsData;

    if (filterStatus !== 'All') {
        filteredReports = reportsData.filter(report => report.status === filterStatus);
    }
    
    renderReports(filteredReports);
}


// =================================================================
// PART 3: RENDERING AND ACTIONS
// =================================================================

function getTruckName(truckId) {
    if (!truckId) return 'N/A';
    const truck = trucksData.find(t => t._id === truckId);
    return truck ? `${truck.license_plate} (${truck.driver_name})` : 'Truck Not Found';
}

function renderReports(reports) {
    const tbody = $('#reportsTableBody');
    tbody.empty(); 

    if (reports.length === 0) {
        tbody.append(`<tr><td colspan="7" class="text-center py-4 text-gray-500">No reports found.</td></tr>`);
        return;
    }

    reports.forEach(report => {
        const date = new Date(report.date_created).toLocaleDateString('en-NG');
        const statusClass = `status-${report.status.replace(/\s/g, '-')}`; 
        const assignedTruck = getTruckName(report.assigned_to);

        let actionButtonHTML = '';
        if (report.status === 'Pending') {
            actionButtonHTML = `<button data-id="${report._id}" class="action-assign-btn bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs">Assign Truck</button>`;
        } else if (report.status === 'Assigned') {
             // Admin override to mark cleared (less common, but sometimes necessary)
             actionButtonHTML = `<button data-id="${report._id}" class="action-clear-btn bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-xs">Mark Cleared</button>`;
        } else if (report.status === 'In-Progress') {
             // Driver has submitted proof, prompt review modal
             actionButtonHTML = `<button data-id="${report._id}" class="action-clear-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-xs font-bold">Review Proof</button>`;
        } else {
            actionButtonHTML = `<span class="text-gray-400">Cleared</span>`;
        }

        const row = `
            <tr id="report-${report._id}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${report._id.substring(18)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.location.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-semibold">${assignedTruck}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.description.substring(0, 30)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 inline-flex text-xs leading-5 rounded-full ${statusClass}">${report.status}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${actionButtonHTML}
                    <button data-id="${report._id}" class="view-detail-btn text-blue-600 hover:text-blue-900 font-medium ml-2">Detail</button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

// =================================================================
// PART 4: ASSIGNMENT LOGIC
// =================================================================

function populateTruckSelect() {
    const select = $('#truckSelect');
    select.empty();
    select.append('<option value="">-- Select a Truck --</option>');
    
    trucksData.forEach(truck => {
        // Only show available trucks for assignment
        if (truck.is_available) {
             select.append(`<option value="${truck._id}">${truck.license_plate} - ${truck.driver_name} (${truck.capacity_tons}T)</option>`);
        }
    });
}

function openAssignTruckModal(e) {
    currentReportIdToAssign = $(e.currentTarget).data('id');
    $('#reportIdToAssign').text(`Report ID: ${currentReportIdToAssign.substring(0, 8)}...`);
    $('#assignTruckModal').removeClass('hidden').addClass('flex');
}

function hideAssignTruckModal() {
    $('#assignTruckModal').removeClass('flex').addClass('hidden');
    currentReportIdToAssign = null;
    $('#truckSelect').val(''); // Reset selection
}

async function handleAssignTruck() {
    const truckId = $('#truckSelect').val();
    const reportId = currentReportIdToAssign;
    
    if (!truckId || !reportId) {
        return showStatusMessage('Please select a truck.', 'error');
    }
    
    const token = localStorage.getItem('adminToken');
    showStatusMessage('Assigning truck...', 'info');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
            },
            // Update status, assigned_to, and date_assigned
            body: JSON.stringify({ 
                status: 'Assigned', 
                assigned_to: truckId,
                date_assigned: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (response.ok) {
            showStatusMessage(`Report ${reportId.substring(0, 8)} assigned successfully!`, 'success');
            Promise.all([fetchReports(), fetchTrucks()]);
        } else {
            showStatusMessage(data.error || 'Failed to assign truck.', 'error');
        }

    } catch (err) {
        showStatusMessage('Network error during assignment.', 'error');
    } finally {
        hideAssignTruckModal();
        hideStatusMessage(2000);
    }
}


// =================================================================
// PART 5: PROOF REVIEW LOGIC
// =================================================================

function handleMarkClearedOrReview(e) {
    const reportId = $(e.currentTarget).data('id');
    const report = reportsData.find(r => r._id === reportId);

    if (!report) return;

    if (report.status === 'In-Progress') {
        // Driver has submitted proof, open the review modal
        openProofReviewModal(report);
    } else if (report.status === 'Assigned') {
        // Admin override: Allows admin to clear the report without waiting for proof
        if (confirm(`Are you sure you want to mark report ${reportId.substring(0, 8)} as CLEARED? This bypasses the driver proof submission.`)) {
            handleMarkCleared(reportId);
        }
    }
}

async function handleMarkCleared(reportId) {
    const token = localStorage.getItem('adminToken');
    showStatusMessage(`Marking report ${reportId.substring(0, 8)} as CLEARED...`, 'info');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                status: 'Cleared',
                date_cleared: new Date().toISOString()
            })
        });

        if (response.ok) {
            showStatusMessage(`Report ${reportId.substring(0, 8)} CLEARED successfully!`, 'success');
        } else {
            const data = await response.json();
            showStatusMessage(data.error || 'Failed to clear report.', 'error');
        }
    } catch (err) {
        showStatusMessage('Network error during clearance.', 'error');
    } finally {
        fetchReports(); 
        hideStatusMessage(2000);
    }
}

function openProofReviewModal(report) {
    const truckName = getTruckName(report.assigned_to);
    
    // Populate modal fields
    $('#proofReportId').text(report._id.substring(0, 8) + '...');
    $('#proofDriverInfo').text(truckName);
    $('#proofNotes').text(report.proof_notes || 'No notes provided by driver.');
    
    // Set image source (use placeholder if not available)
    $('#proofImage').attr('src', report.proof_image_url || '/images/placeholder.jpg'); 

    // Set the report ID on the action buttons
    $('#approveClearanceBtn').data('report-id', report._id);
    $('#rejectClearanceBtn').data('report-id', report._id);

    $('#proofReviewModal').removeClass('hidden').addClass('flex');
}

function hideProofReviewModal() {
    $('#proofReviewModal').removeClass('flex').addClass('hidden');
}

async function handleApproveClearance(e) {
    const reportId = $(e.currentTarget).data('report-id');
    const token = localStorage.getItem('adminToken');
    
    showStatusMessage(`Approving report ${reportId.substring(0, 8)}...`, 'info');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                status: 'Cleared',
                date_cleared: new Date().toISOString()
            })
        });

        if (response.ok) {
            showStatusMessage(`Report ${reportId.substring(0, 8)} approved and CLEARED!`, 'success');
        } else {
            const data = await response.json();
            showStatusMessage(data.error || 'Failed to approve clearance.', 'error');
        }
    } catch (err) {
        showStatusMessage('Network error during approval.', 'error');
    } finally {
        hideProofReviewModal();
        fetchReports();
        hideStatusMessage(2000);
    }
}

async function handleRejectProof(e) {
    const reportId = $(e.currentTarget).data('report-id'); 
    const token = localStorage.getItem('adminToken');
    
    showStatusMessage(`Rejecting proof for report ${reportId.substring(0, 8)}...`, 'info');

    try {
        const response = await fetch(`${API_REPORTS_URL}/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
            },
            // Revert status to Assigned, clear proof fields so driver can resubmit
            body: JSON.stringify({ 
                status: 'Assigned',
                proof_notes: null,
                proof_image_url: null
            }) 
        });

        if (response.ok) {
            showStatusMessage(`Report ${reportId.substring(0, 8)} rejected. Status reverted to ASSIGNED.`, 'success');
        } else {
            const data = await response.json();
            showStatusMessage(data.error || 'Failed to reject proof.', 'error');
        }
    } catch (err) {
        showStatusMessage('Network error during rejection.', 'error');
    } finally {
        hideProofReviewModal();
        fetchReports();
        hideStatusMessage(2000);
    }
}


// =================================================================
// PART 6: TRUCK MANAGEMENT LOGIC (NEW)
// =================================================================

function openTruckModal() {
    // Re-fetch trucks to ensure the list is up-to-date
    fetchTrucks(); 
    $('#truckManagementModal').removeClass('hidden').addClass('flex');
}

function closeTruckModal() {
    $('#truckManagementModal').removeClass('flex').addClass('hidden');
    // Important: Re-fetch reports/trucks in the background after closing, 
    // in case availability was changed and the main dashboard needs updating.
    Promise.all([fetchReports(), fetchTrucks()]);
}

function renderTrucksTable(trucks) {
    const tbody = $('#trucksTableBody');
    tbody.empty();

    if (trucks.length === 0) {
        tbody.append(`<tr><td colspan="5" class="text-center py-4 text-gray-500">No trucks registered yet.</td></tr>`);
        return;
    }

    trucks.forEach(truck => {
        const isAvailable = truck.is_available;
        const statusText = isAvailable ? 'Available' : 'Busy';
        const statusClass = isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const actionText = isAvailable ? 'Mark Busy' : 'Mark Available';
        const actionClass = isAvailable ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';

        const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${truck.license_plate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${truck.driver_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${truck.capacity_tons}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button data-id="${truck._id}" 
                            data-is-available="${isAvailable}"
                            class="toggle-truck-availability ${actionClass} text-white py-1 px-3 rounded text-xs transition">
                        ${actionText}
                    </button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

async function handleAddTruck(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    const newTruck = {
        license_plate: $('#newPlate').val(),
        driver_name: $('#newDriver').val(),
        capacity_tons: parseFloat($('#newCapacity').val()),
        is_available: true // New trucks are available by default
    };

    if (!newTruck.license_plate || !newTruck.driver_name || isNaN(newTruck.capacity_tons) || newTruck.capacity_tons <= 0) {
        return showStatusMessage('Please fill out all truck details correctly.', 'error');
    }

    showStatusMessage('Adding new truck...', 'info');

    try {
        const response = await fetch(API_TRUCKS_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTruck)
        });

        if (response.ok) {
            showStatusMessage('Truck added successfully!', 'success');
            $('#addTruckForm')[0].reset(); // Clear form
            fetchTrucks(); // Refresh truck list
        } else {
            const data = await response.json();
            showStatusMessage(data.error || 'Failed to add truck.', 'error');
        }
    } catch (err) {
        showStatusMessage('Network error during truck addition.', 'error');
    } finally {
        hideStatusMessage(2000);
    }
}

async function handleToggleTruckStatus(e) {
    const truckId = $(e.currentTarget).data('id');
    // data-is-available attribute is stored as a string, convert to boolean
    const currentlyAvailable = $(e.currentTarget).data('is-available') === true; 
    const newStatus = !currentlyAvailable;
    const token = localStorage.getItem('adminToken');
    
    showStatusMessage(`Setting truck status to ${newStatus ? 'Available' : 'Busy'}...`, 'info');

    try {
        const response = await fetch(`${API_TRUCKS_URL}/${truckId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_available: newStatus })
        });

        if (response.ok) {
            showStatusMessage('Truck status updated successfully!', 'success');
            fetchTrucks(); // Refresh truck list and re-render table
        } else {
            const data = await response.json();
            showStatusMessage(data.error || 'Failed to update truck status.', 'error');
        }
    } catch (err) {
        showStatusMessage('Network error during status update.', 'error');
    } finally {
        hideStatusMessage(2000);
    }
}


// =================================================================
// PART 7: UTILITIES AND INITIAL CALL
// =================================================================

function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
}

function showDetailModal(e) {
    // This is a placeholder for a full detail view of a report
    const reportId = $(e.currentTarget).data('id');
    const report = reportsData.find(r => r._id === reportId);
    if (report) {
        alert(`Details for Report ${report._id.substring(0, 8)}...\n\nDescription: ${report.description}\n\nLatitude: ${report.location.lat}\nLongitude: ${report.location.lon}`);
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

// Start the application flow
$(document).ready(function() {
    checkAuthAndInit();
});
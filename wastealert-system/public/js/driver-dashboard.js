/**
 * EMIWIP Driver Dashboard - Complete Functional Implementation
 * Aligned with "Web-Enabled Environmental Waste Information Management System"
 */

const API_BASE = 'http://localhost:5000/api';
const DRIVER_LOGIN_URL = 'driver-auth.html';

// Global State
let driverData = {
    user: null,
    truck: null
};

$(document).ready(function() {
    // 1. Initial Auth & Data Load
    checkAuthAndInit();
    
    // 2. Inject Missing Profile Modal (Dynamic UI)
    injectProfileModal();

    // 3. Core Event Listeners
    $('#logoutBtn').on('click', handleLogout);
    $('#refreshReportsBtn').on('click', fetchAssignedReports);
    $('#truckRegForm').on('submit', handleTruckRegistration);
    
    // 4. Modal Handlers
    $('#openProfileModalBtn').on('click', openProfileModal);
    $('#closeClearanceModalBtn').on('click', () => $('#clearanceModal').addClass('hidden'));
    
    // Close modals on backdrop click
    $(document).on('click', '.modal-backdrop', function(e) {
        if (e.target === this) $(this).addClass('hidden');
    });

    // 5. Sidebar Toggles
    $('#mobileMenuBtn').on('click', () => {
        $('#sidebar').removeClass('-translate-x-full');
        $('#sidebarOverlay').removeClass('hidden');
    });
    $('#closeSidebarBtn, #sidebarOverlay').on('click', () => {
        $('#sidebar').addClass('-translate-x-full');
        $('#sidebarOverlay').addClass('hidden');
    });

    // 6. Task Action Delegation
    $(document).on('click', '.confirm-pickup-btn', function() {
        const id = $(this).data('id');
        handleStatusUpdate(id, 'In Progress', 'Pickup confirmed! Proceed to disposal site.');
    });

    $(document).on('click', '.open-clearance-btn', function() {
        const id = $(this).data('id');
        $('#clearanceReportId').text(id.slice(-6));
        $('#clearanceModal').removeClass('hidden').data('report-id', id);
    });

    $('#clearanceForm').on('submit', handleClearanceSubmit);
});

/**
 * AUTHENTICATION & INITIALIZATION
 */
async function checkAuthAndInit() {
    const token = localStorage.getItem('driverToken');
    if (!token) return handleLogout();

    try {
        const response = await fetch(`${API_BASE}/drivers/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) return handleLogout();
        const result = await response.json();

        if (result.success) {
            driverData.user = result.data.user;
            driverData.truck = result.data.truck;
            syncUIState();
        } else {
            // If profile fetch fails but token exists, force logout to prevent UI glitches
            handleLogout(); 
        }
    } catch (err) {
        console.error("Init Error:", err);
        showStatusMessage("Connection lost. Retrying...", "error");
    }
}

/**
 * UI SYNCHRONIZATION
 * Maps backend data to frontend elements securely
 */
function syncUIState() {
    // 1. User Info
    $('#driverName').text(driverData.user.username);
    $('#driverEmail').text(driverData.user.email);

    // 2. Hide all sections initially
    $('#truckRegistrationSection, #pendingApprovalSection, #operationsSection, #unitStats').addClass('hidden');

    // 3. Determine State
    if (!driverData.truck) {
        // STATE: New Driver (No Truck)
        $('#truckRegistrationSection').removeClass('hidden');
        $('#truckStatusBadge').text('No Unit Registered').addClass('badge-pending').removeClass('badge-approved');
    } 
    else {
        // Fix: Handle both field names to prevent "Undefined"
        const plate = driverData.truck.license_plate || driverData.truck.plate_number || 'N/A';
        
        // Update Stats Header
        $('#unitStats').removeClass('hidden');
        $('#unitPlate').text(plate);
        $('#unitCapacity').text(`${driverData.truck.capacity_tons} T`);

        if (!driverData.truck.is_approved) {
            // STATE: Pending Verification
            $('#pendingApprovalSection').removeClass('hidden');
            $('#truckStatusBadge').text('Verification Pending').addClass('badge-pending').removeClass('badge-approved');
        } else {
            // STATE: Active Operations
            $('#operationsSection').removeClass('hidden');
            $('#truckStatusBadge').text('Active Unit').addClass('badge-approved').removeClass('badge-pending');
            fetchAssignedReports();
        }
    }
}

/**
 * TRUCK REGISTRATION
 */
async function handleTruckRegistration(e) {
    e.preventDefault();
    const token = localStorage.getItem('driverToken');
    const $btn = $(this).find('button[type="submit"]');

    // Validate inputs
    const plate = $('#regPlate').val().trim().toUpperCase();
    const caps = parseFloat($('#regCapacity').val());

    if (!plate || !caps) return showStatusMessage("Please fill all vehicle details", "error");

    $btn.prop('disabled', true).text('PROCESSING...');

    try {
        const res = await fetch(`${API_BASE}/trucks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plate_number: plate, capacity_tons: caps })
        });

        const data = await res.json();

        if (res.ok) {
            showStatusMessage("Registration successful! Awaiting admin verification.", "success");
            checkAuthAndInit(); // Refresh state immediately
        } else {
            throw new Error(data.error || "Registration failed");
        }
    } catch (err) {
        showStatusMessage(err.message, "error");
    } finally {
        $btn.prop('disabled', false).text('Submit Unit for Verification');
    }
}

/**
 * TASK MANAGEMENT (Assigned Reports)
 */
async function fetchAssignedReports() {
    const token = localStorage.getItem('driverToken');
    try {
        const res = await fetch(`${API_BASE}/reports/driver/assigned`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        const container = $('#assignedReportsList');
        container.empty();

        if (!result.data || result.data.length === 0) {
            $('#noReportsMessage').removeClass('hidden');
            return;
        }

        $('#noReportsMessage').addClass('hidden');
        
        result.data.forEach(report => {
            const isProgress = report.status === 'In Progress';
            
            // Logic: If 'In Progress', show Clear button. If 'Assigned/Pending', show Confirm button.
            const actionBtn = isProgress 
                ? `<button data-id="${report._id}" class="open-clearance-btn w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 transition-all">
                     <i class="fas fa-check-circle mr-2"></i> Report Disposal
                   </button>` 
                : `<button data-id="${report._id}" class="confirm-pickup-btn w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 transition-all">
                     <i class="fas fa-truck-loading mr-2"></i> Confirm Pickup
                   </button>`;

            container.append(`
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-6">
                        <span class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">${report.status}</span>
                        <span class="text-[10px] font-bold text-slate-300">#${report._id.slice(-6)}</span>
                    </div>
                    
                    <h4 class="font-black text-slate-900 text-xl leading-tight mb-2">${report.location.lga_city}</h4>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">${report.location.state_area}</p>
                    
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
                        <p class="text-xs font-medium text-slate-600 leading-relaxed">
                            ${report.description || 'No specific instructions provided.'}
                        </p>
                    </div>
                    ${actionBtn}
                </div>
            `);
        });
    } catch (e) { console.error("Fetch Error:", e); }
}

async function handleStatusUpdate(reportId, newStatus, successMsg) {
    const token = localStorage.getItem('driverToken');
    try {
        const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showStatusMessage(successMsg, "success");
            fetchAssignedReports(); // Refresh list to update button state
        }
    } catch (err) { showStatusMessage("Status update failed", "error"); }
}

/**
 * WASTE CLEARANCE (Syncs with Admin)
 */
async function handleClearanceSubmit(e) {
    e.preventDefault();
    const reportId = $('#clearanceModal').data('report-id');
    const token = localStorage.getItem('driverToken');
    const notes = $(this).find('textarea').val();

    if (!notes.trim()) return showStatusMessage("Please provide disposal notes", "error");

    const $btn = $('#submitClearanceBtn');
    $btn.prop('disabled', true).text('Verifying...');

    try {
        const res = await fetch(`${API_BASE}/reports/${reportId}/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ clearance_notes: notes })
        });

        if (res.ok) {
            showStatusMessage("Waste cleared & Unit status updated!", "success");
            $('#clearanceModal').addClass('hidden');
            $('#clearanceForm')[0].reset();
            fetchAssignedReports(); // Refresh to remove the cleared item
        } else {
            showStatusMessage("Failed to submit clearance", "error");
        }
    } catch (err) { 
        showStatusMessage("Server error during clearance", "error");
    } finally {
        $btn.prop('disabled', false).text('Submit Verification');
    }
}

/**
 * UNIT PROFILE MODAL (Dynamic Injection)
 * Adds the functionality missing from the HTML file
 */
function injectProfileModal() {
    const modalHTML = `
    <div id="profileModal" class="modal-backdrop hidden fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-2xl font-black text-slate-900">Unit Profile</h3>
                <button onclick="$('#profileModal').addClass('hidden')" class="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-6">
                <div class="bg-indigo-50 p-6 rounded-[2rem] text-center border-2 border-indigo-100">
                    <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <i class="fas fa-truck-monster"></i>
                    </div>
                    <h4 id="profilePlate" class="text-3xl font-black text-indigo-900 tracking-tight mb-1">---</h4>
                    <p class="text-indigo-400 text-xs font-bold uppercase tracking-widest">Registered Plate ID</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Capacity</p>
                        <p id="profileCapacity" class="text-xl font-black text-slate-800">---</p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                        <p id="profileStatus" class="text-sm font-black uppercase text-slate-800">---</p>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-100">
                     <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Operator</p>
                     <p id="profileDriver" class="font-bold text-slate-800">---</p>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHTML);
}

function openProfileModal() {
    if (!driverData.truck) return showStatusMessage("No vehicle registered yet", "error");
    
    // Normalize fields
    const plate = driverData.truck.license_plate || driverData.truck.plate_number || 'N/A';
    
    // Populate Data
    $('#profilePlate').text(plate);
    $('#profileCapacity').text(`${driverData.truck.capacity_tons} Tons`);
    $('#profileDriver').text(driverData.user.username);
    
    const statusText = driverData.truck.is_approved ? 'Active / Verified' : 'Pending Approval';
    const statusColor = driverData.truck.is_approved ? 'text-green-600' : 'text-amber-600';
    $('#profileStatus').text(statusText).removeClass('text-green-600 text-amber-600').addClass(statusColor);

    $('#profileModal').removeClass('hidden');
}

/**
 * HELPER FUNCTIONS
 */
function handleLogout() {
    localStorage.removeItem('driverToken');
    window.location.href = DRIVER_LOGIN_URL;
}

function showStatusMessage(text, type) {
    const msg = $('#statusMessage');
    msg.text(text)
       .removeClass('hidden opacity-0 bg-red-500 bg-green-500')
       .addClass(type === 'error' ? 'bg-red-500' : 'bg-green-500')
       .fadeIn();
    setTimeout(() => msg.fadeOut(), 3000);
}
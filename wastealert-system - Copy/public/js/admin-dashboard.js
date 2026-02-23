/**
 * EMIWIP Admin Dashboard - Complete Functional Implementation
 * Handles Report Management, Fleet Assignment, and Details Viewing
 */

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'adminToken';

// Global State
let reportsData = [];
let allTrucks = [];
let pendingDrivers = [];
let currentReportIdToAssign = null;
let currentTab = 'pending'; // Options: 'pending', 'active', 'cleared'

$(document).ready(function() {
    // 1. Security Check
    checkAuth();

    // 2. Initial Data Sync
    fetchAllData();
    
    // 3. Inject Missing Details Modal (Dynamic UI creation)
    injectDetailsModal();

    // 4. Navigation Events (Mobile & Desktop)
    $('#mobileMenuBtn').on('click', () => $('#sidebar').removeClass('-translate-x-full'));
    $('#closeSidebarBtn').on('click', () => $('#sidebar').addClass('-translate-x-full'));
    
    $('#navDashboard').on('click', () => switchPage('Dashboard'));
    $('#navFleet').on('click', () => switchPage('Fleet'));

    // 5. Tab Logic
    $('.tab-btn').on('click', function() {
        const tab = $(this).data('tab');
        
        // UI Update
        $('.tab-btn').removeClass('text-indigo-600 border-b-4 border-indigo-600 font-black')
                     .addClass('text-gray-400 font-bold');
        $(this).addClass('text-indigo-600 border-b-4 border-indigo-600 font-black')
               .removeClass('text-gray-400 font-bold');
        
        currentTab = tab;
        renderReports();
    });

    // 6. Refresh Button
    $('#refreshDataBtn').on('click', function() {
        const icon = $(this).find('i');
        icon.addClass('fa-spin');
        fetchAllData().finally(() => setTimeout(() => icon.removeClass('fa-spin'), 800));
    });

    // 7. Modal Handlers
    $('#assignmentForm').on('submit', handleAssignmentSubmit);
    
    // Universal Modal Close
    $(document).on('click', '.close-modal, .modal-backdrop', function(e) {
        if (e.target === this || $(e.target).hasClass('close-modal')) {
            $('.modal-backdrop').addClass('hidden');
        }
    });
});

/**
 * --- DATA FETCHING ---
 */
async function fetchAllData() {
    const token = localStorage.getItem(ADMIN_TOKEN);
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        const [repRes, truckRes, driverRes] = await Promise.all([
            fetch(`${API_BASE}/reports`, { headers }),
            fetch(`${API_BASE}/trucks`, { headers }),
            fetch(`${API_BASE}/users/drivers/pending`, { headers })
        ]);

        if (repRes.ok) reportsData = (await repRes.json()).data || [];
        if (truckRes.ok) allTrucks = (await truckRes.json()).data || [];
        if (driverRes.ok) pendingDrivers = (await driverRes.json()).data || [];

        updateStats();
        renderReports();
        renderApprovalTables();
    } catch (e) {
        showStatusMessage("Failed to sync with server", "error");
    }
}

function updateStats() {
    $('#statPending').text(reportsData.filter(r => r.status.toLowerCase() === 'pending').length);
    $('#statActive').text(reportsData.filter(r => r.status.toLowerCase() === 'in progress').length);
    $('#statCleared').text(reportsData.filter(r => r.status.toLowerCase() === 'cleared').length);
}

/**
 * --- REPORT MANAGEMENT ---
 */
function renderReports() {
    const container = $('#reportsGrid');
    container.empty();

    // Normalizing status check (backend might return 'In Progress', tab is 'Active')
    const filtered = reportsData.filter(r => {
        const status = r.status.toLowerCase();
        if (currentTab === 'pending') return status === 'pending';
        if (currentTab === 'Active') return status === 'in progress'; // Map Active tab to In Progress status
        if (currentTab === 'Cleared') return status === 'cleared';
        return false;
    });

    if (filtered.length === 0) {
        container.append(`
            <div class="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">No reports found in this category</p>
            </div>
        `);
        return;
    }

    filtered.forEach(report => {
        // Safe access to nested location
        const locName = report.location?.location_name || 'Unknown Location';
        const area = report.location?.state_area || '---';
        const isPending = report.status.toLowerCase() === 'pending';

        container.append(`
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div class="flex justify-between items-start mb-6">
                    <span class="status-badge ${getStatusColor(report.status)}">${report.status}</span>
                    <span class="text-[10px] font-bold text-slate-300 uppercase">#${report._id.slice(-6)}</span>
                </div>
                
                <h4 class="font-black text-slate-800 text-lg leading-tight mb-2 line-clamp-2">${locName}</h4>
                <p class="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-6">${area}</p>
                
                <div class="flex gap-3 mt-auto">
                    <button onclick="viewReportDetails('${report._id}')" 
                        class="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">
                        View Info
                    </button>
                    ${isPending ? `
                        <button onclick="openAssignModal('${report._id}')" 
                            class="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            Deploy Unit
                        </button>
                    ` : ''}
                </div>
            </div>
        `);
    });
}

function getStatusColor(status) {
    const s = status.toLowerCase();
    if (s === 'pending') return 'bg-amber-50 text-amber-600';
    if (s === 'in progress') return 'bg-indigo-50 text-indigo-600';
    return 'bg-emerald-50 text-emerald-600';
}

/**
 * --- VIEW DETAILS LOGIC (Missing Functionality Added) ---
 */
window.viewReportDetails = function(id) {
    const report = reportsData.find(r => r._id === id);
    if (!report) return;

    // Populate the dynamic modal
    $('#modalImg').attr('src', report.image_url || 'https://via.placeholder.com/400x300?text=No+Image');
    $('#modalDesc').text(report.description);
    $('#modalPhone').text(report.reporter_phone);
    $('#modalLoc').text(`${report.location.location_name}, ${report.location.lga_city}`);
    $('#modalStatus').text(report.status);
    
    // Show Modal
    $('#detailsModal').removeClass('hidden');
};

/**
 * --- ASSIGNMENT LOGIC ---
 */
window.openAssignModal = function(id) {
    currentReportIdToAssign = id;
    const select = $('#truckSelect');
    select.empty().append('<option value="">Select a verified unit...</option>');
    
    // Filter: Only Approved Trucks that are NOT assigned (Available)
    const available = allTrucks.filter(t => t.is_approved && !t.is_assigned);
    
    if (available.length === 0) {
        select.append('<option disabled>No active units available</option>');
    } else {
        available.forEach(t => {
            // Handle inconsistent field names from backend
            const plate = t.license_plate || t.plate_number || 'Unknown Plate';
            select.append(`<option value="${t._id}">${plate} (${t.capacity_tons}T)</option>`);
        });
    }

    $('#assignmentModal').removeClass('hidden');
};

/**
 * CRITICAL UPDATE: Deployment Logic
 * Hardened to prevent 500 errors and ensure strict state synchronization
 */
async function handleAssignmentSubmit(e) {
    e.preventDefault();

    // 1. Pre-flight Validation
    // Ensures a report is active in the modal and a truck is selected
    if (!currentReportIdToAssign) {
        showStatusMessage("System Error: No report selected for assignment.", "error");
        return;
    }

    const truckId = $('#truckSelect').val();
    if (!truckId || truckId === "") {
        showStatusMessage("Please select an available fleet unit.", "error");
        return;
    }

    // 2. Authorization Verification
    // Crashes occur if the token is missing during the PUT request
    const token = localStorage.getItem(ADMIN_TOKEN);
    if (!token) {
        showStatusMessage("Session expired. Please log in again.", "error");
        setTimeout(() => window.location.href = 'admin-auth.html', 1500);
        return;
    }

    // 3. UI Protection
    // Prevents double-clicks which trigger concurrent server-side status updates
    const $submitBtn = $(this).find('button[type="submit"]');
    const originalText = $submitBtn.text();
    $submitBtn.prop('disabled', true).text('DEPLOYING...');

    try {
        // 4. Execution
        // Targeted PUT request to update report status and assign truck
        const res = await fetch(`${API_BASE}/reports/${currentReportIdToAssign}/assign`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ truck_id: truckId })
        });

        // Ensure we always have a JSON response to parse
        const result = await res.json();

        if (res.ok && result.success) {
            // 5. Success Logic & State Cleanup
            showStatusMessage("Fleet unit deployed! Task moved to 'Active'.", "success");
            
            // Hide modal and reset local state variables
            $('#assignmentModal').addClass('hidden');
            $('#assignmentForm')[0].reset();
            currentReportIdToAssign = null; 
            
            // Trigger a full re-sync to update Dashboard counts and Fleet tables
            fetchAllData(); 
        } else {
            // 6. Application-Level Error Handling
            // Handles cases like the truck being assigned by another admin simultaneously
            const errorMsg = result.error || "Deployment rejected by server.";
            showStatusMessage(errorMsg, "error");
        }

    } catch (err) {
        // 7. Transmission Failure
        console.error("Transmission Error:", err);
        showStatusMessage("Network Failure: Could not connect to Management Hub.", "error");
    } finally {
        // Always restore the button so the admin isn't locked out on failure
        $submitBtn.prop('disabled', false).text(originalText);
    }
}
/**
 * --- FLEET MANAGEMENT ---
 */
function renderApprovalTables() {
    // 1. Drivers
    const driverBody = $('#driverApprovalTable');
    driverBody.empty();
    
    if (pendingDrivers.length === 0) {
        driverBody.append('<tr><td colspan="3" class="p-8 text-center text-slate-300 text-xs font-bold uppercase">No pending requests</td></tr>');
    } else {
        pendingDrivers.forEach(d => {
            driverBody.append(`
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-6 font-bold text-slate-700">${d.username}</td>
                    <td class="p-6 text-slate-500 text-sm font-medium">${d.email}</td>
                    <td class="p-6 text-right">
                        <button onclick="approveDriver('${d._id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700">Approve</button>
                    </td>
                </tr>
            `);
        });
    }

    // 2. Fleet
    const fleetBody = $('#fleetTableBody');
    fleetBody.empty();

    allTrucks.forEach(t => {
        const plate = t.license_plate || t.plate_number || 'N/A';
        const driverName = t.driver_id ? t.driver_id.username : (t.driver_name || 'Unlinked');
        
        fleetBody.append(`
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-6 font-bold text-slate-700">${plate}</td>
                <td class="p-6 text-slate-500 text-sm font-medium">${driverName}</td>
                <td class="p-6">
                    ${t.is_approved 
                        ? `<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Active</span>`
                        : `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Pending</span>`
                    }
                </td>
                <td class="p-6 text-right">
                    ${!t.is_approved 
                        ? `<button onclick="approveTruck('${t._id}')" class="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-black">Verify</button>`
                        : `<span class="text-slate-300 text-[10px] font-bold uppercase">Verified</span>`
                    }
                </td>
            </tr>
        `);
    });
}

// Approval Actions
window.approveDriver = async (id) => simplePatch(`/users/${id}/approve`, "Driver authorized");
window.approveTruck = async (id) => simplePatch(`/trucks/${id}/approve`, "Truck verified");

async function simplePatch(endpoint, successMsg) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem(ADMIN_TOKEN)}` }
        });
        if (res.ok) {
            showStatusMessage(successMsg, "success");
            fetchAllData();
        } else {
            showStatusMessage("Action failed", "error");
        }
    } catch (e) { showStatusMessage("Network error", "error"); }
}

/**
 * --- HELPER FUNCTIONS ---
 */
function switchPage(page) {
    $('.nav-item').removeClass('active-nav');
    if (page === 'Dashboard') {
        $('#navDashboard').addClass('active-nav');
        $('#viewDashboard, #wasteOverview').removeClass('hidden');
        $('#viewFleet').addClass('hidden');
    } else {
        $('#navFleet').addClass('active-nav');
        $('#viewDashboard, #wasteOverview').addClass('hidden');
        $('#viewFleet').removeClass('hidden');
    }
    // Close mobile menu
    if(window.innerWidth < 1024) $('#sidebar').addClass('-translate-x-full');
}

function checkAuth() {
    if (!localStorage.getItem(ADMIN_TOKEN)) window.location.href = 'admin-auth.html';
}

window.handleLogout = function() {
    localStorage.removeItem(ADMIN_TOKEN);
    window.location.href = 'admin-login.html';
}

function showStatusMessage(text, type) {
    const msg = $('#statusMessage');
    msg.text(text)
       .removeClass('hidden bg-red-500 bg-green-500 opacity-0')
       .addClass(type === 'error' ? 'bg-red-500' : 'bg-green-500')
       .fadeIn();
    setTimeout(() => msg.fadeOut(), 3000);
}

/**
 * --- DYNAMIC UI INJECTION ---
 * Creates the Details Modal which is missing in the original HTML
 */
function injectDetailsModal() {
    if ($('#detailsModal').length) return;

    const modalHTML = `
    <div id="detailsModal" class="modal-backdrop hidden fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <span id="modalStatus" class="status-badge bg-indigo-50 text-indigo-600 mb-2 inline-block">Pending</span>
                    <h3 class="text-2xl font-black text-slate-900">Report Details</h3>
                </div>
                <button class="close-modal w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-6">
                <div class="aspect-video w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                    <img id="modalImg" src="" alt="Waste Proof" class="w-full h-full object-cover">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-slate-50 p-5 rounded-2xl">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Specific Location</p>
                        <p id="modalLoc" class="font-bold text-slate-800 text-sm">---</p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-2xl">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporter Contact</p>
                        <p id="modalPhone" class="font-bold text-slate-800 text-sm">---</p>
                    </div>
                </div>

                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                    <div class="p-5 border-2 border-slate-100 rounded-2xl text-slate-600 text-sm font-medium leading-relaxed">
                        <p id="modalDesc">---</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    $('body').append(modalHTML);
}
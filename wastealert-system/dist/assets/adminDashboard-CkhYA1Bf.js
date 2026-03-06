import"./modulepreload-polyfill-B5Qt9EMX.js";const l="/api",d="adminToken";let r=[],b=[],f=[],c=null,p="pending";$(document).ready(function(){_(),u(),D(),$("#mobileMenuBtn").on("click",()=>$("#sidebar").removeClass("-translate-x-full")),$("#closeSidebarBtn").on("click",()=>$("#sidebar").addClass("-translate-x-full")),$("#navDashboard").on("click",()=>g("Dashboard")),$("#navFleet").on("click",()=>g("Fleet")),$(".tab-btn").on("click",function(){const e=$(this).data("tab");$(".tab-btn").removeClass("text-indigo-600 border-b-4 border-indigo-600 font-black").addClass("text-gray-400 font-bold"),$(this).addClass("text-indigo-600 border-b-4 border-indigo-600 font-black").removeClass("text-gray-400 font-bold"),p=e,v()}),$("#refreshDataBtn").on("click",function(){const e=$(this).find("i");e.addClass("fa-spin"),u().finally(()=>setTimeout(()=>e.removeClass("fa-spin"),800))}),$("#assignmentForm").on("submit",y),$(document).on("click",".close-modal, .modal-backdrop",function(e){(e.target===this||$(e.target).hasClass("close-modal"))&&$(".modal-backdrop").addClass("hidden")})});async function u(){const a={Authorization:`Bearer ${localStorage.getItem(d)}`};try{const[t,s,o]=await Promise.all([fetch(`${l}/reports`,{headers:a}),fetch(`${l}/trucks`,{headers:a}),fetch(`${l}/users/drivers/pending`,{headers:a})]);t.ok&&(r=(await t.json()).data||[]),s.ok&&(b=(await s.json()).data||[]),o.ok&&(f=(await o.json()).data||[]),w(),v(),C()}catch{n("Failed to sync with server","error")}}function w(){$("#statPending").text(r.filter(e=>e.status.toLowerCase()==="pending").length),$("#statActive").text(r.filter(e=>e.status.toLowerCase()==="in progress").length),$("#statCleared").text(r.filter(e=>e.status.toLowerCase()==="cleared").length)}function v(){const e=$("#reportsGrid");e.empty();const a=r.filter(t=>{const s=t.status.toLowerCase();return p==="pending"?s==="pending":p==="Active"?s==="in progress":p==="Cleared"?s==="cleared":!1});if(a.length===0){e.append(`
            <div class="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">No reports found in this category</p>
            </div>
        `);return}a.forEach(t=>{const s=t.location?.location_name||"Unknown Location",o=t.location?.state_area||"---",i=t.status.toLowerCase()==="pending";e.append(`
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div class="flex justify-between items-start mb-6">
                    <span class="status-badge ${k(t.status)}">${t.status}</span>
                    <span class="text-[10px] font-bold text-slate-300 uppercase">#${t._id.slice(-6)}</span>
                </div>
                
                <h4 class="font-black text-slate-800 text-lg leading-tight mb-2 line-clamp-2">${s}</h4>
                <p class="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-6">${o}</p>
                
                <div class="flex gap-3 mt-auto">
                    <button onclick="viewReportDetails('${t._id}')" 
                        class="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">
                        View Info
                    </button>
                    ${i?`
                        <button onclick="openAssignModal('${t._id}')" 
                            class="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            Deploy Unit
                        </button>
                    `:""}
                </div>
            </div>
        `)})}function k(e){const a=e.toLowerCase();return a==="pending"?"bg-amber-50 text-amber-600":a==="in progress"?"bg-indigo-50 text-indigo-600":"bg-emerald-50 text-emerald-600"}window.viewReportDetails=function(e){const a=r.find(t=>t._id===e);a&&($("#modalImg").attr("src",a.image_url||"https://via.placeholder.com/400x300?text=No+Image"),$("#modalDesc").text(a.description),$("#modalPhone").text(a.reporter_phone),$("#modalLoc").text(`${a.location.location_name}, ${a.location.lga_city}`),$("#modalStatus").text(a.status),$("#detailsModal").removeClass("hidden"))};window.openAssignModal=function(e){c=e;const a=$("#truckSelect");a.empty().append('<option value="">Select a verified unit...</option>');const t=b.filter(s=>s.is_approved&&!s.is_assigned);t.length===0?a.append("<option disabled>No active units available</option>"):t.forEach(s=>{const o=s.license_plate||s.plate_number||"Unknown Plate";a.append(`<option value="${s._id}">${o} (${s.capacity_tons}T)</option>`)}),$("#assignmentModal").removeClass("hidden")};async function y(e){if(e.preventDefault(),!c){n("System Error: No report selected for assignment.","error");return}const a=$("#truckSelect").val();if(!a||a===""){n("Please select an available fleet unit.","error");return}const t=localStorage.getItem(d);if(!t){n("Session expired. Please log in again.","error"),setTimeout(()=>window.location.href="admin-auth.html",1500);return}const s=$(this).find('button[type="submit"]'),o=s.text();s.prop("disabled",!0).text("DEPLOYING...");try{const i=await fetch(`${l}/reports/${c}/assign`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({truck_id:a})}),m=await i.json();if(i.ok&&m.success)n("Fleet unit deployed! Task moved to 'Active'.","success"),$("#assignmentModal").addClass("hidden"),$("#assignmentForm")[0].reset(),c=null,u();else{const h=m.error||"Deployment rejected by server.";n(h,"error")}}catch(i){console.error("Transmission Error:",i),n("Network Failure: Could not connect to Management Hub.","error")}finally{s.prop("disabled",!1).text(o)}}function C(){const e=$("#driverApprovalTable");e.empty(),f.length===0?e.append('<tr><td colspan="3" class="p-8 text-center text-slate-300 text-xs font-bold uppercase">No pending requests</td></tr>'):f.forEach(t=>{e.append(`
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-6 font-bold text-slate-700">${t.username}</td>
                    <td class="p-6 text-slate-500 text-sm font-medium">${t.email}</td>
                    <td class="p-6 text-right">
                        <button onclick="approveDriver('${t._id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700">Approve</button>
                    </td>
                </tr>
            `)});const a=$("#fleetTableBody");a.empty(),b.forEach(t=>{const s=t.license_plate||t.plate_number||"N/A",o=t.driver_id?t.driver_id.username:t.driver_name||"Unlinked";a.append(`
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-6 font-bold text-slate-700">${s}</td>
                <td class="p-6 text-slate-500 text-sm font-medium">${o}</td>
                <td class="p-6">
                    ${t.is_approved?'<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Active</span>':'<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Pending</span>'}
                </td>
                <td class="p-6 text-right">
                    ${t.is_approved?'<span class="text-slate-300 text-[10px] font-bold uppercase">Verified</span>':`<button onclick="approveTruck('${t._id}')" class="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-black">Verify</button>`}
                </td>
            </tr>
        `)})}window.approveDriver=async e=>x(`/users/${e}/approve`,"Driver authorized");window.approveTruck=async e=>x(`/trucks/${e}/approve`,"Truck verified");async function x(e,a){try{(await fetch(`${l}${e}`,{method:"PATCH",headers:{Authorization:`Bearer ${localStorage.getItem(d)}`}})).ok?(n(a,"success"),u()):n("Action failed","error")}catch{n("Network error","error")}}function g(e){$(".nav-item").removeClass("active-nav"),e==="Dashboard"?($("#navDashboard").addClass("active-nav"),$("#viewDashboard, #wasteOverview").removeClass("hidden"),$("#viewFleet").addClass("hidden")):($("#navFleet").addClass("active-nav"),$("#viewDashboard, #wasteOverview").addClass("hidden"),$("#viewFleet").removeClass("hidden")),window.innerWidth<1024&&$("#sidebar").addClass("-translate-x-full")}function _(){localStorage.getItem(d)||(window.location.href="admin-auth.html")}window.handleLogout=function(){localStorage.removeItem(d),window.location.href="admin-login.html"};function n(e,a){const t=$("#statusMessage");t.text(e).removeClass("hidden bg-red-500 bg-green-500 opacity-0").addClass(a==="error"?"bg-red-500":"bg-green-500").fadeIn(),setTimeout(()=>t.fadeOut(),3e3)}function D(){if($("#detailsModal").length)return;$("body").append(`
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
    </div>`)}

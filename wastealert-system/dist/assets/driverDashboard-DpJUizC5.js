import"./modulepreload-polyfill-B5Qt9EMX.js";const d="/api",f="driver-auth.html";let r={user:null,truck:null};$(document).ready(function(){u(),h(),$("#logoutBtn").on("click",l),$("#refreshReportsBtn").on("click",c),$("#truckRegForm").on("submit",b),$("#openProfileModalBtn").on("click",v),$("#closeClearanceModalBtn").on("click",()=>$("#clearanceModal").addClass("hidden")),$(document).on("click",".modal-backdrop",function(e){e.target===this&&$(this).addClass("hidden")}),$("#mobileMenuBtn").on("click",()=>{$("#sidebar").removeClass("-translate-x-full"),$("#sidebarOverlay").removeClass("hidden")}),$("#closeSidebarBtn, #sidebarOverlay").on("click",()=>{$("#sidebar").addClass("-translate-x-full"),$("#sidebarOverlay").addClass("hidden")}),$(document).on("click",".confirm-pickup-btn",function(){const e=$(this).data("id");m(e,"In Progress","Pickup confirmed! Proceed to disposal site.")}),$(document).on("click",".open-clearance-btn",function(){const e=$(this).data("id");$("#clearanceReportId").text(e.slice(-6)),$("#clearanceModal").removeClass("hidden").data("report-id",e)}),$("#clearanceForm").on("submit",x)});async function u(){const e=localStorage.getItem("driverToken");if(!e)return l();try{const a=await fetch(`${d}/drivers/auth/profile`,{headers:{Authorization:`Bearer ${e}`}});if(a.status===401)return l();const t=await a.json();t.success?(r.user=t.data.user,r.truck=t.data.truck,g()):l()}catch(a){console.error("Init Error:",a),i("Connection lost. Retrying...","error")}}function g(){if($("#driverName").text(r.user.username),$("#driverEmail").text(r.user.email),$("#truckRegistrationSection, #pendingApprovalSection, #operationsSection, #unitStats").addClass("hidden"),!r.truck)$("#truckRegistrationSection").removeClass("hidden"),$("#truckStatusBadge").text("No Unit Registered").addClass("badge-pending").removeClass("badge-approved");else{const e=r.truck.license_plate||r.truck.plate_number||"N/A";$("#unitStats").removeClass("hidden"),$("#unitPlate").text(e),$("#unitCapacity").text(`${r.truck.capacity_tons} T`),r.truck.is_approved?($("#operationsSection").removeClass("hidden"),$("#truckStatusBadge").text("Active Unit").addClass("badge-approved").removeClass("badge-pending"),c()):($("#pendingApprovalSection").removeClass("hidden"),$("#truckStatusBadge").text("Verification Pending").addClass("badge-pending").removeClass("badge-approved"))}}async function b(e){e.preventDefault();const a=localStorage.getItem("driverToken"),t=$(this).find('button[type="submit"]'),o=$("#regPlate").val().trim().toUpperCase(),s=parseFloat($("#regCapacity").val());if(!o||!s)return i("Please fill all vehicle details","error");t.prop("disabled",!0).text("PROCESSING...");try{const n=await fetch(`${d}/trucks`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({plate_number:o,capacity_tons:s})}),p=await n.json();if(n.ok)i("Registration successful! Awaiting admin verification.","success"),u();else throw new Error(p.error||"Registration failed")}catch(n){i(n.message,"error")}finally{t.prop("disabled",!1).text("Submit Unit for Verification")}}async function c(){const e=localStorage.getItem("driverToken");try{const t=await(await fetch(`${d}/reports/driver/assigned`,{headers:{Authorization:`Bearer ${e}`}})).json(),o=$("#assignedReportsList");if(o.empty(),!t.data||t.data.length===0){$("#noReportsMessage").removeClass("hidden");return}$("#noReportsMessage").addClass("hidden"),t.data.forEach(s=>{const p=s.status==="In Progress"?`<button data-id="${s._id}" class="open-clearance-btn w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 transition-all">
                     <i class="fas fa-check-circle mr-2"></i> Report Disposal
                   </button>`:`<button data-id="${s._id}" class="confirm-pickup-btn w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 transition-all">
                     <i class="fas fa-truck-loading mr-2"></i> Confirm Pickup
                   </button>`;o.append(`
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-6">
                        <span class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">${s.status}</span>
                        <span class="text-[10px] font-bold text-slate-300">#${s._id.slice(-6)}</span>
                    </div>
                    
                    <h4 class="font-black text-slate-900 text-xl leading-tight mb-2">${s.location.lga_city}</h4>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">${s.location.state_area}</p>
                    
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
                        <p class="text-xs font-medium text-slate-600 leading-relaxed">
                            ${s.description||"No specific instructions provided."}
                        </p>
                    </div>
                    ${p}
                </div>
            `)})}catch(a){console.error("Fetch Error:",a)}}async function m(e,a,t){const o=localStorage.getItem("driverToken");try{(await fetch(`${d}/reports/${e}/status`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({status:a})})).ok&&(i(t,"success"),c())}catch{i("Status update failed","error")}}async function x(e){e.preventDefault();const a=$("#clearanceModal").data("report-id"),t=localStorage.getItem("driverToken"),o=$(this).find("textarea").val();if(!o.trim())return i("Please provide disposal notes","error");const s=$("#submitClearanceBtn");s.prop("disabled",!0).text("Verifying...");try{(await fetch(`${d}/reports/${a}/clear`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({clearance_notes:o})})).ok?(i("Waste cleared & Unit status updated!","success"),$("#clearanceModal").addClass("hidden"),$("#clearanceForm")[0].reset(),c()):i("Failed to submit clearance","error")}catch{i("Server error during clearance","error")}finally{s.prop("disabled",!1).text("Submit Verification")}}function h(){$("body").append(`
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
    </div>`)}function v(){if(!r.truck)return i("No vehicle registered yet","error");const e=r.truck.license_plate||r.truck.plate_number||"N/A";$("#profilePlate").text(e),$("#profileCapacity").text(`${r.truck.capacity_tons} Tons`),$("#profileDriver").text(r.user.username);const a=r.truck.is_approved?"Active / Verified":"Pending Approval",t=r.truck.is_approved?"text-green-600":"text-amber-600";$("#profileStatus").text(a).removeClass("text-green-600 text-amber-600").addClass(t),$("#profileModal").removeClass("hidden")}function l(){localStorage.removeItem("driverToken"),window.location.href=f}function i(e,a){const t=$("#statusMessage");t.text(e).removeClass("hidden opacity-0 bg-red-500 bg-green-500").addClass(a==="error"?"bg-red-500":"bg-green-500").fadeIn(),setTimeout(()=>t.fadeOut(),3e3)}

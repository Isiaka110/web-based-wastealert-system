// public/js/app.js

const API_URL = 'http://localhost:5000/api/reports'; // IMPORTANT: Match your Node.js server URL

let map, marker;
let selectedCoordinates = null; // Stores the final coordinates

// =================================================================
// PART 1: MAP AND GEOLOCATION SETUP (Leaflet.js)
// =================================================================

function initializeMap() {
    // Default location (e.g., center of your university or LGA in Nigeria)
    const defaultCenter = [7.3775, 3.9056]; // Example: Ibadan, Oyo State coordinates
    
    map = L.map('map').setView(defaultCenter, 13); // 13 is the zoom level

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Initial Marker (Optional)
    marker = L.marker(defaultCenter).addTo(map);
    marker.bindPopup("Drag me to the waste location!").openPopup();
    
    // Set initial coordinates for hidden fields
    updateLocation(defaultCenter[0], defaultCenter[1]);

    // Handle map clicks/taps
    map.on('click', function(e) {
        updateLocation(e.latlng.lat, e.latlng.lng);
    });
}

// Function to update the marker position and hidden form fields
function updateLocation(lat, lng) {
    if (marker) {
        map.removeLayer(marker);
    }
    selectedCoordinates = [lng, lat]; // GeoJSON standard is [longitude, latitude]
    
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
    
    // Update the hidden form inputs
    $('#latitude').val(lat);
    $('#longitude').val(lng);
    
    // Update the status message
    $('#locationStatus').text(`Location Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}. You can drag or click again.`);
}


// =================================================================
// PART 2: FORM SUBMISSION LOGIC (AJAX)
// =================================================================

$('#reportForm').on('submit', async function(e) {
    e.preventDefault();
    $('#submitBtn').prop('disabled', true).text('Submitting...');
    
    // 1. Create FormData object to handle file upload
    const formData = new FormData();
    
    // 2. Append all text fields
    formData.append('reporter_phone', $('#reporter_phone').val());
    formData.append('description', $('#description').val());
    formData.append('location_name', $('#location_name').val());
    
    // 3. Append image file
    const imageFile = $('#image')[0].files[0];
    if (imageFile) {
        formData.append('image', imageFile); // 'image' must match 'upload.single('image')' in server
    }

    // 4. Append coordinates in the format the server expects (JSON string)
    if ($('#latitude').val() && $('#longitude').val()) {
        const coords = [parseFloat($('#longitude').val()), parseFloat($('#latitude').val())];
        // The server will parse this string back into a JavaScript array
        formData.append('location_coordinates', JSON.stringify(coords)); 
    } else {
        showMessage('Please select the waste location on the map.', 'error');
        $('#submitBtn').prop('disabled', false).text('Submit Report');
        return;
    }

    // 5. Send POST request to the API
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData, // FormData handles 'multipart/form-data' headers automatically
        });
        
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || 'Report submitted successfully!', 'success');
            $('#reportForm')[0].reset(); // Clear the form
            updateLocation(7.3775, 3.9056); // Reset map marker
        } else {
            showMessage(data.error || 'Submission failed. Check your data.', 'error');
        }

    } catch (err) {
        console.error('Network or server error:', err);
        showMessage('A network error occurred. Please try again.', 'error');
    } finally {
        $('#submitBtn').prop('disabled', false).text('Submit Report');
    }
});

// Helper function for showing status messages
function showMessage(text, type) {
    const messageDiv = $('#message');
    messageDiv.removeClass().addClass('p-3 mb-4 rounded-lg text-center font-medium');
    
    if (type === 'success') {
        messageDiv.addClass('bg-green-100 text-green-700').html(`✅ ${text}`).show();
    } else if (type === 'error') {
        messageDiv.addClass('bg-red-100 text-red-700').html(`❌ ${text}`).show();
    }
}

// =================================================================
// PART 3: INITIALIZATION
// =================================================================

$(document).ready(function() {
    initializeMap();
});
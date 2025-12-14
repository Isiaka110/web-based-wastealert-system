// public/js/app.js (Complete client-side logic for waste report submission - FINAL - Map/Coordinates REMOVED)

const API_REPORTS_URL = 'http://localhost:5000/api/reports';

// Location data - Embed the JSON data directly (for State/LGA dropdowns)
const NIGERIA_LOCATIONS = [
  { "name": "Abia", "cities": [ "Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma Ngwa", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi" ] },
  { "name": "Adamawa", "cities": [ "Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South" ] },
  { "name": "Akwa Ibom", "cities": [ "Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat Enin", "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo" ] },
  { "name": "Anambra", "cities": [ "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi" ] },
  { "name": "Bauchi", "cities": [ "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki" ] },
  { "name": "Bayelsa", "cities": [ "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa" ] },
  { "name": "Benue", "cities": [ "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Tarka", "Ukum", "Ushongo", "Vandeikya" ] },
  { "name": "Borno", "cities": [ "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani" ] },
  { "name": "Cross River", "cities": [ "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biaase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala" ] },
  { "name": "Delta", "cities": [ "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West" ] },
  { "name": "Ebonyi", "cities": [ "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha" ] },
  { "name": "Edo", "cities": [ "Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde" ] },
  { "name": "Ekiti", "cities": [ "Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye" ] },
  { "name": "Enugu", "cities": [ "Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo-Uwani" ] },
  { "name": "FCT", "cities": [ "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council" ] },
  { "name": "Gombe", "cities": [ "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba" ] },
  { "name": "Imo", "cities": [ "Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo" ] },
  { "name": "Jigawa", "cities": [ "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi" ] },
  { "name": "Kaduna", "cities": [ "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Southern Kaduna", "Zangon Kataf", "Zaria" ] },
  { "name": "Kano", "cities": [ "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nassarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil" ] },
  { "name": "Katsina", "cities": [ "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin-Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango" ] },
  { "name": "Kebbi", "cities": [ "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru" ] },
  { "name": "Kogi", "cities": [ "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West" ] },
  { "name": "Kwara", "cities": [ "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi" ] },
  { "name": "Lagos", "cities": [ "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere" ] },
  { "name": "Nasarawa", "cities": [ "Akwanga", "Awe", "Doma", "Karima", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba" ] },
  { "name": "Niger", "cities": [ "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Muya", "Pailoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi" ] },
  { "name": "Ogun", "cities": [ "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu" ] },
  { "name": "Ondo", "cities": [ "Akoko North East", "Akoko North West", "Akoko South Akure East", "Akoko South West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo" ] },
  { "name": "Osun", "cities": [ "Aiyedade", "Aiyedire", "Atakumosa East", "Atakumosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo" ] },
  { "name": "Oyo", "cities": [ "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere" ] },
  { "name": "Plateau", "cities": [ "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase" ] },
  { "name": "Rivers", "cities": [ "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai" ] },
  { "name": "Sokoto", "cities": [ "Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Kware", "Kebbe", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo" ] },
  { "name": "Taraba", "cities": [ "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kauru", "Kurmi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing" ] },
  { "name": "Yobe", "cities": [ "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari" ] },
  { "name": "Zamfara", "cities": [ "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi" ] }
];


let submitButton = $('#submitBtn');

$(document).ready(function() {
    populateStateSelector(); // Initialize the State dropdown
    $('#state_area').on('change', handleStateChange); // Bind change event
    $('#reportForm').on('submit', handleFormSubmit); // Bind form submission
});

// =================================================================
// LOCATION DROPDOWN LOGIC
// =================================================================

function populateStateSelector() {
    const stateSelect = $('#state_area');
    stateSelect.find('option:not(:first)').remove(); // Clear existing options, keep "Select State"
    
    NIGERIA_LOCATIONS.forEach(state => {
        stateSelect.append(`<option value="${state.name}">${state.name}</option>`);
    });
}

function handleStateChange() {
    const selectedStateName = $('#state_area').val();
    populateLgaCitySelector(selectedStateName);
}

function populateLgaCitySelector(stateName) {
    const lgaSelect = $('#lga_city');
    lgaSelect.find('option:not(:first)').remove(); // Clear existing options
    lgaSelect.prop('disabled', true).addClass('bg-gray-50');

    if (stateName) {
        const stateData = NIGERIA_LOCATIONS.find(s => s.name === stateName);
        if (stateData) {
            stateData.cities.sort().forEach(city => {
                lgaSelect.append(`<option value="${city}">${city}</option>`);
            });
            lgaSelect.prop('disabled', false).removeClass('bg-gray-50');
        }
    }
}


// =================================================================
// FORM SUBMISSION LOGIC
// =================================================================

async function handleFormSubmit(e) {
    e.preventDefault();
    submitButton.prop('disabled', true).text('Submitting...');
    
    const form = e.target;
    const formData = new FormData(form);

    // CRITICAL: Ensure we are not sending map coordinates
    // We send state_area, lga_city, location_name, description, image, reporter_phone

    // Validation check (Basic client-side, server handles full validation)
    const imageFile = formData.get('image');
    if (!imageFile || imageFile.size === 0) {
        showStatusMessage('Please upload an image proof for the waste.', 'error');
        submitButton.prop('disabled', false).text('Submit Report and Alert Cleanup Team');
        return;
    }

    try {
        const response = await fetch(API_REPORTS_URL, {
            method: 'POST',
            // IMPORTANT: Do NOT set 'Content-Type' header here. 
            // The browser will automatically set the correct 'multipart/form-data' header,
            // including the boundary, for FormData objects.
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            showStatusMessage('Report submitted successfully! Thank you for helping keep our environment clean.', 'success');
            form.reset();
            // Reset the LGA dropdown manually
            populateLgaCitySelector('');
            // Optional: Visually confirm success and restore focus/style
            $('#state_area').val('');

        } else if (result.error) {
            // Server-side validation errors or other errors
            showStatusMessage(`Submission failed: ${result.error}`, 'error');
        } else {
             // Fallback for internal application errors where success: false is returned
            showStatusMessage(`Submission failed: An unexpected error occurred.`, 'error');
        }

    } catch (err) {
        console.error("Network Error:", err);
        showStatusMessage('A network error occurred. Could not connect to the server.', 'error');
    } finally {
        submitButton.prop('disabled', false).text('Submit Report and Alert Cleanup Team');
        hideStatusMessage(6000);
    }
}


// =================================================================
// UTILITIES (STATUS MESSAGE)
// =================================================================

let messageTimeout;

function showStatusMessage(text, type) {
    clearTimeout(messageTimeout);
    const messageDiv = $('#message');
    // Ensure fixed positioning is also responsive
    messageDiv.removeClass().addClass('fixed top-4 left-4 right-4 md:right-4 md:left-auto z-50 p-4 rounded-lg shadow-xl font-medium');
    
    if (type === 'success') {
        messageDiv.addClass('bg-green-100 text-green-700').html(`✅ ${text}`).show();
    } else if (type === 'error') {
        messageDiv.addClass('bg-red-100 text-red-700').html(`❌ ${text}`).show();
    } else { // info
        messageDiv.addClass('bg-blue-100 text-blue-700').html(`ℹ️ ${text}`).show();
    }
}

function hideStatusMessage(delay = 4000) {
    messageTimeout = setTimeout(() => {
        $('#message').fadeOut('slow');
    }, delay);
}
// Constants
const clinicsUrl = "https://cdn.jsdelivr.net/gh/g1tsh1t/hsdfbb2@main/clinics.json";

let map, userLocationMarker, clinicMarkers = [];
let clinicsData = [];

// Initialize Google Maps
function initMap() {
  map = new google.maps.Map(document.getElementById("contact-map"), {
    center: { lat: 51.509865, lng: -0.118092 }, // Default center (London)
    zoom: 10,
  });

  // Load clinic data and display markers
  loadClinicData();
}

// Initialize Google Places Autocomplete
function initAutocomplete() {
  const input = document.getElementById("address-input");
  const autocomplete = new google.maps.places.Autocomplete(input, { types: ["geocode"] });
}

// Load Clinic Data and Place Markers
function loadClinicData() {
  fetch(clinicsUrl)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch clinic data");
      return response.json();
    })
    .then(clinics => {
      clinicsData = clinics;
      clinics.forEach(clinic => {
        addClinicMarker(clinic);
      });
    })
    .catch(error => console.error("Error loading clinic data:", error));
}

// Add Clinic Markers
function addClinicMarker(clinic) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ placeId: clinic.place_id }, (results, status) => {
    if (status === "OK" && results[0]) {
      const clinicLocation = results[0].geometry.location;
const marker = new google.maps.marker.AdvancedMarkerElement({
  position: clinicLocation,
  map: map,
  title: clinic.name,
});

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <h3>${clinic.name}</h3>
          <p>${clinic.phone}</p>
          <ul>
            ${clinic.services
              .map(service => `<li><a href="${service.url}" target="_blank">${service.name}</a></li>`)
              .join("")}
          </ul>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      clinicMarkers.push(marker);
    }
  });
}

// Find Nearest Clinic
function findNearestClinic(userLocation) {
  const service = new google.maps.DistanceMatrixService();
  const destinations = clinicMarkers.map(marker => marker.getPosition());

  service.getDistanceMatrix(
    {
      origins: [userLocation],
      destinations: destinations,
      travelMode: "DRIVING",
    },
    (response, status) => {
      if (status === "OK") {
        const distances = response.rows[0].elements;
        let nearestClinicIndex = 0;
        let shortestDistance = distances[0].distance.value;

        distances.forEach((element, index) => {
          if (element.distance.value < shortestDistance) {
            shortestDistance = element.distance.value;
            nearestClinicIndex = index;
          }
        });

        const nearestClinicMarker = clinicMarkers[nearestClinicIndex];
        map.setCenter(nearestClinicMarker.getPosition());
        map.setZoom(14);

        new google.maps.InfoWindow({
          content: `
            <strong>Nearest Clinic:</strong><br>
            ${clinicsData[nearestClinicIndex].name}<br>
            Distance: ${distances[nearestClinicIndex].distance.text}
          `,
        }).open(map, nearestClinicMarker);
      }
    }
  );
}

// Handle User Search
function handleSearch() {
  const address = document.getElementById("address-input").value;
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: address }, (results, status) => {
    if (status === "OK" && results[0]) {
      const userLocation = results[0].geometry.location;

      // Add user marker
      if (userLocationMarker) userLocationMarker.setMap(null); // Remove previous marker
      userLocationMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        title: "Your Location",
      });

      // Center the map on user's location
      map.setCenter(userLocation);
      map.setZoom(12);

      // Find the nearest clinic
      findNearestClinic(userLocation);
    } else {
      alert("Unable to locate the address. Please try again.");
    }
  });
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-btn").addEventListener("click", handleSearch);
});

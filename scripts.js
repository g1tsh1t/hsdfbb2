// Declare global variables
let map;
let userLocationMarker;
let clinicMarkers = [];
const clinicsUrl = "https://cdn.jsdelivr.net/gh/g1tsh1t/hsdfbb2@main/clinics.json";

// Initialize the Google Map
function initMap() {
  // Ensure the map container exists
  const mapElement = document.getElementById("contact-map");
  if (!mapElement) {
    console.error("Map container element not found.");
    return;
  }

  // Initialize the map with default settings
  map = new google.maps.Map(mapElement, {
    center: { lat: 51.509865, lng: -0.118092 }, // Default center (London)
    zoom: 10,
  });

  console.log("Map initialized successfully.");

  // Load clinic data and add markers
  loadClinicData();
}

// Load clinic data from the JSON file and add markers
function loadClinicData() {
  fetch(clinicsUrl)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch clinic data");
      return response.json();
    })
    .then(clinics => {
      clinics.forEach(clinic => addClinicMarker(clinic));
    })
    .catch(error => console.error("Error loading clinic data:", error));
}

// Add a marker for each clinic
function addClinicMarker(clinic) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ placeId: clinic.place_id }, (results, status) => {
    if (status === "OK" && results[0] && results[0].geometry) {
      const clinicLocation = results[0].geometry.location;

      // Create an Advanced Marker for each clinic
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: clinicLocation,
        map: map,
        title: clinic.name,
      });

      // Add an info window with clinic details
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

      marker.addEventListener("click", () => {
        infoWindow.open(map, marker);
      });

      // Store the marker for later use
      clinicMarkers.push(marker);
    } else {
      console.error(`Failed to geocode clinic: ${clinic.name}`, status);
    }
  });
}

// Handle user search and find nearest clinic
function handleSearch() {
  const addressInput = document.getElementById("address-input");
  if (!addressInput) {
    console.error("Address input field not found.");
    return;
  }

  const address = addressInput.value;
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: address }, (results, status) => {
    if (status === "OK" && results[0] && results[0].geometry) {
      const userLocation = results[0].geometry.location;

      // Check if map is initialized
      if (map) {
        // Add user location marker
        if (userLocationMarker) userLocationMarker.map = null; // Clear previous marker
        userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: map,
          title: "Your Location",
        });

        // Center map on user location
        map.setCenter(userLocation);
        map.setZoom(12);

        // Find the nearest clinic
        findNearestClinic(userLocation);
      } else {
        console.error("Map is not initialized.");
      }
    } else {
      console.error("Geocoding failed:", status);
      alert("Could not locate the address. Please try again.");
    }
  });
}

// Find the nearest clinic to the user's location
function findNearestClinic(userLocation) {
  const service = new google.maps.DistanceMatrixService();
  const destinations = clinicMarkers.map(marker => marker.position);

  service.getDistanceMatrix(
    {
      origins: [userLocation],
      destinations: destinations,
      travelMode: "DRIVING",
    },
    (response, status) => {
      if (status === "OK") {
        const distances = response.rows[0].elements;
        let nearestIndex = 0;
        let shortestDistance = distances[0].distance.value;

        // Find the clinic with the shortest distance
        distances.forEach((element, index) => {
          if (element.distance.value < shortestDistance) {
            shortestDistance = element.distance.value;
            nearestIndex = index;
          }
        });

        // Highlight the nearest clinic
        const nearestClinicMarker = clinicMarkers[nearestIndex];
        map.setCenter(nearestClinicMarker.position);
        map.setZoom(14);

        new google.maps.InfoWindow({
          content: `
            <strong>Nearest Clinic:</strong><br>
            ${nearestClinicMarker.title}<br>
            Distance: ${distances[nearestIndex].distance.text}
          `,
        }).open(map, nearestClinicMarker);
      } else {
        console.error("Distance Matrix request failed:", status);
      }
    }
  );
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("search-btn");
  if (!searchButton) {
    console.error("Search button not found.");
    return;
  }

  searchButton.addEventListener("click", handleSearch);
});

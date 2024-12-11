// Initialize Map
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById("contact-map"), {
    center: { lat: 51.509865, lng: -0.118092 }, // Default center
    zoom: 10,
  });

  // Load clinic markers
  loadClinicData();
}

// Add Advanced Marker for Clinics
function addClinicMarker(clinic) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ placeId: clinic.place_id }, (results, status) => {
    if (status === "OK" && results[0] && results[0].geometry) {
      const clinicLocation = results[0].geometry.location;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: clinicLocation,
        map: map,
        title: clinic.name,
      });

      clinicMarkers.push(marker);
    } else {
      console.error(`Failed to geocode clinic place_id: ${clinic.place_id}`, status);
    }
  });
}

// Search and Center Map on User Location
function handleSearch() {
  const address = document.getElementById("address-input").value;
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: address }, (results, status) => {
    if (status === "OK" && results[0] && results[0].geometry) {
      const userLocation = results[0].geometry.location;

      if (map) {
        // Add User Marker
        if (userLocationMarker) userLocationMarker.map = null; // Clear previous marker
        userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: map,
          title: "Your Location",
        });

        // Center Map
        map.setCenter(userLocation);
        map.setZoom(12);
      } else {
        console.error("Map is not initialized");
      }
    } else {
      console.error("Unable to geocode user address:", status);
      alert("Address not found. Please try again.");
    }
  });
}

// Attach Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-btn").addEventListener("click", handleSearch);
});

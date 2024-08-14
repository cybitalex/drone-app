document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map').setView([35.15068793452444, -78.99763109627695], 11);

    // Default map selection URL
    var map_selection = localStorage.getItem("map_selection") || "https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}";
    
    L.tileLayer(map_selection, {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Store markers in a map for easy updating
    var aircraftMarkers = {};

    // Function to fetch and update aircraft data
    function updateAircraftData() {
        fetch('http://192.168.1.89/tar1090/data/aircraft.json')
          .then(response => response.json())
          .then(data => {
            console.log(data);

            data.aircraft
              .filter(aircraft => isValidLatLng(aircraft.lat, aircraft.lon))
              .forEach(aircraft => {
                var key = aircraft.hex; // Use a unique identifier for each aircraft
                var latLon = [aircraft.lat, aircraft.lon];
                
                if (aircraftMarkers[key]) {
                    // Update existing marker
                    aircraftMarkers[key].setLatLng(latLon);
                } else {
                    // Create new marker
                    var marker = L.marker(latLon)
                      .addTo(map)
                      .bindPopup(`<b>Altitude:</b> ${aircraft.alt_baro || 'N/A'} ft<br><b>Speed:</b> ${aircraft.gs || 'N/A'} knots`);
                    aircraftMarkers[key] = marker;
                }
              });

            // Remove markers that are no longer in the data
            Object.keys(aircraftMarkers).forEach(key => {
                if (!data.aircraft.some(aircraft => aircraft.hex === key)) {
                    map.removeLayer(aircraftMarkers[key]);
                    delete aircraftMarkers[key];
                }
            });
          })
          .catch(error => console.error('Error fetching aircraft data:', error));
    }

    // Initial fetch and set interval for periodic updates
    updateAircraftData();
    setInterval(updateAircraftData, 30000); // Refresh every 30 seconds

    // Get and display the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            // Add a danger zone circle to the map
            L.circle([lat, lon], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2,
                radius: 10000 // Radius in meters
            }).addTo(map);

            let current_location_marker = L.marker([lat, lon]).addTo(map);
            // Customize the marker icon for current location
            current_location_marker.setIcon(L.icon({
                iconUrl: 'assets/img/house_marker.png',
                iconSize: [25, 41],
                iconAnchor: [12.5, 41],
                popupAnchor: [0, -41]
            }));

            current_location_marker.bindPopup("Current Location" + " (" + MGRSString(lat, lon) + ")");

            map.setView([lat, lon], 9); // Center the map on the current location
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }

    // Function to add drones
    function addDrone(drone_id) {
        var drone = drones.find(d => d.drone_id === drone_id);
        var lat = drone.lat;
        var lon = drone.lon;
        var additional_info = drone.additional_info;
        var MGRS_cord = " (" + MGRSString(lat, lon) + ")";
        
        if (isValidLatLng(lat, lon)) {
            let marker = L.marker([lat, lon]) // Default marker
                          .addTo(map);
            marker.bindPopup(additional_info + MGRS_cord).openPopup();
            
            let drone_list_element = document.createElement("li");
            drone_list_element.id = "drone_" + drone_id;
            drone_list_element.onclick = function () {
                centerOnMap(drone);
            };
            drone_list_element.innerHTML = "<button>" + additional_info + "</button>";
            document.getElementById("drone_list").appendChild(drone_list_element);
        } else {
            console.error('Invalid LatLng object for drone:', drone);
        }
    }

    // Function to validate lat/lon
    function isValidLatLng(lat, lon) {
        return typeof lat === 'number' && typeof lon === 'number' && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    // Function to center map on drone location
    function centerOnMap(drone) {
        let drone_lat = drone.lat;
        let drone_lon = drone.lon;

        if (isValidLatLng(drone_lat, drone_lon)) {
            map.setView([drone_lat, drone_lon], 13);

            map.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {
                    if (layer.getLatLng().lat === drone_lat && layer.getLatLng().lng === drone_lon) {
                        layer.openPopup();
                    }
                }
            });
        }
    }
});

console.debug("%cLoaded map.js", 'color: #00ff00');

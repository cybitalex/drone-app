document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map').setView([35.15068793452444, -78.99763109627695], 11);

    // Default map selection URL
    var map_selection = localStorage.getItem("map_selection") || "https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}";

    var tileLayer = L.tileLayer(map_selection, {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Apply the CSS filter to the map tiles
    tileLayer.getContainer().style.filter = 'brightness(0.5)';  // Adjust the brightness as needed

    // Store markers in a map for easy updating
    var aircraftMarkers = {};
    var displayedUAVs = {}; // Track UAVs currently in the list

    // Function to update the UAV list in the sidebar
    function updateUAVList(aircraft) {
        var droneList = document.getElementById('drone_list');
        var key = aircraft.hex;
        if (!displayedUAVs[key]) {
            var listItem = document.createElement('li');
            // Shorten the displayed information for smaller screens
            listItem.textContent = `${aircraft.flight || 'N/A'}: ${aircraft.alt_baro || 'N/A'}ft, ${aircraft.gs || 'N/A'}kn`;
            listItem.id = key;

            // Event listener for hovering over the list item
            listItem.addEventListener('mouseenter', function() {
                var marker = aircraftMarkers[key];
                if (marker) {
                    var popupContent = `<b>Flight:</b> ${aircraft.flight || 'N/A'}<br><b>Altitude:</b> ${aircraft.alt_baro || 'N/A'} ft<br><b>Speed:</b> ${aircraft.gs || 'N/A'} knots<br><b>Lat:</b> ${aircraft.lat}<br><b>Lon:</b> ${aircraft.lon}`;
                    marker.openPopup();
                    marker.setPopupContent(popupContent);
                }
            });

            // Hide the popup when the mouse leaves the list item
            listItem.addEventListener('mouseleave', function() {
                var marker = aircraftMarkers[key];
                if (marker) {
                    marker.closePopup();
                }
            });

            // Center the map on the selected UAV and copy MGRS coordinates to clipboard
            listItem.addEventListener('click', function() {
                map.setView([aircraft.lat, aircraft.lon], 13);
                var mgrsCoord = MGRSString(aircraft.lat, aircraft.lon); // Replace with your MGRS conversion function
                navigator.clipboard.writeText(mgrsCoord);
                alert(`MGRS Coordinates copied to clipboard: ${mgrsCoord}`);
            });

            droneList.appendChild(listItem);
            displayedUAVs[key] = listItem;
        }
    }

    // Function to remove outdated UAVs from the list
    function removeOutdatedUAVs(currentUAVs) {
        Object.keys(displayedUAVs).forEach(key => {
            if (!currentUAVs[key]) {
                var listItem = displayedUAVs[key];
                listItem.remove(); // Remove the UAV from the list
                delete displayedUAVs[key]; // Remove it from the tracked UAVs
            }
        });
    }
    // Define icons for different types of airplanes
    var icons = {
        plane: L.icon({
            iconUrl: 'assets/img/plane.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        jet: L.icon({
            iconUrl: 'assets/img/military.jet.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        helicopter: L.icon({
            iconUrl: 'assets/img/military.helicopter.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        vtol: L.icon({
            iconUrl: 'assets/img/military.vtol.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        bomber: L.icon({
            iconUrl: 'assets/img/military.bomber.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        hotairballoon: L.icon({
            iconUrl: 'assets/img/military.hotairballoon.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
        airplane: L.icon({
            iconUrl: 'assets/img/military.airplane.png',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        }),
    };

    // Function to determine the aircraft type
    function determineAircraftType(aircraft) {
        if (aircraft.category === "A1") {
            return 'plane'; //light aircraft 
        } else if (aircraft.category === "A2") { // small aircraft 
            return 'plane';
        } else if (aircraft.category === "A3") { // large aircraft 
            return 'airplane';
        } else if (aircraft.category === "A4") { // High vortex large
            return 'bomber';
        } else if (aircraft.category === "A6") { // High Perfromance 
            return 'jet';
        } else if (aircraft.category === "A7") { // Rotorcraft
            return 'helicopter';
        } else if (aircraft.category === "N/A") {
            return 'airplane'; 
        } else if (aircraft.category === "B6") { // UAV
            return 'favicon';
        } else if (aircraft.category === "B2") { // Balloon
            return 'hotairballoon';
        } else if (aircraft.category === "B1"){ //glider 
            return 'glider'
        } else {
            return 'unknown'; 
        }
    }
    

    function addOrUpdateMarker(aircraft) {
        var key = aircraft.hex;
        var latLon = [aircraft.lat, aircraft.lon];
        var type = determineAircraftType(aircraft);

        var rotationAngle = aircraft.track || 0; // Use the aircraft's heading (track) or default to 0 if not available

        // Create a custom icon with rotation
        var icon = L.divIcon({
            html: `<div style="transform: rotate(${rotationAngle}deg);"><img src="${icons[type].options.iconUrl}" style="width: ${icons[type].options.iconSize[0]}px; height: ${icons[type].options.iconSize[1]}px; background: none;"></div>`,
            iconSize: icons[type].options.iconSize,
            iconAnchor: icons[type].options.iconAnchor,
            popupAnchor: icons[type].options.popupAnchor,
            className: '' // Remove the default class to avoid additional styling
        });

        if (aircraftMarkers[key]) {
            aircraftMarkers[key].setLatLng(latLon);
            aircraftMarkers[key].setIcon(icon);
        } else {
            var marker = L.marker(latLon, {icon: icon})
                .addTo(map)
                .bindPopup('');
            aircraftMarkers[key] = marker;

            // Update the UAV list
            updateUAVList(aircraft);
        }

        // Check if the aircraft is inside the danger zone
        if (dangerZone && dangerZone.getBounds().contains(latLon)) {
            showWarningAlert(aircraft);
        }
    }
    

    


    // Function to fetch and update aircraft data
    function updateAircraftData() {
        fetch('https://aircraft.wiedenterprise.com/tar1090/data/aircraft.json')
            .then(response => response.json())
            .then(data => {
                var currentUAVs = {}; // Track the current UAVs being processed

                data.aircraft.forEach(aircraft => {
                    if (isValidLatLng(aircraft.lat, aircraft.lon)) {
                        currentUAVs[aircraft.hex] = aircraft; // Add to current UAVs
                        addOrUpdateMarker(aircraft);
                    }
                });

                removeOutdatedUAVs(currentUAVs); // Remove UAVs that are no longer detected

                // Remove markers that are no longer in the data
                Object.keys(aircraftMarkers).forEach(key => {
                    if (!currentUAVs[key]) {
                        map.removeLayer(aircraftMarkers[key]);
                        delete aircraftMarkers[key];
                    }
                });
            })
            .catch(error => console.error('Error fetching aircraft data:', error));
    }

    // Initial fetch and set interval for periodic updates
    updateAircraftData();
    setInterval(updateAircraftData, 10000); // Refresh every 30 seconds

    // Geolocation to get and display the user's current location
    let userLocation;
    let dangerZone;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            userLocation = [lat, lon];

            // Add a danger zone circle to the map
            dangerZone = L.circle([lat, lon], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2,
                radius: 16083 // Radius in meters
            }).addTo(map);

            let current_location_marker = L.marker([lat, lon]).addTo(map);
            // Customize the marker icon for current location
            current_location_marker.setIcon(L.icon({
                iconUrl: 'assets/img/house.marker.png',
                iconSize: [25, 41],
                iconAnchor: [12.5, 41],
                popupAnchor: [0, -41]
            }));

            current_location_marker.bindPopup("Current Location" + " (" + MGRSString(lat, lon) + ")");

            map.setView([lat, lon], 9); // Center the map on the current location

            // Add this line to create a fake aircraft after a short delay
            setTimeout(addFakeAircraft, 2000);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }

    // Function to validate lat/lon
    function isValidLatLng(lat, lon) {
        return typeof lat === 'number' && typeof lon === 'number' && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    // Add this function at the beginning of the file
    function focusOnAirplane(icao24) {
        const airplane = airplanes.find(a => a.icao24 === icao24);
        if (airplane) {
            map.setView([airplane.lat, airplane.lon], 12);
            const marker = airplaneMarkers.get(icao24);
            if (marker) {
                marker.openPopup();
            }
        }
    }

    // Modify the updateDroneList function
    function updateDroneList() {
        const droneList = document.getElementById('drone_list');
        droneList.innerHTML = '';
        airplanes.forEach(airplane => {
            const li = document.createElement('li');
            li.textContent = `${airplane.callsign || 'N/A'} (${airplane.icao24})`;
            li.setAttribute('data-icao24', airplane.icao24);
            li.addEventListener('click', () => focusOnAirplane(airplane.icao24));
            droneList.appendChild(li);
        });
    }

    // In the updateMap function, modify the marker creation:
    const marker = L.marker([airplane.lat, airplane.lon], { icon: airplaneIcon }).addTo(map);
    marker.bindPopup(`Callsign: ${airplane.callsign || 'N/A'}<br>ICAO24: ${airplane.icao24}<br>Altitude: ${airplane.altitude} m`);
    airplaneMarkers.set(airplane.icao24, marker);

    // Add these new functions
    function showWarningPopup() {
        if (popupMessage) {
            popupMessage.style.display = 'block';
            // Hide the message after 5 seconds
            setTimeout(hideWarningPopup, 5000);
        }
    }

    function hideWarningPopup() {
        if (popupMessage) {
            popupMessage.style.display = 'none';
        }
    }

    function showWarningAlert(aircraft) {
        alert(`Aircraft detected close to your position!\nFlight: ${aircraft.flight || 'N/A'}\nAltitude: ${aircraft.alt_baro || 'N/A'} ft\nSpeed: ${aircraft.gs || 'N/A'} knots`);
    }

    // Add this function near the top of your file, after the document.addEventListener('DOMContentLoaded', function () { ... line
    function addFakeAircraft() {
        if (userLocation && dangerZone) {
            // Generate a random position within the danger zone
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.sqrt(Math.random()) * dangerZone.getRadius();
            const x = userLocation[0] + (radius * Math.cos(angle) / 111111);
            const y = userLocation[1] + (radius * Math.sin(angle) / (111111 * Math.cos(userLocation[0] * Math.PI / 180)));

            const fakeAircraft = {
                hex: 'FAKE01',
                flight: 'TEST123',
                lat: x,
                lon: y,
                alt_baro: Math.floor(Math.random() * 10000) + 1000,
                gs: Math.floor(Math.random() * 500) + 100,
                category: 'A1'
            };

            addOrUpdateMarker(fakeAircraft);
            showWarningAlert(fakeAircraft);
        }
    }
});

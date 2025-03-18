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

    // Create notification container if it doesn't exist
    var notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Function to show in-app notification instead of alert
    function showNotification(type, title, message, duration = 3000) {
        var notification = document.createElement('div');
        notification.className = 'notification ' + type;
        
        var content = document.createElement('div');
        content.className = 'notification-content';
        
        var titleElement = document.createElement('div');
        titleElement.className = 'notification-title';
        titleElement.textContent = title;
        
        var messageElement = document.createElement('div');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        
        content.appendChild(titleElement);
        content.appendChild(messageElement);
        notification.appendChild(content);
        
        notificationContainer.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(function() {
            notification.classList.add('hiding');
            setTimeout(function() {
                notification.remove();
            }, 200);
        }, duration);
    }

    // Function to determine threat level based on aircraft behavior
    function determineThreatLevel(aircraft) {
        // Military or unidentified aircraft (no flight/callsign info)
        if (!aircraft.flight || aircraft.flight.trim() === '' || 
            aircraft.flight.includes('MIL') || 
            aircraft.flight.includes('RCH') || 
            aircraft.flight.includes('DRACO') ||
            aircraft.category === "A6" || // High performance
            aircraft.category === "A4") { // High vortex large
            return 'medium';
        }
        
        // Erratic behavior or violating airspace (near danger zone with high speed or low altitude)
        if (aircraft.gs > 450 || // Very high speed (knots)
            (aircraft.alt_baro && aircraft.alt_baro < 1000) || // Very low altitude
            (dangerZone && 
             aircraft.lat && aircraft.lon && 
             dangerZone.getBounds().contains([aircraft.lat, aircraft.lon]))) {
            return 'high';
        }
        
        // Normal commercial flights
        return 'low';
    }

    // Function to update the UAV list in the sidebar
    function updateUAVList(aircraft, isCached = false) {
        var droneList = document.getElementById('drone_list');
        var key = aircraft.hex;
        if (!displayedUAVs[key]) {
            var threatLevel = determineThreatLevel(aircraft);
            
            var listItem = document.createElement('li');
            
            // Add threat level indicator
            var threatIndicator = document.createElement('span');
            threatIndicator.className = `threat-level threat-level-${threatLevel}`;
            listItem.appendChild(threatIndicator);
            
            // Add text content
            var textSpan = document.createElement('span');
            textSpan.textContent = `${aircraft.flight || 'N/A'}: ${aircraft.alt_baro || 'N/A'}ft, ${aircraft.gs || 'N/A'}kn`;
            if (isCached) {
                textSpan.textContent += ' (C)';
                textSpan.style.opacity = '0.7';
            }
            listItem.appendChild(textSpan);
            
            listItem.id = key;
            listItem.dataset.threatLevel = threatLevel;

            // Event listener for hovering over the list item
            listItem.addEventListener('mouseenter', function() {
                var marker = aircraftMarkers[key];
                if (marker) {
                    var popupContent = `<b>Flight:</b> ${aircraft.flight || 'N/A'}<br><b>Altitude:</b> ${aircraft.alt_baro || 'N/A'} ft<br><b>Speed:</b> ${aircraft.gs || 'N/A'} knots<br><b>Lat:</b> ${aircraft.lat}<br><b>Lon:</b> ${aircraft.lon}<br><b>Threat:</b> ${threatLevel.toUpperCase()}`;
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
                showNotification('info', 'Coordinates Copied', `MGRS: ${mgrsCoord}`);
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
    

    function addOrUpdateMarker(aircraft, isCached = false) {
        var key = aircraft.hex;
        var latLon = [aircraft.lat, aircraft.lon];
        var type = determineAircraftType(aircraft);
        var threatLevel = determineThreatLevel(aircraft);
        var rotationAngle = aircraft.track || 0;

        // Create marker with threat level ring
        var icon = L.divIcon({
            html: `
                <div class="threat-ring-${threatLevel}" style="width: 40px; height: 40px; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(${rotationAngle}deg);">
                        <img src="${icons[type].options.iconUrl}" style="width: ${icons[type].options.iconSize[0]}px; height: ${icons[type].options.iconSize[1]}px; background: none;">
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: isCached ? `cached-aircraft threat-${threatLevel}` : `threat-${threatLevel}`
        });

        if (aircraftMarkers[key]) {
            aircraftMarkers[key].setLatLng(latLon);
            aircraftMarkers[key].setIcon(icon);
        } else {
            var marker = L.marker(latLon, {icon: icon})
                .addTo(map)
                .bindPopup('');
            aircraftMarkers[key] = marker;

            updateUAVList(aircraft, isCached);
        }

        // Show warning for high threat aircraft
        if (threatLevel === 'high' && !isCached) {
            showThreatNotification(aircraft);
        } else if (dangerZone && dangerZone.getBounds().contains(latLon) && !isCached) {
            showWarningNotification(aircraft);
        }
    }
    
    // Function to show warning notification for aircraft in danger zone
    function showWarningNotification(aircraft) {
        var title = 'Aircraft in Proximity';
        var message = `${aircraft.flight || 'N/A'}: ${aircraft.alt_baro || 'N/A'}ft, ${aircraft.gs || 'N/A'}kn`;
        showNotification('warning', title, message, 5000);
    }

    // Function to show threat notification for high-threat aircraft
    function showThreatNotification(aircraft) {
        var title = 'HIGH THREAT DETECTED';
        var message = `${aircraft.flight || 'UNKNOWN'}: ${aircraft.alt_baro || 'N/A'}ft, ${aircraft.gs || 'N/A'}kn`;
        var notification = document.createElement('div');
        notification.className = 'notification threat-high';
        
        var content = document.createElement('div');
        content.className = 'notification-content';
        
        var titleElement = document.createElement('div');
        titleElement.className = 'notification-title';
        titleElement.textContent = title;
        
        var messageElement = document.createElement('div');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        
        content.appendChild(titleElement);
        content.appendChild(messageElement);
        notification.appendChild(content);
        
        notificationContainer.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(function() {
            notification.classList.add('hiding');
            setTimeout(function() {
                notification.remove();
            }, 200);
        }, 7000);
    }

    // Function to fetch and update aircraft data
    function updateAircraftData() {
        fetch('https://aircraft.wiedenterprise.com/tar1090/data/aircraft.json')
            .then(response => response.json())
            .then(data => {
                var currentUAVs = {};
                let validAircraftCount = 0;

                data.aircraft.forEach(aircraft => {
                    if (isValidLatLng(aircraft.lat, aircraft.lon)) {
                        currentUAVs[aircraft.hex] = aircraft;
                        addOrUpdateMarker(aircraft);
                        validAircraftCount++;
                    }
                });

                // Update the counter with the number of valid aircraft
                updateAircraftCounter(validAircraftCount);

                removeOutdatedUAVs(currentUAVs);

                Object.keys(aircraftMarkers).forEach(key => {
                    if (!currentUAVs[key]) {
                        map.removeLayer(aircraftMarkers[key]);
                        delete aircraftMarkers[key];
                    }
                });

                localStorage.setItem('cachedAircraftData', JSON.stringify(cachedAircraftData));
            })
            .catch(error => console.error('Error fetching aircraft data:', error));
    }

    // Initial fetch and set interval for periodic updates
    updateAircraftData();
    setInterval(updateAircraftData, 10000); // Refresh every 10 seconds

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

    // Add these variables at the beginning of your file
    let cachedAircraftData = {};

    // Add this function to load cached data
    function loadCachedData() {
        const cachedData = localStorage.getItem('cachedAircraftData');
        if (cachedData) {
            cachedAircraftData = JSON.parse(cachedData);
            
            // Display cached aircraft on the map
            Object.values(cachedAircraftData).forEach(item => {
                if (Date.now() - item.lastSeen < 24 * 60 * 60 * 1000) { // Only show aircraft seen in the last 24 hours
                    addOrUpdateMarker(item.data, true);
                }
            });
        }
    }

    // Call loadCachedData at the beginning of your script
    loadCachedData();

    // Function to update the aircraft counter with the number of valid aircraft
    function updateAircraftCounter(count) {
        var counterElement = document.getElementById('number_UAV_detected');
        if (counterElement) {
            // Save the previous count to check for changes
            var prevCount = parseInt(counterElement.textContent) || 0;
            
            // Update the count
            counterElement.textContent = count;
            
            // If the count has changed, add the pulsing class
            if (count !== prevCount) {
                // Remove the class first to reset animation if already active
                counterElement.classList.remove('new-detection');
                
                // Force a reflow
                void counterElement.offsetWidth;
                
                // Add the class to trigger animation
                counterElement.classList.add('new-detection');
                
                // Remove the class after animation completes (3 seconds)
                setTimeout(function() {
                    counterElement.classList.remove('new-detection');
                }, 3000);
            }
        }
    }
});

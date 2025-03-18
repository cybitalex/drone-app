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
    var aircraftPaths = {}; // Store path history for each aircraft
    var aircraftPredictions = {}; // Store prediction paths

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
            aircraft.category === "A4") {
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
                
                // Remove path history and prediction
                if (aircraftPaths[key] && aircraftPaths[key].path) {
                    map.removeLayer(aircraftPaths[key].path);
                    delete aircraftPaths[key];
                }
                
                if (aircraftPredictions[key] && aircraftPredictions[key].path) {
                    map.removeLayer(aircraftPredictions[key].path);
                    delete aircraftPredictions[key];
                }
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

        // Create modern styled marker with threat-based effects
        var icon = L.divIcon({
            html: `
                <div class="threat-ring-${threatLevel}" style="width: 50px; height: 50px; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(${rotationAngle}deg);">
                        <svg class="aircraft-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="#000" stroke-width="0.5">
                            ${getAircraftSvgPath(type)}
                        </svg>
                    </div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
            popupAnchor: [0, -25],
            className: isCached ? `cached-aircraft threat-${threatLevel}` : `threat-${threatLevel}`
        });

        // Update or create marker
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

        // Update path history (only for live aircraft, not cached)
        if (!isCached) {
            updateAircraftPath(key, latLon, aircraft);
        }

        // Show warning for high threat aircraft
        if (threatLevel === 'high' && !isCached) {
            showThreatNotification(aircraft);
        } else if (dangerZone && dangerZone.getBounds().contains(latLon) && !isCached) {
            showWarningNotification(aircraft);
        }
    }
    
    // Function to get SVG path based on aircraft type
    function getAircraftSvgPath(type) {
        switch(type) {
            case 'plane':
                // Light aircraft - more recognizable top-down view
                return '<path d="M12,2l-1,6l-7,3l-2,2l9,2l0,6l-3,1l0,1l4,1l4-1l0-1l-3-1l0-6l9-2l-2-2l-7-3z"/>';
            case 'jet':
                // Fighter jet - sleek design
                return '<path d="M12,2l-1.5,9h-6l-2.5,2h4l-2,5v2l3-1l2-2l2,2l3,1v-2l-2-5h4l-2.5-2h-6z"/>';
            case 'bomber':
                // Bomber with distinct wings
                return '<path d="M12,2l-2,4l-6,2l-1,2l5,1l-0.5,6l-1.5,2v2l4-1l2-2l2,2l4,1v-2l-1.5-2l-0.5-6l5-1l-1-2l-6-2z"/>';
            case 'helicopter':
                // Helicopter from top view with rotor
                return '<path d="M8,12c0,0-4-0.5-4-2.5s4-2.5,4-2.5v-1h8v1c0,0,4,0.5,4,2.5s-4,2.5-4,2.5v4c0,0.5-0.5,1-1,1h-6c-0.5,0-1-0.5-1-1V12z"/><path d="M2,9.5h20M2,9.5h20" stroke="white" stroke-width="0.7"/>';
            case 'hotairballoon':
                // More recognizable balloon
                return '<path d="M12,2c-3.3,0-6,2.7-6,6c0,3,2,4.3,3,6v4c0,1.1,0.9,2,2,2h2c1.1,0,2-0.9,2-2v-4c1-1.7,3-3,3-6C18,4.7,15.3,2,12,2z"/>';
            case 'airplane':
            default:
                // Commercial airliner top-down view
                return '<path d="M12,2l-2,9l-8,3v2l8,2v3l-3,1v1l5,1l5-1v-1l-3-1v-3l8-2v-2l-8-3z"/>';
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

    // Track ghost trails visibility
    var showGhostTrails = true;
    
    // Set up trail toggle button
    var trailToggleButton = document.getElementById('toggle-trails');
    if (trailToggleButton) {
        trailToggleButton.classList.add('active'); // Active by default
        
        trailToggleButton.addEventListener('click', function() {
            showGhostTrails = !showGhostTrails;
            toggleGhostTrails(showGhostTrails);
            
            // Update button state
            if (showGhostTrails) {
                trailToggleButton.classList.add('active');
            } else {
                trailToggleButton.classList.remove('active');
            }
        });
        
        // Add info button next to toggle
        var infoButton = document.createElement('button');
        infoButton.className = 'control-button info-button';
        infoButton.innerHTML = '<span class="control-icon">ℹ️</span><span class="control-text">Info</span>';
        infoButton.addEventListener('click', function() {
            openTrailsInfoModal();
            
            // Ensure close button works by directly targeting it after modal opens
            setTimeout(function() {
                var closeModalBtn = document.querySelector('#trails-info-modal .close-modal');
                if (closeModalBtn) {
                    closeModalBtn.onclick = function() {
                        document.getElementById('trails-info-modal').style.display = 'none';
                    };
                }
            }, 100);
        });
        
        // Add to controls
        var mapControls = document.querySelector('.map-controls');
        if (mapControls) {
            mapControls.appendChild(infoButton);
        }
    }
    
    // Function to toggle visibility of all ghost trails
    function toggleGhostTrails(visible) {
        // Toggle history paths
        Object.keys(aircraftPaths).forEach(key => {
            if (aircraftPaths[key] && aircraftPaths[key].path) {
                if (visible) {
                    aircraftPaths[key].path.addTo(map);
                } else {
                    map.removeLayer(aircraftPaths[key].path);
                }
            }
        });
        
        // Toggle prediction paths
        Object.keys(aircraftPredictions).forEach(key => {
            if (aircraftPredictions[key] && aircraftPredictions[key].path) {
                if (visible) {
                    aircraftPredictions[key].path.addTo(map);
                } else {
                    map.removeLayer(aircraftPredictions[key].path);
                }
            }
        });
    }

    // Update these functions to respect the trails visibility setting
    function updateAircraftPath(key, position, aircraft) {
        // Initialize path array if it doesn't exist
        if (!aircraftPaths[key]) {
            aircraftPaths[key] = {
                positions: [],
                polyline: null,
                lastUpdate: Date.now(),
                path: L.polyline([], {
                    color: getThreatColor(determineThreatLevel(aircraft)),
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '5, 5',
                    className: 'aircraft-path'
                })
            };
            
            // Only add to map if ghost trails are enabled
            if (showGhostTrails) {
                aircraftPaths[key].path.addTo(map);
            }
        }
        
        // Add current position to path history, limit to 10 positions for performance
        aircraftPaths[key].positions.push(position);
        if (aircraftPaths[key].positions.length > 10) {
            aircraftPaths[key].positions.shift();
        }
        
        // Update the polyline with new positions
        aircraftPaths[key].path.setLatLngs(aircraftPaths[key].positions);
        aircraftPaths[key].lastUpdate = Date.now();
        
        // Update the prediction path if we have speed and direction
        if (aircraft.gs && (aircraft.track !== undefined)) {
            updatePredictionPath(key, position, aircraft);
        }
    }

    function updatePredictionPath(key, currentPosition, aircraft) {
        // Remove old prediction path if exists
        if (aircraftPredictions[key] && aircraftPredictions[key].path) {
            map.removeLayer(aircraftPredictions[key].path);
        }
        
        // Calculate prediction points based on current position, speed and heading
        var predictionPoints = calculatePredictionPoints(currentPosition, aircraft.gs, aircraft.track);
        
        // Create new prediction path with adjusted styling based on threat level
        var threatLevel = determineThreatLevel(aircraft);
        var predictionWeight = 2;
        var predictionOpacity = 0.6;
        
        // Adjust styling based on threat level for better visibility
        if (threatLevel === 'medium') {
            predictionWeight = 3;
            predictionOpacity = 0.7;
        } else if (threatLevel === 'high') {
            predictionWeight = 3;
            predictionOpacity = 0.8;
        }
        
        var predictionPath = L.polyline(predictionPoints, {
            color: getThreatColor(threatLevel),
            weight: predictionWeight,
            opacity: predictionOpacity,
            dashArray: '3, 7',
            className: 'prediction-path threat-' + threatLevel + '-prediction'
        });
        
        // Only add to map if ghost trails are enabled
        if (showGhostTrails) {
            predictionPath.addTo(map);
        }
        
        // Store the prediction path
        aircraftPredictions[key] = {
            path: predictionPath,
            lastUpdate: Date.now()
        };
    }

    // Calculate prediction points based on current position, speed and heading
    function calculatePredictionPoints(currentPosition, speed, heading) {
        var points = [currentPosition];
        var lat = currentPosition[0];
        var lon = currentPosition[1];
        var speedMps = speed * 0.51444; // Convert knots to m/s
        
        // Create 5 prediction points at 1-minute intervals
        for (var i = 1; i <= 5; i++) {
            // Calculate distance traveled in 1 minute
            var distance = speedMps * 60 * i; // distance in meters for i minutes
            
            // Calculate new position based on bearing and distance
            var newPosition = calculateDestination(lat, lon, heading, distance);
            points.push(newPosition);
        }
        
        return points;
    }

    // Calculate destination point given starting point, bearing, and distance
    function calculateDestination(lat, lon, bearing, distance) {
        // Earth's radius in meters
        var R = 6371000;
        
        // Convert to radians
        var lat1 = lat * Math.PI / 180;
        var lon1 = lon * Math.PI / 180;
        var brng = bearing * Math.PI / 180;
        
        // Calculate new latitude
        var lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(distance/R) + 
            Math.cos(lat1) * Math.sin(distance/R) * Math.cos(brng)
        );
        
        // Calculate new longitude
        var lon2 = lon1 + Math.atan2(
            Math.sin(brng) * Math.sin(distance/R) * Math.cos(lat1),
            Math.cos(distance/R) - Math.sin(lat1) * Math.sin(lat2)
        );
        
        // Convert back to degrees
        lat2 = lat2 * 180 / Math.PI;
        lon2 = lon2 * 180 / Math.PI;
        
        return [lat2, lon2];
    }

    // Function to get color based on threat level
    function getThreatColor(threatLevel) {
        switch(threatLevel) {
            case 'high':
                return '#ff3131'; // Brighter red
            case 'medium':
                return '#ffcc00'; // Brighter yellow
            case 'low':
                return '#2ecc71'; // Green
            default:
                return '#3498db'; // Blue
        }
    }

    // Modal functionality
    function openTrailsInfoModal() {
        var modal = document.getElementById('trails-info-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Set up modal close functionality
    var closeButtons = document.getElementsByClassName('close-modal');
    for (var i = 0; i < closeButtons.length; i++) {
        closeButtons[i].addEventListener('click', function() {
            var modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        var modals = document.getElementsByClassName('modal');
        for (var i = 0; i < modals.length; i++) {
            if (event.target === modals[i]) {
                modals[i].style.display = 'none';
            }
        }
    });
});

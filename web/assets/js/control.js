// If the user has not selected a theme, set the default theme to "https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}"
if (localStorage.getItem("map_selection") === null) {
	// Set default map to https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}
	localStorage.setItem("map_selection", "https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}");
} else {
	var map_selection = localStorage.getItem("map_selection");
}



// Get the theme from local storage
var theme = localStorage.getItem("theme");
console.info("Theme: " + theme);
if (theme) {
	// Add the theme stylesheet to the head
	var link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = "assets/style/themes/" + theme + ".css";

	try {
		document.head.appendChild(link);
		console.debug("%cLoaded " + link.href , 'color: #00ff00');
	} catch (e) {
		console.error(e);	
	};
}

// Get the font size from local storage
var font_size = localStorage.getItem("font_size");
if (font_size) {
	// Add the font size stylesheet to the head
	var link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = "assets/style/" + font_size + ".css";

	try {
		document.head.appendChild(link);
		console.debug("%cLoaded " + link.href , 'color: #00ff00');
	} catch (e) {
		console.error(e);	
	};
};


console.debug("%cLoaded user preference theme: " + theme, 'color: #00ff00');
console.debug("%cLoaded user preference map: " + map_selection, 'color: #00ff00');
console.debug("%cLoaded user preference font size: " + font_size, 'color: #00ff00');
console.debug("%cLoaded control.js", 'color: #00ff00');
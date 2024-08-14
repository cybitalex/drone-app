
// This will be replaced with an API call to the RPI.
// (GET request to /api/system_status).See /docs/API.md for more information.
let system_status = "Online";


// Online (green, bootstrap: success)
// Degraded (orange, bootstrap: warning)
// Error (red, bootstrap: danger)
// Offline (black, bootstrap: secondary)


let system_status_indicator = document.getElementById("system_status");

switch (system_status) {
	case "Online":
		system_status_indicator.classList.add("online");
		system_status_indicator.classList.add("badge");
		system_status_indicator.classList.add("text-bg-success");
		system_status_indicator.innerText = "Online";
		break;
	case "Degraded":
		system_status_indicator.classList.add("degraded");
		system_status_indicator.classList.add("badge");
		system_status_indicator.classList.add("text-bg-warning");
		system_status_indicator.innerText = "Degraded";
		console.warn("System status is degraded. Please see: " + window.location.origin + "/web/status.html for more information.");
		break;
	case "Error":
		system_status_indicator.classList.add("error");
		system_status_indicator.classList.add("badge");
		system_status_indicator.classList.add("text-bg-danger");
		system_status_indicator.innerText = "Error";
		break;
	case "Offline":
		system_status_indicator.classList.add("offline");
		system_status_indicator.classList.add("badge");
		system_status_indicator.classList.add("text-bg-secondary");
		system_status_indicator.innerText = "Offline";
		break;
	// Default to offline if the system status is not recognized.
	default:
		system_status_indicator.classList.add("error");
		system_status_indicator.classList.add("badge");
		system_status_indicator.classList.add("text-bg-danger");
		system_status_indicator.innerText = "Error";
		break;
}


console.debug("%cLoaded status.js", 'color: #00ff00');
console.info("%cSystem status: " + system_status, 'color: #00ff00');
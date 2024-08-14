/*
IF A PAGE REQUIRES THE USER TO BE LOGGED IN, ADD THIS SCRIPT TO THE TOP OF THE HEAD TAG IN THE HTML FILE.
*/




// Check to see if the user is already logged in. If they are, redirect them to the index page.
// Obviously this is for a demo. Eventually switch from sessionStorage to a proper authentication system and a server-side session.
if (sessionStorage.getItem("logged_in") !== "true") {
	console.error("User is not logged in. Redirecting to login page.", 'color: #ff0000');
	// redirect the user to the login page
	window.location.href = "login.html?redirected=true&reason=not_logged_in";
} else {
	console.info("%cUser is logged in.", 'color: #00ff00');
	// Logout button functionality
	document.getElementById("logout_button").addEventListener("click", function () {
		console.log("%cLogging out...", 'color: #00ff00');
		// Prompt the user to confirm that they want to log out
		if (!confirm("Are you sure you want to log out?")) {
			return;
		}
		sessionStorage.setItem("logged_in", "false");
		window.location.href = "login.html?redirected=true&reason=logged_out";
	});
}


console.debug("%cLoaded require_login.js", 'color: #00ff00');


// https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
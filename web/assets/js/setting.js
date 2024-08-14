// For touch-screen devices, we need to add a touch event listener to the theme changer since the hover event won't work.

var theme_change_button = document.getElementById("theme_change_button");

theme_change_button.addEventListener("click", function () {
	// Display the theme change dropdown menu
	document.getElementById("theme_change_dropdown").style.display = "block";
	console.log("Theme change dropdown menu displayed.");
});


// Close the dropdown menu if the user clicks anywhere in the window but the button
window.addEventListener("click", function (event) {
	if (!event.target.matches(".theme_chooser_dropdown")) {
		var dropdowns = document.getElementsByClassName("theme_chooser_dropdown");
		var i;

		for (i = 0; i < dropdowns.length; i++) {
			var openDropdown = dropdowns[i];

			if (openDropdown.style.display === "block") {
				openDropdown.style.display = "none";
			}
		}
	}
});


// Set the current theme
current_theme = localStorage.getItem("theme");

// Default to light theme
if (current_theme == null || current_theme == "") {
	current_theme = "light";
}

var light = document.getElementById("light");
// Listen for theme changes
light.addEventListener("click", function () {
	console.info("Setting theme to light");
	localStorage.setItem("theme", "light");
	location.reload();
});

var dark = document.getElementById("dark");
dark.addEventListener("click", function () {
	console.info("Setting theme to dark");
	localStorage.setItem("theme", "dark");
	location.reload();
});

var nvg = document.getElementById("nvg");
nvg.addEventListener("click", function () {
	console.info("Setting theme to nvg");
	localStorage.setItem("theme", "nvg");
	location.reload();
});
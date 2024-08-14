# Page Layout & Composition

## Header

- Include your normal `<meta>` tags. We don't need a `robots.txt` file because this is a closed system. We don't need a description or keywords, for the same reason. Don't include them.
- Title the page using the format `Drone Scanner &raquo; <Page Name>`. *Example: `Drone Scanner » Home`*
- Include the favicon next ([favicon.png](/web/assets/img/favicon.png)).
- Do you need to do calculations or convert between formats? If yes, include [functions.js](/web/assets/js/functions.js) at the next so they can be used in other files.
- Include Bootstrap next

## Page Content

- `<header>` tag containing the buttons (as tabs) to navigate between pages. See [index.html](/web/index.html#L34-L42) for an example.
- Use the [Bootstrap grid system](https://getbootstrap.com/docs/5.3/layout/grid/) to organize the page. See [control_panel.html](/web/control_panel.html#L46) for an example.
- Does the page include a map? If yes, include [map.js](/web/assets/js/map.js) at the bottom of the `<body>` tag. It will automatically add the leaflet CSS and JS files. (Why? Because the script needs to run after the div containing the map is rendered.)
- `<footer>` tag containing the footer information. See [index.html](/web/index.html) for an example.
- Bootstrap Bundle JS is included at the bottom of the `<body>` tag. This is to ensure that the page is rendered before the JS is run. This version includes Popper.js.
- Include the [control.js](/web/assets/js/control.js) file at the bottom of the `<head>` tag. It contains the JavaScript to get the user's preferences and set it at page rendering.
- Does the page require the user to be logged in? If yes, include [require_login.js](/web/assets/js/require_login.js) at the bottom of the `<body>` tag.

## Composition Rules

If you have JS that modifies CSS, run the JS after the CSS is loaded. If you have issues with an element looking funky, check the order of your CSS and JS files and go over this list again.

`#map` needs a width. If you don't set it, the map will not render. If you want the map to take up the whole parent element screen, set the width to `100%`. It is wrapped in a `div` with the class `map-container`, which controls the width.

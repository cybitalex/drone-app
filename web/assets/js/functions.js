/* 

JS Helper Functions

Each function should include:
- a description of what it does
- a list of parameters (plus types)
- a list of optional parameters (plus defaults)
- a list of return values (plus types)
- A license (if not handwritten) (i.e. CC BY-SA 3.0)
- A link to the license (if not handwritten) (i.e. https://creativecommons.org/licenses/by-sa/3.0/)
- A link to the source (if not handwritten) (i.e. https://stackoverflow.com/a/46728364)

See the first function for an example.

*/

function example(string = "Hello World") {
	// Description: This is an example function that does nothing useful.
	// Parameters: None
	// Optional Parameters: a string (default: "Hello World")
	// Return Values: the optional param default, "Hello World" (string)
	// License: CC BY-SA 3.0
	// License Link: https://creativecommons.org/licenses/by-sa/3.0/
	// Source: https://stackoverflow.com/a/46728364

	return string;
}



function MGRSString(Lat, Long) {

	// Description: Convert Lat, Long to MGRS
	// Parameters: Latitude, Longitude
	// Optional Parameters: None
	// Return Values: MGRS coordinate (string)
	// License: CC BY-SA 3.0
	// License Link: https://creativecommons.org/licenses/by-sa/3.0/
	// Source: https://stackoverflow.com/a/46728364


	if (Lat < -80) return 'Too far South'; if (Lat > 84) return 'Too far North';
	var c = 1 + Math.floor((Long + 180) / 6);
	var e = c * 6 - 183;
	var k = Lat * Math.PI / 180;
	var l = Long * Math.PI / 180;
	var m = e * Math.PI / 180;
	var n = Math.cos(k);
	var o = 0.006739496819936062 * Math.pow(n, 2);
	var p = 40680631590769 / (6356752.314 * Math.sqrt(1 + o));
	var q = Math.tan(k);
	var r = q * q;
	var s = (r * r * r) - Math.pow(q, 6);
	var t = l - m;
	var u = 1.0 - r + o;
	var v = 5.0 - r + 9 * o + 4.0 * (o * o);
	var w = 5.0 - 18.0 * r + (r * r) + 14.0 * o - 58.0 * r * o;
	var x = 61.0 - 58.0 * r + (r * r) + 270.0 * o - 330.0 * r * o;
	var y = 61.0 - 479.0 * r + 179.0 * (r * r) - (r * r * r);
	var z = 1385.0 - 3111.0 * r + 543.0 * (r * r) - (r * r * r);
	var aa = p * n * t + (p / 6.0 * Math.pow(n, 3) * u * Math.pow(t, 3)) + (p / 120.0 * Math.pow(n, 5) * w * Math.pow(t, 5)) + (p / 5040.0 * Math.pow(n, 7) * y * Math.pow(t, 7));
	var ab = 6367449.14570093 * (k - (0.00251882794504 * Math.sin(2 * k)) + (0.00000264354112 * Math.sin(4 * k)) - (0.00000000345262 * Math.sin(6 * k)) + (0.000000000004892 * Math.sin(8 * k))) + (q / 2.0 * p * Math.pow(n, 2) * Math.pow(t, 2)) + (q / 24.0 * p * Math.pow(n, 4) * v * Math.pow(t, 4)) + (q / 720.0 * p * Math.pow(n, 6) * x * Math.pow(t, 6)) + (q / 40320.0 * p * Math.pow(n, 8) * z * Math.pow(t, 8));
	aa = aa * 0.9996 + 500000.0;
	ab = ab * 0.9996; if (ab < 0.0) ab += 10000000.0;
	var ad = 'CDEFGHJKLMNPQRSTUVWXX'.charAt(Math.floor(Lat / 8 + 10));
	var ae = Math.floor(aa / 100000);
	var af = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'][(c - 1) % 3].charAt(ae - 1);
	var ag = Math.floor(ab / 100000) % 20;
	var ah = ['ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE'][(c - 1) % 2].charAt(ag);
	function pad(val) { if (val < 10) { val = '0000' + val } else if (val < 100) { val = '000' + val } else if (val < 1000) { val = '00' + val } else if (val < 10000) { val = '0' + val }; return val };
	aa = Math.floor(aa % 100000); aa = pad(aa);
	ab = Math.floor(ab % 100000); ab = pad(ab);
	return c + ad + ' ' + af + ah + ' ' + aa + ' ' + ab;
}

function LatLongFromMGRSstring(a) {

	// Description: Convert MGRS to Lat, Long
	// Parameters: MGRS coordinate string
	// Optional Parameters: None
	// Return Values: success (bool), latitude (float), longitude (float)
	// License: CC BY-SA 3.0
	// License Link: https://creativecommons.org/licenses/by-sa/3.0/
	// Source: https://stackoverflow.com/a/46728364

	var b = a.trim();
	b = b.match(/\S+/g);
	if (b == null || b.length != 4) return [false, null, null];
	var c = (b[0].length < 3) ? b[0][0] : b[0].slice(0, 2);
	var d = (b[0].length < 3) ? b[0][1] : b[0][2];
	var e = (c * 6 - 183) * Math.PI / 180;
	var f = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"][(c - 1) % 3].indexOf(b[1][0]) + 1;
	var g = "CDEFGHJKLMNPQRSTUVWXX".indexOf(d);
	var h = ["ABCDEFGHJKLMNPQRSTUV", "FGHJKLMNPQRSTUVABCDE"][(c - 1) % 2].indexOf(b[1][1]);
	var i = [1.1, 2.0, 2.8, 3.7, 4.6, 5.5, 6.4, 7.3, 8.2, 9.1, 0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3, 6.2, 7.0, 7.9];
	var j = [0, 2, 2, 2, 4, 4, 6, 6, 8, 8, 0, 0, 0, 2, 2, 4, 4, 6, 6, 6];
	var k = i[g];
	var l = Number(j[g]) + h / 10;
	if (l < k) l += 2;
	var m = f * 100000.0 + Number(b[2]);
	var n = l * 1000000 + Number(b[3]);
	m -= 500000.0;
	if (d < 'N') n -= 10000000.0;
	m /= 0.9996; n /= 0.9996;
	var o = n / 6367449.14570093;
	var p = o + (0.0025188266133249035 * Math.sin(2.0 * o)) + (0.0000037009491206268 * Math.sin(4.0 * o)) + (0.0000000074477705265 * Math.sin(6.0 * o)) + (0.0000000000170359940 * Math.sin(8.0 * o));
	var q = Math.tan(p);
	var r = q * q;
	var s = r * r;
	var t = Math.cos(p);
	var u = 0.006739496819936062 * Math.pow(t, 2);
	var v = 40680631590769 / (6356752.314 * Math.sqrt(1 + u));
	var w = v;
	var x = 1.0 / (w * t); w *= v;
	var y = q / (2.0 * w); w *= v;
	var z = 1.0 / (6.0 * w * t); w *= v;
	var aa = q / (24.0 * w); w *= v;
	var ab = 1.0 / (120.0 * w * t); w *= v;
	var ac = q / (720.0 * w); w *= v;
	var ad = 1.0 / (5040.0 * w * t); w *= v;
	var ae = q / (40320.0 * w);
	var af = -1.0 - u;
	var ag = -1.0 - 2 * r - u;
	var ah = 5.0 + 3.0 * r + 6.0 * u - 6.0 * r * u - 3.0 * (u * u) - 9.0 * r * (u * u);
	var ai = 5.0 + 28.0 * r + 24.0 * s + 6.0 * u + 8.0 * r * u;
	var aj = -61.0 - 90.0 * r - 45.0 * s - 107.0 * u + 162.0 * r * u;
	var ak = -61.0 - 662.0 * r - 1320.0 * s - 720.0 * (s * r);
	var al = 1385.0 + 3633.0 * r + 4095.0 * s + 1575 * (s * r);
	var lat = p + y * af * (m * m) + aa * ah * Math.pow(m, 4) + ac * aj * Math.pow(m, 6) + ae * al * Math.pow(m, 8);
	var lng = e + x * m + z * ag * Math.pow(m, 3) + ab * ai * Math.pow(m, 5) + ad * ak * Math.pow(m, 7);
	lat = lat * 180 / Math.PI;
	lng = lng * 180 / Math.PI;
	return [true, lat, lng];
}


function changeButtonState(scan_running, start_scan_button, stop_scan_button) {

	// Description: Toggle start/stop state of scan start/stop buttons
	// Parameters: scan_running (bool), start_scan_button (element), stop_scan_button (element)
	// Optional Parameters: None
	// Return Values: None
	// License: None
	// License Link: 
	// Source: 


	console.info("Changing button states");

	// Change the button state based on if the scan is running
	if (scan_running === true) {
		console.log("Scan is running");
		start_scan_button.disabled = true;
		start_scan_button.textContent = "Scanning...";
		stop_scan_button.disabled = false;
		stop_scan_button.textContent = "Stop Scan";
		localStorage.setItem("scan_running", scan_running);
	} else {
		console.log("Scan stopped");
		start_scan_button.disabled = false;
		start_scan_button.textContent = "Start Scan";
		stop_scan_button.disabled = true;
		stop_scan_button.textContent = "Scan not running";
		localStorage.setItem("scan_running", scan_running);
	}
}
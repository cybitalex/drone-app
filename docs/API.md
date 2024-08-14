# API

>[!WARNING]
>This documentation is a work in progress.
>The API is subject to change, and ***does not yet exist***.

*This documentation assumes GET requests are being made and the responses are JSON encoded.*

`/api/system_status` returns a JSON blob containing the status for the following:

- GPS (bool) - Is there GPS lock (i.e. more than 4 satellites LOS)?
- Motor (bool) - Can it complete 180° turn in both directions?
- Compass (string) - Do the compass headings change corresponding to the motor turning? What margin of error can the system be calibrated for?
- System Time (string) - Can system time be set and is it within 2 seconds of GPS time?
- Disk Space (int) - is there at least 5GB of disk space available?
- Memory Usage (int) - is there at least 1GB of memory available?
- Various essential system services (array containing name, status) - Is apache2 running?
- Fan speed (int) - are the fans running at full speed? (1 - lowest, 5 - highest, 0 - off)

`/api/apache_status` maps to `http://localhost/server-status` by Mod_Status.

## GPS

`/api/GPS/current_location` returns the detection node's averaged current location in both [MGRS](https://en.wikipedia.org/wiki/Military_Grid_Reference_System) and [WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System) formats.

`/api/GPS/time` returns the GPS time

`/api/GPS/accuracy` returns the margin of error

`/api/GPS/satellites_locked` returns an integer between 1 and 24 (minimum 4 for GPS lock; more is better)

`/api/GPS/altitude` returns the altitude in meters

`/api/GPS/fix_quality` returns the fix quality (0 = no fix, 1 = GPS fix, 2 = DGPS fix)

`/api/GPS/last_update` returns the last time the GPS data was updated

## Detected Drones

`/api/drones` returns a JSON blob containing the following:

- Number of drones detected (int)
- List of drones detected (array of JSON blobs containing the following):
  - Drone ID (int)
  - Drone type (string)
  - Drone location (MGRS and WGS 84)
  - Drone altitude (m) (int)
  - Drone speed (mph) (int)
  - Drone heading (int)
  - Drone last seen (int) (epoch time in MS using UTC+0 or ZULU time)
  - Any other relevant information (string)

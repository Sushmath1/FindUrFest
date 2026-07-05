# Prompt: Map and wayfinding (Mapbox outdoor + indoor floor plan)

You own the full two-layer campus navigation experience:
- **Outdoor layer**: real interactive Mapbox map with GPS-based walking routes (exactly like Google Maps blue-line routing) from the visitor's live location to any building entrance.
- **Indoor layer**: uploaded floor plan image per building with clickable room pins, and a straight-line route from the building entrance to the destination room.

This combination is realistic to build, genuinely impressive, and solves something no general-purpose map app does for Indian college campuses right now.

## Stack
- `mapbox-gl` and `react-map-gl` for the outdoor map layer
- Mapbox Directions API for real walking-route calculation (the blue line)
- Browser Geolocation API for live visitor location
- Next.js Image component for indoor floor plan rendering
- Store MAPBOX_ACCESS_TOKEN in .env.local (get a free token from mapbox.com — free tier is 50,000 map loads/month, more than enough)

## Data the admin enters during college setup

### Per building/block:
```
name: "CSE Block"
entranceLat: 13.0827   // GPS coordinates of the building's main entrance
entranceLng: 80.2707   // admin enters these, or you derive them from Google Maps
floorPlanImageUrl: "..."  // uploaded floor plan photo/PDF-converted-to-image
```

### Per room/venue inside that building:
```
name: "Lab 2"
buildingId: "cse-block"
xPercent: 72   // position on the floor plan image (0-100, left to right)
yPercent: 35   // position on the floor plan image (0-100, top to bottom)
```

### Walk-time table (unchanged):
Admin manually enters approximate walking minutes between venue pairs.
Expose `getWalkMinutes(venueIdA, venueIdB)` for the backend module.

## What to build

### 1. Outdoor Mapbox map (visitor side)

- Render a Mapbox map centered on the college campus on first load
- Place one marker per building at its `entranceLat`/`entranceLng`
- Marker color: coral/amber for buildings that have active events today, gray for others
- Tapping a marker shows a small popup: building name + list of events happening there today

### 2. Live visitor location + outdoor routing (the Google Maps blue line)

- Add a "Get route" button — only request `navigator.geolocation.getCurrentPosition()` when this is explicitly tapped, never on page load
- Once location is granted, show a pulsing blue dot at the visitor's position on the Mapbox map
- Call the Mapbox Directions API (walking profile) with `[visitorLng, visitorLat]` as origin and `[building.entranceLng, building.entranceLat]` as destination
- Draw the returned route geometry as a blue line on the map — this is a real road/path-following route, not a straight line, exactly like Google Maps
- Show estimated walking time from the API response ("~8 min walk")
- If location is denied or unavailable: fall back to showing the route from a fixed "main gate" reference point (admin sets one GPS coordinate as the campus main entrance during setup) — still useful, just not personalized to live location

```javascript
// Mapbox Directions API call shape
const res = await fetch(
  `https://api.mapbox.com/directions/v5/mapbox/walking/${visitorLng},${visitorLat};${building.entranceLng},${building.entranceLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
);
const data = await res.json();
const routeGeoJSON = data.routes[0].geometry; // draw this on the map
const durationMinutes = Math.round(data.routes[0].duration / 60);
```

### 3. Indoor floor plan layer (shown when a building marker is tapped)

- Slide up a panel (or open a modal) showing the uploaded floor plan image for that building
- Overlay room pins at their stored `xPercent`/`yPercent` positions using absolute CSS positioning on top of the image
- Pin color: coral/red for rooms with active events, gray for empty rooms
- Tapping a room pin shows: room name, event name if any, event time
- Draw a straight line (SVG overlay on top of the image) from a fixed "entrance" reference point (set once per floor plan by the admin — just click where the entrance is on the image) to the tapped room pin
- Label this clearly in the UI as "general direction to room" not "exact route" — honest framing, still very useful

### 4. Search bar

- Text input above the map
- As visitor types, filter both buildings and rooms by name
- Show results grouped: "Buildings" and "Rooms" sections
- Selecting a building: fly the Mapbox map to that building's marker and open its popup
- Selecting a room: fly to the building first, then open the indoor floor plan panel with that room highlighted and the route line drawn to it
- Expose `showRouteTo(venueId)` — the frontend/schedule module calls this when a visitor taps an event card on their schedule

### 5. Admin map setup UI (college dashboard)

- After uploading the college logo/details, a dedicated "Set up campus map" step:
  1. Enter GPS coordinates per building (with a helper: "Open Google Maps, right-click your building entrance, copy the coordinates shown")
  2. Upload a floor plan image per building
  3. Click on the floor plan image to place room pins — captures `xPercent`/`yPercent`
  4. Click once to mark the "entrance" reference point on the floor plan
  5. Manually enter walk-time between venue pairs

## Coordination points
- With backend module: confirm `entranceLat`, `entranceLng`, `xPercent`, `yPercent`, `floorPlanImageUrl` field names on the Venue/Building models before either of you build queries against them — these are new fields compared to the earlier static-image-only approach.
- With frontend module: confirm `highlightVenueOnMap(venueId)` and `showRouteTo(venueId)` signatures — these are called from the schedule page when a visitor taps an event card.
- With hosting module: `MAPBOX_ACCESS_TOKEN` needs to be added to Vercel's environment variables — add it to `.env.example` now so it's not forgotten at deploy time.

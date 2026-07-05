# Prompt: Frontend (Next.js + Tailwind + shadcn/ui)

You own all UI for both college admin and visitor sides, including a light/dark theme toggle and a fun, fest-relatable visual identity.

## Pages

**Entry**
- `/` — two large clear buttons: "Register your college" and "I'm a visitor". Visitor path needs no login to proceed.

**College admin — onboarding wizard** (`/college/register`)
This is NOT a single long form. It is a 5-step wizard with a progress bar at the top showing "Step X of 5". Each step has a short plain-English tip explaining exactly what to do and where to get the information. The admin can go back to any previous step. Data is saved as a draft after each step so they don't lose progress if they close the tab.

Step 1 — "Basic details"
  - College name, fest name, fest start date, fest end date
  - Default contact person name and phone number
  - College logo upload (optional)
  - Tip shown: "This is the information visitors will see when they search for your college."

Step 2 — "Upload your campus map"
  - A single image upload field (JPG, PNG, or PDF — auto-convert PDF to image)
  - Tip shown: "Don't have a campus map image? Open Google Maps, search your college, switch to Satellite view, and take a screenshot. That works perfectly."
  - Show a small example screenshot demonstrating exactly this

Step 3 — "Mark your buildings"
  - Show the uploaded campus map image
  - Visitor clicks anywhere on the image to drop a pin
  - A small popup appears asking: "What is this building called?" (e.g. CSE Block, Seminar Hall, Innovation Lab)
  - Also embed a small Mapbox mini-map next to the campus image — admin clicks on the mini-map to drop a GPS pin on the real map at the building's entrance, which auto-captures the lat/lng coordinates. No manual coordinate typing needed.
  - Tip shown: "Drop a pin on each building where events will happen. For GPS location, click the exact entrance of that building on the small map on the right."
  - Admin can drag pins to adjust, click a pin to rename or delete it

Step 4 — "Add floor plans" (optional but recommended)
  - For each building pinned in Step 3, offer an upload slot for a floor plan image
  - Tip shown: "Take a photo of the corridor map posted near each building's entrance — most college buildings have one. This helps visitors find the exact room inside the building."
  - After uploading, admin clicks on the floor plan image to mark room positions (same pin-drop UX as Step 3 but for rooms)
  - Admin also clicks once to mark the "entrance point" on the floor plan
  - This whole step can be skipped — show a "Skip for now, add later from dashboard" button

Step 5 — "You're all set!"
  - Summary card showing: college name, fest dates, number of buildings marked, number of floor plans uploaded
  - Two buttons: "Go to dashboard" and "Add your first event"
  - Confetti animation on this screen — celebrate the setup completion

**College admin — dashboard** (`/college/dashboard`)
- `/college/login` — simple email + password, link to register if no account
- `/college/dashboard` — venue list with editable event name/venue/time fields, optional per-event contact override, cancel button per event (with confirm dialog — cancellation is irreversible). Flash info-blue on save. Also a "Upload registered attendees" section: CSV upload (email or phone + event name) with a review screen showing unmatched rows for the admin to fix before confirming.
- `/college/events/new` — name, venue dropdown (from Step 3 pins), start/end time, optional contact override
- `/college/map-setup` — accessible from dashboard anytime to re-do or update the map setup (wraps the same Step 3 and Step 4 UI from onboarding, not a separate experience)

**Visitor side** (no login required for the core flow)
- `/visitor/search` — search bar + college cards, no login wall
- `/visitor/college/[id]` — verification-first: form asking for email or phone the visitor registered with. On submit calls `verifyRegistration()`. Show result: "Found 3 registered events: Robotics Workshop, AI Hackathon, Quiz Night" with a confetti pop and one-tap "Build my schedule". If no match: friendly message suggesting they try the other (email vs phone), never imply the event doesn't exist. Below the form, show the full public event list read-only so visitors can browse even before verifying.
- `/visitor/schedule` — core screen sorted by time:
  - Default card: event name, time, venue, contact info
  - Walk-time connector between cards
  - Info-blue banner for `venueJustChanged`
  - Red crossed-out card with "Cancelled" badge for cancelled events — keep visible, don't remove
  - Red-bordered conflict card with badge
  - "Search a place" bar → calls map module's `showRouteTo(venueId)`
  - Footer: "last synced Xm ago" + unobtrusive "Log in to save history" prompt (never a blocking modal)
- `/visitor/login`, `/visitor/signup` — optional, reachable from a small account icon top-right
- `/visitor/history` — logged-in only; guests see "log in to see your past fests" card

## Theme
- Light/dark toggle — persist in localStorage, respect system preference on first visit
- Visual identity: fun, energetic, college-fest feel — not corporate blue. Bold color blocks, playful rounded cards, small confetti/sparkle on success states (schedule built, registration confirmed). Keep it legible on actual data screens — the fun is in transitions and empty states, not on the schedule itself where clarity matters more.

## Interfaces to mock until real modules are ready
```
registerCollege(data), loginCollege(creds)
loginVisitor(creds), signupVisitor(data), migrateGuestSession(guestId, visitorId)
searchColleges(query), getSchedule(visitorOrGuestId)
verifyRegistration(visitorOrGuestId, collegeId, email, phone)
uploadPreRegisteredEntries(collegeId, csvFile)
createEvent(data), updateEventVenue(eventId, data), cancelEvent(eventId)
getVisitorHistory(visitorId)
useVenueUpdates(eventIds), useEventCancellations(eventIds)
highlightVenueOnMap(venueId), showRouteTo(venueId)
```

# Prompt: Backend (database + core API logic)

You own the schema and all CRUD/business logic. Auth module hands you `collegeId` and either a `visitorId` or `guestSessionId` (treat both the same way unless a route specifically needs persistence).

## Schema

```prisma
model College {
  id              String   @id @default(cuid())
  name            String
  logoUrl         String?
  mapImageUrl     String?
  contactNumber   String   // default contact for the whole fest
  contactName     String
  festStartDate   DateTime
  festEndDate     DateTime
  venues          Venue[]
  events          Event[]
}

model Venue {
  id        String @id @default(cuid())
  collegeId String
  name      String
  xPercent  Float?
  yPercent  Float?
  events    Event[]
}

model Event {
  id                String   @id @default(cuid())
  collegeId         String
  venueId           String
  name              String
  startTime         DateTime
  endTime           DateTime
  status            String   @default("scheduled") // "scheduled" | "changed" | "cancelled"
  lastVenueChangeAt DateTime?
  previousVenueName String?
  contactName       String?  // optional override of college's default contact
  contactNumber     String?  // optional override
  registrations     Registration[]
}

model Registration {
  id            String   @id @default(cuid())
  // exactly one of these two is set, never both
  visitorId     String?
  guestSessionId String?
  eventId       String
  collegeId     String
  registeredAt  DateTime @default(now())
}

// Source of truth for who actually paid/registered for what, uploaded by the
// college from their own registration system (Razorpay export, Google Form
// responses, college portal export — whatever they already use).
model PreRegisteredEntry {
  id          String  @id @default(cuid())
  collegeId   String
  eventId     String
  // normalize both to lowercase/stripped before storing and before lookup
  email       String?
  phone       String?
  matched     Boolean @default(false) // true once a visitor has claimed this entry
}
```

## Endpoints

### College admin (requires `collegeId`)
- `POST /api/colleges/:id/venues` — `{name, xPercent, yPercent}`
- `POST /api/colleges/:id/events` — `{name, venueId, startTime, endTime, contactName?, contactNumber?}`. If `contactName`/`contactNumber` are omitted, the event displays the college's default contact.
- `PATCH /api/colleges/:id/events/:eventId` — body can update `venueId`, times, or contact override. **If `venueId` changes**: set `status = "changed"`, `lastVenueChangeAt = now()`, store `previousVenueName`, call `notifyVenueChange()` (realtime module).
- `DELETE /api/colleges/:id/events/:eventId` (cancellation, not hard delete) — set `status = "cancelled"`, keep the row (don't actually delete it, visitors need to see "cancelled" rather than the event silently vanishing), call `notifyEventCancelled()` (realtime module). **Only allow this before `endTime`** — once an event has ended, cancellation no longer makes sense; return a 400 if attempted after.

### Pre-registration verification (new — replaces free self-selection)
- `POST /api/colleges/:id/preregistered-entries/upload` — admin uploads a CSV (`email or phone, eventName`) exported from their own registration/payment system. Parse, normalize (lowercase/trim email, strip non-digits from phone), match `eventName` to an existing `Event` by name (flag any rows that don't match an event so the admin can fix typos before confirming the import), and bulk-insert as `PreRegisteredEntry` rows.
- `POST /api/visitors/verify-registration` — body `{visitorOrGuestId, collegeId, email, phone}` (visitor provides whichever they registered with). Normalize the input the same way as the upload step, look up matching unmatched `PreRegisteredEntry` rows for that college. For every match found:
  1. Create a `Registration` row linking this visitor/guest to that `eventId`
  2. Set `matched = true` on the `PreRegisteredEntry` row (so the same entry can't be claimed twice by different people)
  3. Return the list of newly matched event names so the frontend can show "Found 3 registered events: X, Y, Z" as confirmation
  If zero matches are found, return a clear message — most likely cause is a typo or using a different email/phone than what they registered with, suggest they try the other one.
- This endpoint replaces manual checkbox selection as the default path. Once verified, those events flow into `GET /api/visitors/:id/schedule` exactly as before — no changes needed to the schedule generation logic itself.

### Other visitor-facing endpoints
- `GET /api/colleges/search?q=`
- `GET /api/colleges/:id/events?date=` — filter by the college's fest day if multi-day (`festStartDate`–`festEndDate`)
- `POST /api/visitors/registrations` — body `{visitorOrGuestId, eventIds}` — works the same whether it's a real visitor or a guest session
- `GET /api/visitors/:visitorOrGuestId/schedule` — core logic:
  1. Fetch registered events sorted by `startTime`, excluding nothing — **cancelled events stay in the list but flagged**, don't silently drop them (visitor needs to see "this was cancelled," not wonder why it disappeared).
  2. For each consecutive non-cancelled pair, attach `walkMinutesToNext` (call map/wayfinding module's `getWalkMinutes()`).
  3. Flag `conflictWithEventId` for overlapping non-cancelled events.
  4. Flag `venueJustChanged` if `lastVenueChangeAt` within last 30 min.
  5. Return:
  ```json
  {
    "events": [{
      "id": "evt_1", "name": "Robotics workshop", "venue": "Lab 2",
      "startTime": "...", "endTime": "...", "status": "scheduled",
      "contactName": "Dr. Iyer", "contactNumber": "+91...",
      "walkMinutesToNext": 6, "venueJustChanged": false,
      "conflictWithEventId": null
    }],
    "lastSyncedAt": "..."
  }
  ```
- `GET /api/visitors/:id/history` — **only valid for a real logged-in `visitorId`**, not a guest session; return 401 with a clear message if called with a guest ID, so frontend can show the "log in to see history" prompt.
- `POST /api/visitors/migrate-guest` — body `{guestSessionId, visitorId}` — reassigns all `Registration` rows from the guest session to the newly created/logged-in account. Call this right after a guest successfully signs up or logs in.

## Notes
- Keep error responses consistent: `{error: "message"}`.
- Build and share a Postman/OpenAPI collection early.

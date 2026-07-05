# Prompt: Realtime (live venue-change and cancellation notifications)

You own the live push pipeline for two event types now: venue changes AND cancellations.

## What to build

1. **Socket server**: visitors (logged in OR guest) connect on schedule-load, join room `event:${eventId}` per registered event.

2. **Two emit functions** for the backend module to call:
   - `notifyVenueChange(eventId, payload)` — `{eventId, newVenueName, previousVenueName, changedAt}`
   - `notifyEventCancelled(eventId, payload)` — `{eventId, eventName, cancelledAt}`

3. **Frontend hooks** (already stubbed by frontend module): `useVenueUpdates(eventIds)` and `useEventCancellations(eventIds)` — replace stub bodies with real socket listeners for `venue-changed` and `event-cancelled` respectively. Keep signatures identical.

4. **Reconnection handling**: on reconnect, trigger one REST re-fetch of the schedule to catch anything missed — don't rely on socket delivery alone, especially since cancellations are higher-stakes to miss than a venue change (a visitor walking to a cancelled event is a worse experience than a wrong room).

## Testing checklist
- Change a venue via the admin side, confirm the open visitor tab updates within a second or two.
- Cancel an event via the admin side, confirm the visitor's schedule shows the crossed-out "Cancelled" card instantly.
- Test with the visitor on a throttled/slow network (Chrome DevTools network throttling) to see how the socket behaves under poor conditions — this directly feeds into what the offline/low-connectivity module needs to compensate for.

## Coordination points
- With backend module: confirm both emit calls happen right after their respective DB writes succeed.
- With frontend module: you're only filling in hook internals, not changing their signatures.
- With offline/low-connectivity module: they're building the fallback path for when this socket connection can't be sustained — share what failure modes you observe under throttled testing.

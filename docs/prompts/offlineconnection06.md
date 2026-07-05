# Prompt: Offline support and low-connectivity notifications

You own two related but distinct problems: viewing the schedule with zero internet, and getting notified of changes with poor (not necessarily zero) internet — these need different solutions.

## Part 1 — offline viewing (zero connectivity)
Unchanged from before: cache last-loaded schedule + map locally (service worker or localStorage/IndexedDB), show `lastSyncedAt`, sync on reconnect, be explicit in the UI that live push can't work with zero connectivity.

## Part 2 — notifications under POOR (not zero) connectivity — this is the part that needed a different approach
A persistent Socket.io connection is fragile on patchy fest wifi — it can silently drop without the app noticing immediately. Build a **layered fallback**, not just one mechanism:

1. **Primary**: the realtime module's Socket.io connection, for instant push when the network is good.
2. **Fallback — lightweight polling**: if the socket hasn't received a heartbeat in ~15-20 seconds, switch to polling a tiny dedicated endpoint every 20-30 seconds: `GET /api/visitors/:id/status-check?eventIds=...` which the backend module should expose returning ONLY a minimal payload — just `{eventId, status, lastVenueChangeAt}` for each registered event, not the full schedule. Keeping this payload tiny matters specifically because it needs to succeed even on a weak connection that might fail on a heavier request.
3. **Fallback — Web Push API**: for the strongest resilience, register a service worker and use the browser's Push API (works through the browser vendor's own push infrastructure, not your socket connection) so the OS can deliver a notification even if the app isn't actively open or the socket has dropped. This is more setup work than the polling fallback — if time is short, build the polling fallback first since it's simpler and still solves the core problem, and treat Web Push as a stretch goal.
4. Whichever path detects a change, route it through the same UI banner logic the realtime module already built — don't create a second, different notification UI.

## Testing checklist
- Throttle the network to "Slow 3G" in dev tools, change a venue on admin side, confirm the visitor still gets notified within a reasonable window (even if slower than the instant socket case).
- Go fully offline, confirm the cached schedule still displays with a clear "last synced" indicator and no broken UI.

## Coordination points
- With realtime module: you're building the fallback for when their primary mechanism can't be sustained — talk to them about what failure signals to watch for (missed heartbeats, connection errors).
- With backend module: confirm the lightweight `status-check` endpoint shape — keep it minimal on purpose.

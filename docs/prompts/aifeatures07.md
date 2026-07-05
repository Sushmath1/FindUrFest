# Prompt: AI features (final, consolidated)

You own five AI-powered features, all calling the Anthropic API from the backend only (never expose the API key to the frontend). In every case: AI suggests, a human confirms — no AI output silently saves data.

## Stack
`@anthropic-ai/sdk`, `claude-sonnet-4-6` for reasoning-heavy tasks, `claude-haiku-4-5-20251001` for the high-frequency chatbot.

## 1. AI auto-schedule (the foundation the chatbot below depends on)

**Endpoint**: `POST /api/ai/auto-schedule` — body `{visitorOrGuestId, collegeId, interests: string}`.

Step 1 (plain code): fetch all events at the college for the target fest day, tag each with its conflicts (interval overlap check) and walk-time to nearby events (reuse `getWalkMinutes()`).
Step 2 (AI): pass the conflict-tagged list + interests to Claude with forced tool-use JSON output, asking it to pick a relevant, non-conflicting subset. Re-validate the returned set against your conflict data afterward as a safety net.
Step 3: show as a draft for the visitor to review/edit, one tap to accept registers them via the existing registration endpoint.

## 2. Visitor Q&A chatbot (built on top of #1's output)

**Endpoint**: `POST /api/ai/ask` — body `{visitorOrGuestId, question}`.

Fetch the visitor's current schedule (whether built manually or via auto-schedule — same data either way) and inject it as context into a Claude Haiku call. Keep answers short, constrained to the provided schedule data so it doesn't hallucinate beyond what it actually knows. Render as a floating chat bubble on `/visitor/schedule`.

## 3. Personalized recommendations

**Endpoint**: `POST /api/ai/recommend-events` — body `{visitorOrGuestId, collegeId}`.

Step 1 (plain code): compute the visitor's free time gaps between registered events, filter the college's other events to only those that genuinely fit a gap (including walk-time to/from the nearest registered event).
Step 2 (AI): rank the filtered candidates by relevance to what they've already registered for, return top 3 with a one-line reason each.
Render as "you might also like" cards on `/visitor/schedule` with a one-tap add button.

## 4. Smart conflict-resolution suggestions

When the backend's conflict detection flags two events, call `POST /api/ai/suggest-resolution` with both conflicting events + other unregistered options, asking Claude for a one-sentence suggestion on which to keep/drop/swap. Show under the existing conflict badge — visitor still decides, one-tap "drop this" action.

## 5. Auto-pin detection from map photo

**Endpoint**: `POST /api/ai/detect-venues` — body `{imageBase64}`. Use Claude's vision input + forced tool-use JSON to extract room labels and approximate `xPercent`/`yPercent` positions. Render as a draft pin layer (visually distinct from confirmed pins) on the map/wayfinding module's setup UI — admin drags to adjust, then confirms to save as real venues.

## Coordination points
- With backend module: field names must match exactly (`venueName` → `Venue.name`, etc.)
- With map/wayfinding module: confirm draft-vs-confirmed pin styling before building #5's UI on top of their component
- With frontend module: agree on where each AI UI element lives (chat bubble, recommendation cards, suggestion line, auto-detect button)

## If time runs short
Build #1 and #2 first (most visually impressive, most integration value since #2 depends on #1 anyway). #3 and #4 next. #5 is the most cuttable if the clock runs out — it's impressive but the least essential to the core pitch.

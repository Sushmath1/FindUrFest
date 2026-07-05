# Prompt: Authentication (with optional guest mode for visitors)

You own account creation, login, sessions, and role-based access — for colleges (always required to log in) and visitors (login is OPTIONAL).

## Stack
NextAuth.js (credentials + Google OAuth) or a simple JWT approach — pick one and commit early since the backend module's middleware depends on it.

## Two account types + a guest mode

```prisma
model CollegeAccount {
  id           String @id @default(cuid())
  collegeId    String @unique
  adminEmail   String @unique
  passwordHash String
}

model VisitorAccount {
  id           String @id @default(cuid())
  visitorId    String @unique
  email        String @unique
  passwordHash String
}
```

**College side**: always requires login — `POST /api/colleges/register`, `POST /api/colleges/login`. Middleware `requireCollegeAuth(req)` attaches `req.collegeId`.

**Visitor side — guest mode is the default path**:
- A visitor can search colleges, select events, and get a generated schedule WITHOUT creating an account. On first visit, generate a `guestSessionId` (random UUID), store it in a cookie/localStorage, and use it as the key for their selections — same role a `visitorId` would normally play.
- `POST /api/visitors/signup` / `POST /api/visitors/login` are optional, offered with a clear prompt like "Save your schedule across devices? Create an account" — not forced before they can use the app.
- If a guest later creates an account, **migrate their guest session's data** (registrations) onto the new `visitorId` so they don't lose what they already selected.
- History (`/visitor/history`) is the one feature explicitly gated behind a real account — show a friendly "log in to see your past fests" message instead of blocking the rest of the app.

## Middleware
- `requireCollegeAuth(req)` — 401 if invalid, attaches `req.collegeId`.
- `getVisitorContext(req)` — does NOT reject if there's no logged-in visitor; instead resolves to either a `visitorId` (if logged in) or a `guestSessionId` (if not), and the backend module treats both identically for schedule generation. Only routes that explicitly require persistence (history) should reject a guest.

## Security basics
- bcrypt for passwords, 10+ salt rounds.
- Keep college and visitor auth completely separate — write one test confirming a visitor token never passes `requireCollegeAuth`.
- Google OAuth for visitors who do want an account — removes signup friction for the one optional flow that needs it.

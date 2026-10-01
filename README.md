# Hotel Service Desk

A multi-hotel concierge application with room QR guest access and role-based staff operations.

## Scope

- Hotel-managed Wi-Fi, facility timings, policies, service catalogue, prices, photos and nearby recommendations.
- Unique room QR, manually created stay, hashed access code, expiring HttpOnly session; checkout/code reset revokes access.
- Common-area QR: hotel information and explore/nearby only. No ordering or booking.
- Room requests for housekeeping, food, laundry, maintenance, transport, guides, activities and wellness.
- Named staff assignment by hotel/department heads, status history, guest chat, quote approval, blocker reasons and manager completion.
- Immutable service price snapshots, once-per-request service charges, cancellation voids, current/historical stay bill CSV export. No accommodation booking, payment collection or payment recording.
- Hotel separation and role checks run on the server. Staff identity comes from Sites sign-in headers, never a client-supplied role.

## First use

1. Sign in with ChatGPT and create your hotel.
2. Enter hotel information; add/publish services and local recommendations.
3. Add rooms and common-area locations, then download their QR codes.
4. Add staff by their sign-in email and choose role/department.
5. Check in a guest and provide the one-time displayed access code.
6. Scan the room QR, unlock, submit a request, assign an employee and progress it through manager completion.
7. Complete/cancel outstanding requests, export service charges and check out the stay. Settlement remains at reception/in the hotel's existing system.

## Runtime

Vinext/React, Cloudflare Worker, D1 (`DB`) and R2 (`BUCKET`). Sites owns resource provisioning and applies SQL migrations from `drizzle/` at deployment. Prices are stored in currency minor units. Staff polling interval is 15 seconds; this version has no push/WhatsApp delivery, PMS/POS integration or automatic notification escalation.

This first deployment is owner-private. Anonymous guest rollout and other staff access require an explicit sharing change before an operational pilot. There is no independent password-based staff sign-in. QR access codes establish stay access; a QR cannot establish a visitor's physical presence or prevent a guest sharing the code.

## Validation

`node tests/desk-api.mjs` exercises the real route handlers against SQLite with mocked hosting identity/cookie boundaries: 49 API response assertions and additional checks for public restrictions, permissions, price tampering, idempotent submission, unique charges, quotes, checkout, historical records and PIN rotation. Type-check with `node node_modules/typescript/bin/tsc --noEmit`.

These integration tests do not replace hosted identity/R2 or real-device testing. Browser preview was unavailable during this build; mobile/browser and WebMCP registration validation remain to be completed in a pilot before using real guest data.

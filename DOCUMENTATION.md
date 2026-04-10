# CLIENT-end Documentation

This file is the local reference for the public client application package.

## Scope

Use this document for CLIENT-end runtime behavior and entry points.
Use the global docs hub for cross-app architecture, integrations, and feature flows.

## Canonical links

- Global docs index: `../docs/README.md`
- Architecture: `../docs/getting-started/ARCHITECTURE_OVERVIEW.md`
- Order flow: `../docs/features/ORDER_FLOW.md`
- Payment integration: `../docs/integrations/PAYMENT_INTEGRATION.md`
- Realtime model: `../docs/realtime/WEBSOCKET_IMPLEMENTATION_GUIDE.md`
- State and caching: `../docs/getting-started/STATE_MANAGEMENT_AND_CACHING.md`

## Package map

- App shell: `client-public/`
- Design system implementation: `client-public/DESIGN_SYSTEM.md`
- Shared package for this app: `shared-api/`
- Public static assets: `public/`
- Build/runtime config: `app.json`, `vercel.json`, `metro.config.js`

## Key behaviors

### QR entry and session bootstrap

- The client app derives `restaurantId` and `tableId` from URL/flow context.
- A client token is created through backend public token flow.
- Table and session context are persisted locally for recovery.

### Ordering

- Cart and order composition run through Zustand stores.
- Order submission uses shared API services and backend order validation.

### Payment

- Stripe client flow is executed from the public app.
- Final payment state is server-authoritative and synced via API + realtime events.

### Offline and cache

- AsyncStorage is used for operational persistence (table/session/cart/order/theme cache keys).
- Offline fallback behavior for order retrieval is implemented in store logic.

## Historical notes

Superseded CLIENT-end markdown files were moved to:

- `../docs/archive/client-end/`

# CLIENT-end Start Here

## Canonical documentation

Use this order:

1. `DOCUMENTATION.md` (production flow and architecture)
2. `client-public/DESIGN_SYSTEM.md` (design system implementation)
3. `../docs/features/ORDER_FLOW.md` (cross-app order flow)
4. `../docs/integrations/PAYMENT_INTEGRATION.md` (payment backend reference)
5. `../docs/realtime/WEBSOCKET_IMPLEMENTATION_GUIDE.md` (realtime behavior)

## Why this file was simplified

Previous design-system markdown files in `CLIENT-end/` were redundant and partially outdated.
They were moved to:

- `../docs/archive/client-end/`

## Quick bootstrap

1. Install dependencies in `CLIENT-end/`.
2. Start Expo.
3. Validate QR entry flow (`/r/{restaurantId}/{tableId}`).
4. Validate order creation and payment flow against backend.


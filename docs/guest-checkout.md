# Guest checkout and order tracking

New guest orders require `email` and `shipping_address.recipient_phone` on `POST /checkout/create-order`. The server validates both before creating the order. It does not create, search, update or attach a user. Contact data and an immutable shipping snapshot are stored on the order, with `userId = NULL`. No loyalty transactions are written for guest orders. Existing orders and users are not migrated.

The confirmation email links to `/orders/track/:orderNumber#token=<secret>` (with `/en` for English). A cryptographically random 32-byte secret is generated per order; only its SHA-256 hash is stored in the database. The website sends the secret as `X-Order-Token` to `GET /guest-orders/:orderNumber`. This endpoint is read-only and returns a restricted customer projection, excluding account details, internal notes, staff identities and token hashes. Missing, incorrect or mismatched secrets return 404. Responses are not cached. The storefront refreshes guest status every 30 seconds.

Customer login takes email or phone plus password in one step. Registration no longer calls check-exists or claims guest identities. Existing registered users still have unique email/phone constraints; new guest orders do not occupy either identifier. Legacy passwordless account claiming is disabled; existing order data remains unchanged.

## Rollout

Apply `IndependentGuestOrders1739600000000` before running the updated backend. It makes `orders.userId` nullable and adds nullable guest contact, tracking hash and shipping snapshot columns. It does not update or delete existing rows. Its rollback refuses to discard guest orders once any have been created. Review pending migrations before using the repository-wide migration runner, since earlier unrelated migrations may also be pending.

Set `MAIL_BRAND_URL` (or `FRONTEND_URL`) to the storefront origin. Existing SMTP/Resend settings deliver confirmation messages. Mail delivery failure is logged and does not undo an already-created order; automatic retry/resend is not implemented. The confirmation acknowledges receipt of the order, not verified payment.

## Verification

`npx tsc --noEmit` in both repositories.

`npm test -- --runInBand modules/checkout/checkout.service.spec.ts modules/orders/guest-orders.service.spec.ts modules/auth/auth.service.spec.ts modules/auth/customer-login.service.spec.ts modules/points/points.service.spec.ts`

These 40 tests cover guest isolation, required contact fields, email tracking hashes, no guest points, private tracking responses, invalid/mismatched links, normalized email/phone login, password rejection and registration without guest claiming.

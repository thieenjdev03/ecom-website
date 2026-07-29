# Mingo storefront API

The Mingo storefront uses the backend as the only source of truth for price,
stock, shipping fees, totals, payment state, and order state.

## Public catalog and homepage

- `GET /products`: active products only. Supports category, collection, search,
  locale, pagination, and sorting.
- `GET /products/slug/:slug`: active product detail.
- `GET /storefront/home`: active `HERO` collections and non-empty active
  `HOME_SECTION` collections, sorted by `sortOrder`.

## Cart

Every request sends a cryptographically random 32–256 character
`X-Cart-Token`. Only its SHA-256 hash is stored.

- `GET /cart`
- `POST /cart/items` with `{ "productId": "uuid", "quantity": 1 }`
- `PATCH /cart/items/:id` with `{ "quantity": 2 }`
- `DELETE /cart/items/:id`
- `DELETE /cart`
- `POST /cart/merge` with customer bearer authentication

Prices and availability are re-read from `products` for each response. The
guest cart is merged into the customer cart on login without deleting existing
customer items.

## Shipping and checkout

- `POST /shipping/quote` with `province_code` and `district_code`
- `POST /checkout/quote` with the cart token, bearer authentication,
  `shipping_address_id`, `province_code`, and `district_code`
- `POST /checkout/create-order` with the same fields and optional `notes`

An address in `MINGO_HOME_PROVINCE_CODE` whose district is in
`MINGO_INNER_DISTRICT_CODES` is `INNER_CITY`/`DIRECT` and defaults to
25,000 VND. Other addresses are `OUTER_CITY`/`DEALER` and default to 35,000
VND. An outer-city quote is rejected when no active distributor serves the
province.

Checkout ignores all client price fields. It recalculates the cart, decrements
stock with an atomic conditional update, stores product and shipping snapshots,
creates a `NEW`/`PENDING` order, and reserves stock for 15 minutes. Expired
reservations are released lazily before subsequent checkout attempts. Failed
VNPay callbacks release stock; paid callbacks confirm the reservation.

## VNPay

- `GET /payments/vnpay/ipn`: verifies the secure hash and backend amount,
  then handles the callback idempotently.
- `GET /payments/vnpay/return`: read-only return state. It never marks an order
  paid.

Required environment variables:

```dotenv
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/checkout/vnpay-return
VNPAY_IPN_URL=http://localhost:3000/payments/vnpay/ipn
MINGO_HOME_PROVINCE_CODE=79
MINGO_INNER_DISTRICT_CODES=760,761,762
MINGO_INNER_CITY_FEE=25000
MINGO_OUTER_CITY_FEE=35000
```

Only the verified IPN is authoritative. The browser return page must query the
authenticated order API before showing payment success.

## Orders and privacy

- `GET /me/orders`
- `GET /me/orders/:orderCode`
- Existing `/orders/:id` and `/orders/number/:orderCode` routes enforce
  ownership for customers; admins can inspect any order.
- Admin updates use the existing status transition endpoint. Invalid
  transitions are rejected.

Run `npm run seed:mingo` after migrations to upsert two Mingo homepage
collections and one sample distributor. The seed never deletes existing data.

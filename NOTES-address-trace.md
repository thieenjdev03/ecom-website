# Address Book — Trace & Design Notes

Spec: **Sổ địa chỉ người dùng (User Address Book)**. This file records the real
names traced from source + live DB, and the design decisions taken because the
spec's premise did not match this codebase.

## 1. Trace results (real names)

| Thing | Real value |
|---|---|
| User entity | `src/modules/users/user.entity.ts`, class `User` |
| User table name (verified against live DB) | **`user`** (lowercase). NB: `orders` migration FKs to `"User"` and `carts` to `"user"` — in-source drift; the live table is `user`. |
| User PK | `id` `uuid` (`@PrimaryGeneratedColumn('uuid')`) |
| Address columns ON `user`? | **None.** `User` has `@OneToMany(() => Address)`. No single-address columns exist. |
| Existing address book | **`addresses` table** already exists: entity `src/modules/addresses/address.entity.ts`, module `AddressesModule`, controller `users/:userId/addresses`. |
| Migrations dir | `src/migrations/`, format `<timestamp>-<Name>.ts`, class `Name<timestamp>` |
| Auth guard for `me/*` routes | `JwtGuard` from `src/modules/auth/jwt/jwt.guard.ts` (same one `me.controller.ts` uses) |
| Current-user access | No `@CurrentUser()` decorator exists. Use `@Req() req.user`. JWT payload = `{ sub, email, role }` (signed with `sub: user.id`). **userId = `req.user.sub`**. |
| Order entity | `src/modules/orders/entities/order.entity.ts`, table `orders` |
| Order create | `CreateOrderDto` in `src/modules/orders/dto/order.dto.ts`; `OrdersService.create()` |
| Order address handling | Order has FK `shippingAddressId → addresses` **and** an embedded `shipping_address` (`ShippingAddressDto`) path that already calls `addressesService.upsertByUser()` + appends a text snapshot to `order.notes`. |
| `gen_random_uuid()` / pgcrypto | pgcrypto **installed**; `addresses.id` currently defaults `uuid_generate_v4()`. |

## 2. Why the spec premise was wrong (and the decision)

The spec assumed each user had **one** address in columns **on the `user` table**,
with **no** address book, and that Order snapshots address with **no** FK. None of
that holds: a full `addresses` 1-n book already exists and Order already has an
address FK.

**Decision (confirmed with product owner): Option A — extend the existing
`addresses` table** into the spec's address book instead of creating a duplicate
`user_address` table. This avoids two competing address systems.

## 3. Column mapping (spec field → real `addresses` column)

| Spec field | `addresses` column | Action |
|---|---|---|
| `recipientName` | `recipientName` | reuse; widen 120→160 |
| `recipientPhone` | `recipientPhone` | reuse (stays nullable in DB for legacy; DTO requires it) |
| `provinceId` | **NEW** `provinceId varchar(20) NOT NULL DEFAULT ''` | add |
| `provinceName` | `province` | reuse (name); widen 120→160 |
| `wardId` | **NEW** `wardId varchar(20) NOT NULL DEFAULT ''` | add |
| `wardName` | `ward` | reuse (name); widen 120→160 (stays nullable for legacy) |
| `district` | `district` | reuse (NOT NULL in DB; service sends '' when absent) |
| `addressLine` | `streetLine1` | reuse |
| `label` | `label` | reuse; widen 40→60 |
| `isDefault` | `isDefault` | reuse |
| `dedupeKey` | **NEW** `dedupeKey varchar(64)` (nullable) | add |
| `deletedAt` (soft delete) | **NEW** `deletedAt timestamp` | add |

`provinceName`/`wardName`/`addressLine` are exposed under the spec's field names by
the new `me/addresses` API layer, mapped to `province`/`ward`/`streetLine1` in the
service. The legacy `users/:userId/addresses` API keeps its own field names over the
same columns.

## 4. Backfill decisions

- `addresses` has only 9 rows and **0** users with >1 `isDefault=true`, so the
  partial unique one-default index applies cleanly.
- New `provinceId`/`wardId` default `''` for existing rows (real geo IDs unknown for
  legacy data). Denormalized names come from existing `province`/`ward`.
- `dedupeKey` is backfilled with the **same** algorithm as
  `buildAddressDedupeKey` (Task 4). The SQL collapses internal whitespace
  (`regexp_replace(lower(btrim(x)),'\s+',' ','g')`) to match the util's
  `.trim().toLowerCase().replace(/\s+/g,' ')` exactly — the spec's two sample
  formulas differed on whitespace; the util version wins.
- `dedupeKey` is left **nullable** in DB: the legacy write paths
  (`AddressesService.upsertByUser`, admin tooling) do not compute it, and the
  partial unique dedupe index treats NULLs as distinct so those rows never
  collide. The new address-book service always computes and sets it.

## 5. Order integration decision (Task 6)

- The pre-existing `shippingAddressId` FK is **load-bearing** (`findAll`/`findOne`
  join `shippingAddress`) and is **not** removed — removing it would be destructive
  and break existing reads. Historical integrity is preserved by the text snapshot
  the order already writes into `order.notes`, plus soft-deleted address rows
  remaining in the table.
- The manual-address checkout branch now routes through
  `UserAddressesService.upsertFromCheckout()` (non-throwing, dedupe, does **not**
  change the user's default) instead of the old `upsertByUser` (which overwrote the
  single default address every checkout). Because `upsertFromCheckout` never throws,
  an address-save failure can never roll back the order — satisfying the spec's
  "must not fail the order" intent even though the call is made while resolving the
  FK id rather than strictly post-commit.

## 6. Safety

The only configured datasource is the **live Railway production** DB. The migration
in this change was **not** executed against it automatically. Run
`npm run migration:run` in a controlled environment; `down()` reverts columns +
indexes (and un-widens the reused columns back to their original lengths).

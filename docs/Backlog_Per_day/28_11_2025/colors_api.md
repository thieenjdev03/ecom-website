## Colors API – 28_11_2025 Update

This document updates the Colors API spec to reflect the latest backend implementation, including the new `imageUrl` field and validation rules.

---

## Entity & Validation

**Entity fields (`Color`):**
- `id: string` (UUID, primary key)
- `name: string` (required, indexed, max length 100)
- `hexCode?: string` (optional, stored as `hex_code`, format `#RRGGBB`)
- `imageUrl?: string` (optional, valid HTTP/HTTPS URL)
- `createdAt: string` (ISO 8601 datetime)
- `updatedAt: string` (ISO 8601 datetime)

**Create DTO (`CreateColorDto`):**
- `name: string` (required)
- `hexCode?: string`
  - Optional
  - Must match regex: `^#[0-9A-Fa-f]{6}$`
- `imageUrl?: string`
  - Optional
  - Must be a valid URL with protocol `http` or `https`
  - TLD required (cannot be `http://localhost` etc.)

**Update DTO (`UpdateColorDto`):**
- Partial of `CreateColorDto` – all fields optional:
  - `name?: string`
  - `hexCode?: string`
  - `imageUrl?: string`

**Uniqueness rule:**
- `name` must be unique (business rule).
- On create:
  - If a color with the same `name` already exists → `409 Conflict` with message `Color already exists`.
- On update:
  - If updating `name` to a value that already exists on a different color → `409 Conflict` with message `Color already exists`.

---

## Endpoints

Base path: `/colors`

All examples assume admin or internal usage; add auth headers as needed depending on your global guards.

### Create Color

- **Method**: `POST`
- **Path**: `/colors`
- **Body**:

```json
{
  "name": "Black",
  "hexCode": "#000000",
  "imageUrl": "https://cdn.example.com/colors/black.png"
}
```

- **201 Created – Response:**

```json
{
  "id": "<uuid>",
  "name": "Black",
  "hexCode": "#000000",
  "imageUrl": "https://cdn.example.com/colors/black.png",
  "createdAt": "2025-11-28T00:00:00.000Z",
  "updatedAt": "2025-11-28T00:00:00.000Z"
}
```

- **Error cases:**
  - `409 Conflict` – `Color already exists`
  - `400 Bad Request` – validation error on `hexCode` or `imageUrl`

---

### List Colors

- **Method**: `GET`
- **Path**: `/colors`
- **Sorting**: ordered by `name ASC`.

- **200 OK – Response:**

```json
[
  {
    "id": "<uuid>",
    "name": "Black",
    "hexCode": "#000000",
    "imageUrl": "https://cdn.example.com/colors/black.png",
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z"
  },
  {
    "id": "<uuid>",
    "name": "Blue",
    "hexCode": "#0000FF",
    "imageUrl": null,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z"
  }
]
```

---

### Get Color by ID

- **Method**: `GET`
- **Path**: `/colors/:id`
- **Params**:
  - `id: string` (UUID)

- **200 OK – Response:**

```json
{
  "id": "<uuid>",
  "name": "Black",
  "hexCode": "#000000",
  "imageUrl": "https://cdn.example.com/colors/black.png",
  "createdAt": "2025-11-28T00:00:00.000Z",
  "updatedAt": "2025-11-28T00:00:00.000Z"
}
```

- **Error cases:**
  - `404 Not Found` – `Color not found`

---

### Update Color

- **Method**: `PATCH`
- **Path**: `/colors/:id`
- **Params**:
  - `id: string` (UUID)
- **Body (partial, only send changed fields):**

```json
{
  "name": "Midnight Black",
  "hexCode": "#050505",
  "imageUrl": "https://cdn.example.com/colors/midnight-black.png"
}
```

- **200 OK – Response:** same shape as "Get Color by ID".

- **Error cases:**
  - `404 Not Found` – `Color not found`
  - `409 Conflict` – `Color already exists` (duplicate `name`)
  - `400 Bad Request` – `Unable to update color` (generic update failure or invalid payload)

---

### Delete Color

- **Method**: `DELETE`
- **Path**: `/colors/:id`
- **Params**:
  - `id: string` (UUID)

- **204 No Content – Response:**
  - Empty body.

- **Error cases:**
  - `404 Not Found` – `Color not found`

---

## Frontend Integration Notes

- Use `GET /colors` to populate color selectors for product variants.
- Display color using both `name` and, where useful, a swatch based on `hexCode` or thumbnail from `imageUrl`.
- When creating or updating product variants, always persist the color `id` (UUID) rather than the display `name`.
- For admin tools that manage the color catalog, surface backend error messages (`Color already exists`, `Color not found`) directly or map them to localized UI strings.



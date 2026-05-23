# Food Corner & Restaurants API

Base URL: `{APP_URL}/api`

## Authentication

Protibeshi supports **JWT** (existing `/signin`) and **Sanctum personal access tokens**.

| Method | Header |
|--------|--------|
| JWT | `Authorization: Bearer {jwt_token}` |
| Sanctum | `Authorization: Bearer {sanctum_token}` |

### Create Sanctum token

`POST /api/auth/token`

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "device_name": "web"
}
```

Response:

```json
{
  "success": true,
  "message": "Token created successfully",
  "data": {
    "token": "1|plainTextToken...",
    "token_type": "Bearer",
    "user": { "id": 1, "email": "user@example.com", "username": "jane" }
  }
}
```

Revoke: `DELETE /api/auth/token` (Sanctum tokens only).

## Response format

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 3,
      "per_page": 12,
      "total": 30,
      "from": 1,
      "to": 12
    }
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

## Public endpoints

### List restaurants (approved only)

`GET /api/restaurants`

Query: `q`, `category`, `location`, `price_range`, `delivery_available`, `verified_only`, `top_rated`, `newest`, `min_rating`, `per_page`

### Restaurant details

`GET /api/restaurants/{id_or_slug}`

Increments `views_count` for approved listings. Owners/admins can view pending/rejected.

### List reviews

`GET /api/restaurants/{id}/reviews`

## Protected endpoints

Middleware: `auth.api_or_sanctum`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/account/restaurants` | Current user's listings |
| GET | `/account/restaurant-favorites` | Saved restaurants |
| POST | `/restaurants` | Create (status: pending) |
| PUT | `/restaurants/{id}` | Update own listing |
| DELETE | `/restaurants/{id}` | Soft delete own listing |
| POST | `/restaurants/{id}/favorite` | Add favorite |
| DELETE | `/restaurants/{id}/favorite` | Remove favorite |
| POST | `/restaurants/{id}/reviews` | Add review |
| PUT | `/restaurants/reviews/{reviewId}` | Update own review |
| DELETE | `/restaurants/reviews/{reviewId}` | Delete own review |

## Admin moderation

Guard: `auth:admin_api`, prefix `/api/admin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/restaurants` | All restaurants (any status) |
| PATCH | `/restaurants/{id}/status` | Approve / reject / pending |
| DELETE | `/restaurants/{id}` | Soft delete with reason |

`PATCH` body:

```json
{
  "status": "approved",
  "is_verified": true,
  "note": "Verified by admin"
}
```

## Create restaurant

`POST /api/restaurants`  
`Content-Type: multipart/form-data`

| Field | Rules |
|-------|-------|
| name | required |
| category | required |
| address, location, phone, description, price_range | required |
| delivery_available | optional boolean |
| image, cover_image | optional image max 4MB |
| images[] | optional gallery, max 6 |
| latitude, longitude | optional |

## Example success (detail)

```json
{
  "success": true,
  "message": "Restaurant details fetched successfully",
  "data": {
    "id": 1,
    "name": "Dhaka Biryani House",
    "slug": "dhaka-biryani-house",
    "category": "Bengali",
    "location": "Dhaka",
    "rating": 4.5,
    "total_reviews": 12,
    "is_verified": true,
    "status": "approved",
    "image_url": "http://localhost/storage/restaurants/abc.jpg",
    "is_favorited": false,
    "description": "...",
    "images": [{ "id": 1, "image_url": "..." }],
    "reviews": [{ "id": 1, "rating": 5, "review": "Excellent", "user": { "id": 2, "name": "Jane Doe" } }]
  }
}
```

## Setup

```bash
cd server
php artisan migrate
php artisan storage:link
php artisan db:seed --class=RestaurantSeeder
php artisan restaurants:recalculate-ratings
```

Images are stored on the `public` disk under `storage/app/public/restaurants/`.

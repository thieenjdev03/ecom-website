# Users API Documentation

## Overview
The Users API provides comprehensive CRUD operations for managing user accounts in the e-commerce system. All endpoints require authentication and admin privileges.

## Base URL
```
http://localhost:3000/api/users
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles
- `admin`: Full access to all user management operations
- `user`: Regular user with limited access

## API Endpoints

### 1. Create User
**POST** `/users`

Creates a new user account. Only admins can create users.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user",
  "profile": "John Doe"
}
```

#### Response
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "profile": "John Doe",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Success",
  "success": true
}
```

#### Error Responses
- `400 Bad Request`: Invalid input data
- `409 Conflict`: User with this email already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

### 2. Get All Users
**GET** `/users`

Retrieves a paginated list of users with optional filtering and sorting.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `email` | string | No | Filter by email (partial match) | `user@example.com` |
| `role` | string | No | Filter by role | `admin` or `user` |
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 10, max: 100) | `10` |
| `sortBy` | string | No | Sort field (default: createdAt) | `email`, `role`, `createdAt` |
| `sortOrder` | string | No | Sort order (default: DESC) | `ASC` or `DESC` |

#### Example Request
```
GET /users?page=1&limit=10&role=user&sortBy=email&sortOrder=ASC
```

#### Response
```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "email": "user@example.com",
        "role": "user",
        "profile": "John Doe",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "message": "Success",
  "success": true
}
```

### 3. Get User by ID
**GET** `/users/:id`

Retrieves a specific user by their ID.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Example Request
```
GET /users/1
```

#### Response
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "profile": "John Doe",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Success",
  "success": true
}
```

#### Error Responses
- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

### 4. Update User
**PATCH** `/users/:id`

Updates user information. Only admins can update users.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Request Body
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123",
  "role": "admin",
  "profile": "Updated Profile"
}
```

#### Response
```json
{
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "role": "admin",
    "profile": "Updated Profile",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "message": "Success",
  "success": true
}
```

#### Error Responses
- `400 Bad Request`: Invalid input data
- `404 Not Found`: User not found
- `409 Conflict`: User with this email already exists
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

### 5. Delete User
**DELETE** `/users/:id`

Deletes a user account. Only admins can delete users.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | User ID |

#### Example Request
```
DELETE /users/1
```

#### Response
```
Status: 204 No Content
```

#### Error Responses
- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

## Data Models

### User Object
```typescript
interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  profile?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

### Create User Request
```typescript
interface CreateUserRequest {
  email: string;
  password: string; // minimum 6 characters
  role: 'admin' | 'user';
  profile?: string;
}
```

### Update User Request
```typescript
interface UpdateUserRequest {
  email?: string;
  password?: string; // minimum 6 characters
  role?: 'admin' | 'user';
  profile?: string;
}
```

### User List Response
```typescript
interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}
```

## Error Handling

All API responses follow this structure:

### Success Response
```json
{
  "data": any,
  "message": "Success",
  "success": true
}
```

### Error Response
```json
{
  "data": null,
  "message": "Error message",
  "success": false
}
```

## Frontend Integration Examples

### JavaScript/TypeScript
```typescript
// Create user
const createUser = async (userData: CreateUserRequest) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Get users with pagination
const getUsers = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await fetch(`/api/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Update user
const updateUser = async (id: number, userData: UpdateUserRequest) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Delete user
const deleteUser = async (id: number) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.status === 204;
};
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const response = await getUsers(page, 10, filters);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers };
};
```

## Testing with cURL

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "user",
    "profile": "Test User"
  }'
```

### Get Users
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "profile": "Updated Profile"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes
- All timestamps are in ISO 8601 format
- Password validation requires minimum 6 characters
- Email addresses must be unique
- Only admin users can perform CRUD operations on users
- The API uses JWT tokens for authentication
- All responses are wrapped in a standard format with `data`, `message`, and `success` fields

## Auth

### Login
**POST** `/auth/login`

Authenticate a user with email and password and receive access/refresh tokens.

#### Base URL
```
http://localhost:3000/api
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Validation:
- `email`: must be a valid email
- `password`: minimum length 8 characters

#### Response
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    },
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  },
  "message": "Success",
  "success": true
}
```

Notes:
- `accessToken` has a short TTL (e.g., 15m) and is used in the `Authorization: Bearer <token>` header.
- `refreshToken` has a longer TTL (e.g., 7d) and is used to obtain new tokens via the refresh endpoint.

#### Error Responses
- `400 Bad Request`: Validation failed (invalid email format, password too short)
- `401 Unauthorized`: Invalid credentials (wrong email or password)

#### cURL Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

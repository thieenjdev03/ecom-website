User & Auth Module Design Document

1. Overview

We need to implement User management and Authentication/Authorization for an e-commerce system. There will be two main roles:
	•	Admin: manage users (create, update, delete, list)
	•	User: regular customer (register, login, manage own profile)

⸻

2. Data Model

Entity: User
	•	id (UUID, PK)
	•	email (string, unique)
	•	passwordHash (string, hidden by default)
	•	role (enum: admin, user)
	•	refreshTokenHash (string, nullable)
	•	isActive (boolean, default: true)
	•	createdAt (timestamp)
	•	updatedAt (timestamp)

Enum: Role
	•	ADMIN
	•	USER

⸻

3. API Endpoints

Auth
	•	POST /auth/register — Public — register new user (default role: user)
	•	POST /auth/login — Public — login with email + password
	•	POST /auth/refresh — Public — refresh token
	•	POST /auth/logout — Auth required — clear refresh token

Users
	•	GET /users/me — Auth required — get own profile
	•	PATCH /users/me — Auth required — update own profile (not role)
	•	GET /users — Admin only — list all users (pagination)
	•	POST /users — Admin only — create user (can set role)
	•	GET /users/:id — Admin only — get user detail
	•	PATCH /users/:id — Admin only — update user info/role
	•	DELETE /users/:id — Admin only — soft delete user (isActive=false)

⸻

4. Auth Flow
	•	Register: email + password → bcrypt hash → save user
	•	Login: validate email/password → issue accessToken (short TTL) + refreshToken (long TTL)
	•	Refresh: validate refreshToken against DB → issue new tokens
	•	Logout: clear stored refreshTokenHash

⸻

5. Security
	•	Passwords hashed with bcrypt (cost=12)
	•	Refresh tokens also hashed in DB (cannot be reused if stolen)
	•	JWT payload: { sub: user.id, role: user.role, email: user.email }
	•	Guards:
	•	JwtAuthGuard: validates JWT access tokens
	•	RolesGuard: enforces @Roles(Role.ADMIN) decorator

⸻

6. Migration & Seeding
	•	Migration to create users table
	•	Seed script to create default Admin:
	•	email: admin@local.dev
	•	password: Admin@12345

⸻

7. Future Enhancements
	•	Email verification
	•	Password reset flow
	•	Audit logging
	•	Rate limiting on auth endpoints
	•	Soft delete with deletedAt timestamp instead of boolean

⸻

8. Responsibilities
	•	AuthModule: register, login, refresh, logout, JWT strategy
	•	UsersModule: CRUD for users, profile management
	•	Guards: JwtAuthGuard, RolesGuard
	•	Decorators: @Roles() for role-based access control
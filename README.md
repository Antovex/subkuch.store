# SubkuchStore

E-commerce microservices platform built with Nx monorepo architecture.

## Overview

Nx-powered Node.js/TypeScript monorepo containing:

- **API Gateway** — Rate-limited reverse proxy with CORS and request logging
- **Auth Service** — OTP-based authentication with MongoDB and Redis
- **E2E Tests** — Automated testing suite for auth flows
- **Shared Packages** — Reusable error handling, database clients

## Quick Start

### Prerequisites

- Node.js 20+
- npm 8+
- MongoDB (local or Atlas connection string)
- Redis server (optional for OTP features)

### Install Dependencies

```powershell
npm ci
```

### Environment Setup

Create `.env` file in the root:

```env
# API Gateway
PORT=8080

# Auth Service
PORT=6001
DATABASE_URL=mongodb://localhost:27017/subkuch
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=your_password  # Optional
```

### Development

Run all services:

```powershell
npm run dev
```

Run individual services:

```powershell
npx nx serve @subkuch.store/api-gateway
npx nx serve @subkuch.store/auth-service
```

## Projects

### @subkuch.store/api-gateway

API gateway with rate limiting and request proxying.

- **Port:** 8080
- **Build:** Webpack
- **Endpoints:**
  - `GET /gateway-health` — Health check
  - `GET /` — Proxies to auth-service

**Features:**
- CORS with credential support
- Request logging (morgan)
- Rate limiting (100 req/15min unauthenticated, 1000 for authenticated)
- Cookie parsing
- 100MB body size limit

### @subkuch.store/auth-service

Authentication service with OTP-based registration.

- **Port:** 6001
- **Build:** esbuild
- **Endpoints:**
  - `GET /` — Health check
  - `POST /api/user-registration` — OTP registration

**Features:**
- MongoDB user storage (Prisma ORM)
- Redis-based OTP management (5min TTL)
- Rate limiting and spam prevention
- Email OTP delivery (Nodemailer)
- Docker support

**OTP Flow:**
1. Validates user input (email, name, password)
2. Checks for existing user
3. Enforces cooldowns and rate limits
4. Generates 4-digit OTP
5. Sends email via Nodemailer
6. Stores OTP in Redis (5min expiry)

### @subkuch.store/auth-service-e2e

End-to-end test suite for auth-service.

```powershell
npx nx e2e @subkuch.store/auth-service-e2e
```

## Shared Packages

### packages/error-handler

Centralized error handling:

- Custom error classes: `ValidationError`, `AuthError`, `NotFoundError`, etc.
- Express middleware for consistent error responses
- Structured JSON error output

### packages/libs/prisma

MongoDB ORM client (Prisma):

- Schema: `prisma/schema.prisma`
- Models: `users`, `images`
- Generated client: `generated/prisma/`

### packages/libs/redis

Redis client (ioredis):

- Singleton instance
- Used for OTP storage, rate limiting, cooldowns

## Common Commands

### Build

```powershell
# Build all projects
npx nx run-many -t build --all

# Build specific project
npx nx build @subkuch.store/api-gateway
npx nx build @subkuch.store/auth-service
```

### Test

```powershell
# Run unit tests
npx nx test @subkuch.store/auth-service

# Run e2e tests
npx nx e2e @subkuch.store/auth-service-e2e

# Typecheck all
npx nx run-many -t typecheck --all
```

### Docker (auth-service)

```powershell
# Build image
npx nx docker:build @subkuch.store/auth-service

# Run container
npx nx docker:run @subkuch.store/auth-service -- -p 3000:3000
```

### Swagger Documentation

Generate API docs for auth-service:

```powershell
cd apps/auth-service/src
node swagger.mjs
```

Output: `apps/auth-service/src/swagger-output.json`

## Architecture

```
┌─────────────────┐
│  API Gateway    │  Port 8080
│  (Rate Limit)   │
└────────┬────────┘
         │ Proxy
         ▼
┌─────────────────┐
│  Auth Service   │  Port 6001
│                 │
├─────────────────┤
│  Controllers    │
│  Routes         │
│  Utilities      │
└─────┬─────┬─────┘
      │     │
      ▼     ▼
┌───────┐  ┌──────┐
│MongoDB│  │Redis │
│(Users)│  │(OTP) │
└───────┘  └──────┘
```

## Nx Commands

### Visualize Dependency Graph

```powershell
npx nx graph
```

### Show Project Details

```powershell
npx nx show project @subkuch.store/auth-service
```

### Clear Cache

```powershell
npx nx reset
```

### Run Without Cache

```powershell
npx nx build @subkuch.store/auth-service --skip-nx-cache
```

## API Reference

### api-gateway (http://localhost:8080)

#### GET /gateway-health
Health check endpoint.

**Response:**
```json
{
  "message": "Welcome to api-gateway!"
}
```

#### GET /
Proxies to auth-service.

### auth-service (http://localhost:6001)

#### GET /
Health check endpoint.

**Response:**
```json
{
  "message": "Hello API"
}
```

#### POST /api/user-registration
Initiates OTP-based user registration.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "phone_number": "+1234567890",  // Optional for sellers
  "country": "US"                  // Optional for sellers
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent to your email. Please verify to complete registration."
}
```

**Error Responses:**
- `400` — Validation error (invalid email, missing fields)
- `400` — User already exists
- `400` — OTP cooldown (wait 1 minute)
- `400` — Too many OTP requests (hourly limit)
- `400` — Account locked (multiple failed attempts)

## Troubleshooting

### MongoDB Connection Issues

Verify `DATABASE_URL` format:

```env
# Local MongoDB
DATABASE_URL=mongodb://localhost:27017/subkuch

# MongoDB Atlas
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Redis Connection Issues

Check Redis is running:

```powershell
redis-cli ping
# Expected: PONG
```

### Port Already in Use

Change ports in `.env`:

```env
PORT=8081  # api-gateway
PORT=6002  # auth-service
```

### TypeScript Errors

Run typecheck to see errors:

```powershell
npx nx run-many -t typecheck --all
```

## Documentation

- **Architecture & Details:** `docs/CONTEXT.md`
- **Agent Instructions:** `AGENTS.md`
- **Nx Documentation:** [nx.dev](https://nx.dev)

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.9
- **Framework:** Express 4.21
- **Build Tools:** Nx 21.6, Webpack 5, esbuild 0.19
- **Database:** MongoDB (via Prisma 6.18)
- **Cache/Queue:** Redis (via ioredis 5.8)
- **Email:** Nodemailer 7.0
- **Testing:** Jest 30
- **Container:** Docker

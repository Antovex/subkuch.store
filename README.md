# SubkuchStore

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Nx](https://img.shields.io/badge/Nx-21.6-brightgreen.svg)](https://nx.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> E-commerce microservices platform built with Nx monorepo architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Projects](#-projects)
- [Shared Packages](#-shared-packages)
- [Architecture](#-architecture)
- [Common Commands](#-common-commands)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#license)

## Overview

SubkuchStore is a modern, scalable e-commerce platform built as a microservices architecture using Nx monorepo. This repository contains:

- **API Gateway** (Port 8080) — Rate-limited reverse proxy with CORS and request logging
- **Auth Service** (Port 6001) — OTP-based authentication with MongoDB and Redis
- **E2E Tests** — Automated testing suite for auth flows
- **Shared Packages** — Reusable error handling, Prisma client, Redis client

## ✨ Features

- 🏗️ **Nx Monorepo** — Efficient build system with caching and task orchestration
- 🔐 **Secure Authentication** — OTP-based registration with email verification
- 🚀 **API Gateway** — Centralized routing with rate limiting (100-1000 req/15min)
- 📦 **Shared Libraries** — DRY principle with reusable packages
- 🐳 **Docker Ready** — Containerized services for easy deployment
- 🧪 **Comprehensive Testing** — Unit and E2E tests with Jest
- 📊 **Database ORM** — Type-safe Prisma client for MongoDB
- ⚡ **Redis Caching** — Fast OTP storage, rate limiting, and spam protection
- 📧 **Email Integration** — Nodemailer with EJS templates for transactional emails
- 📝 **API Documentation** — Interactive Swagger UI at `/api-docs`

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **MongoDB** ([Local installation](https://www.mongodb.com/try/download/community) or [Atlas cloud](https://www.mongodb.com/cloud/atlas))
- **Redis** ([Download](https://redis.io/download)) - Required for OTP and caching features
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

1. **Clone the repository:**

```powershell
git clone https://github.com/Antovex/subkuch.store.git
cd subkuch.store
```

2. **Install dependencies:**

```powershell
npm ci
```

3. **Set up environment variables:**

Create a `.env` file in the root directory (see `.env.example` for template):

```env
# API Gateway Configuration
PORT=8080

# Auth Service Configuration
PORT=6001
HOST=localhost

# Database Configuration (MongoDB)
DATABASE_URL=mongodb://localhost:27017/subkuch
# For MongoDB Atlas:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty if no password

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_USER=               # Your Gmail address
SMTP_PASSWORD=           # App password if 2FA enabled (see below)
```

**Gmail 2FA Users:** Generate an App Password at Google Account → Security → 2-Step Verification → App Passwords

4. **Initialize the database:**

```powershell
npx prisma generate
npx prisma db push
```

5. **Start the services:**

```powershell
# Start all services in parallel
npm run dev

# Or start individually
npx nx serve '@subkuch.store/api-gateway'
npx nx serve '@subkuch.store/auth-service'
```

6. **Access the services:**

- **API Gateway:** http://localhost:8080/gateway-health
- **Auth Service:** http://localhost:6001/
- **Swagger API Docs:** http://localhost:6001/api-docs
- **API Docs JSON:** http://localhost:6001/docs.json

## 📂 Projects

### @subkuch.store/api-gateway

**Purpose:** API gateway with rate limiting and reverse proxy to backend services.

- **Port:** 8080 (configurable via `PORT` env)
- **Build:** Webpack 5
- **Entry:** `apps/api-gateway/src/main.ts`

**Endpoints:**
- `GET /gateway-health` — Health check endpoint
- `GET /*` — Proxies all other traffic to auth-service (http://localhost:6001)

**Features:**
- ✅ CORS configured for `http://localhost:3000` with credentials
- ✅ Request logging via Morgan (dev mode)
- ✅ Rate limiting:
  - Unauthenticated: 100 requests per 15 minutes (by IP)
  - Authenticated: 1000 requests per 15 minutes (by API key)
- ✅ Cookie parsing support
- ✅ 100MB request body limit
- ✅ Trust proxy enabled

**Commands:**
```powershell
npx nx build '@subkuch.store/api-gateway'
npx nx serve '@subkuch.store/api-gateway'
```

---

### @subkuch.store/auth-service

**Purpose:** Authentication service with OTP-based user registration and verification.

- **Port:** 6001 (configurable via `PORT` env)
- **Build:** Webpack (esbuild alternative available)
- **Entry:** `apps/auth-service/src/main.ts`
- **Database:** MongoDB via Prisma ORM
- **Cache:** Redis for OTP and rate limiting

**API Endpoints:**

#### `GET /`
Health check endpoint
```json
Response: { "message": "Hello API" }
```

#### `POST /api/user-registration`
Register a new user and send OTP via email

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone_number": "+1234567890",  // Optional (required for sellers)
  "country": "US"                  // Optional (required for sellers)
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent to your email. Please verify to complete registration."
}
```

**Error Responses (400):**
- Missing required fields
- Invalid email format
- User already exists
- Too many OTP requests (spam protection)
- Account locked due to failed attempts

#### `POST /api/verify-user`
Verify OTP and complete user registration

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "1234",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**OTP Security Features:**
- ✅ 4-digit random OTP (1000-9999)
- ✅ 5-minute expiry (configurable)
- ✅ 1-minute cooldown between requests
- ✅ 2 requests per hour limit
- ✅ 1-hour spam lock after exceeding limits
- ✅ 30-minute account lock after multiple failed verifications

**Redis Keys:**
| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `otp:{email}` | Store OTP value | 5 minutes |
| `otp_cooldown:{email}` | Prevent rapid requests | 1 minute |
| `otp_request_count:{email}` | Track hourly requests | 1 hour |
| `otp_spam_lock:{email}` | Spam protection lock | 1 hour |
| `otp_lock:{email}` | Failed verification lock | 30 minutes |

**Commands:**
```powershell
# Development
npx nx build '@subkuch.store/auth-service'
npx nx serve '@subkuch.store/auth-service'

# Docker
npx nx docker:build '@subkuch.store/auth-service'
npx nx docker:run '@subkuch.store/auth-service' -- -p 3000:3000

# Generate Swagger docs
cd apps/auth-service/src
node swagger.mjs
```

---

### @subkuch.store/auth-service-e2e

**Purpose:** End-to-end testing suite for auth-service.

- **Framework:** Jest 30
- **Type:** E2E tests
- **Dependencies:** Requires auth-service build and serve

**Commands:**
```powershell
npx nx e2e '@subkuch.store/auth-service-e2e'
```

---

## 📦 Shared Packages

### packages/error-handler

Centralized error handling for all services.

**Error Classes:**
- `AppError` — Base error class with status codes
- `ValidationError` — 400 validation errors
- `AuthError` — 401 authentication errors
- `ForbiddenError` — 403 authorization errors
- `NotFoundError` — 404 resource not found
- `DatabaseError` — 500 database errors
- `RateLimitError` — 429 rate limit exceeded
- `TimeoutError` — 504 request timeout

**Middleware:**
```typescript
import { errorMiddleware } from "@packages/error-handler/error-middleware";
app.use(errorMiddleware); // Must be last
```

### packages/libs/prisma

MongoDB ORM client singleton.

**Models:**
- `users` — User accounts with email, password, avatar
- `images` — User profile images

**Usage:**
```typescript
import prisma from "@packages/libs/prisma";
const user = await prisma.users.findUnique({ where: { email } });
```

### packages/libs/redis

Redis client singleton for caching and OTP management.

**Usage:**
```typescript
import redis from "@packages/libs/redis";
await redis.set("otp:user@example.com", "1234", "EX", 300);
const otp = await redis.get("otp:user@example.com");
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Client (Browser)            │
│      http://localhost:3000          │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │
               ▼
┌──────────────────────────────────────┐
│    API Gateway (Port 8080)           │
│  ┌────────────────────────────────┐  │
│  │ Rate Limiter                   │  │
│  │ CORS Handler                   │  │
│  │ Request Logger                 │  │
│  │ Cookie Parser                  │  │
│  └────────────┬───────────────────┘  │
│               │ Reverse Proxy        │
└───────────────┼──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Auth Service (Port 6001)            │
│  ┌────────────────────────────────┐  │
│  │ /api/user-registration         │  │
│  │ /api/verify-user               │  │
│  │ /api-docs (Swagger UI)         │  │
│  └────┬──────────────────┬────────┘  │
└───────┼──────────────────┼────────────┘
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │    Redis     │
│              │    │              │
│ - users      │    │ - OTP        │
│ - images     │    │ - Locks      │
└──────────────┘    └──────────────┘
```

**Request Flow:**
1. Client → API Gateway (rate limit check)
2. API Gateway → Auth Service (proxy)
3. Auth Service → MongoDB (user data) / Redis (OTP)
4. Response flows back through the chain

---

## 🔧 Common Commands

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

### Nx Utilities

```powershell
# Visualize dependency graph
npx nx graph

# Show project details
npx nx show project "@subkuch.store/auth-service"

# Clear Nx cache
npx nx reset

# Build without cache (for debugging)
npx nx build "@subkuch.store/auth-service" --skip-nx-cache
```

### Database Commands (Prisma)

```powershell
# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Push schema to database
npx prisma db push
```

---

## ⚠️ Troubleshooting

### MongoDB Connection Issues

**Problem:** Cannot connect to MongoDB

**Solutions:**
1. Verify `DATABASE_URL` format in `.env`:
   ```env
   # Local MongoDB
   DATABASE_URL=mongodb://localhost:27017/subkuch
   
   # MongoDB Atlas
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
   ```

2. Ensure MongoDB is running:
   ```powershell
   # Test connection
   mongosh --eval "db.version()"
   ```

3. Regenerate Prisma client:
   ```powershell
   npx prisma generate
   ```

### Redis Connection Issues

**Problem:** Redis connection refused or timeout

**Solutions:**
1. Check Redis is running:
   ```powershell
   redis-cli ping
   # Expected: PONG
   ```

2. Verify `.env` settings:
   ```env
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_PASSWORD=          # Leave empty if no password
   ```

3. Start Redis if not running (Windows):
   ```powershell
   # Using WSL
   sudo service redis-server start
   ```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use`

**Solutions:**
1. Change ports in `.env`:
   ```env
   PORT=8081  # api-gateway (default 8080)
   PORT=6002  # auth-service (default 6001)
   ```

2. Kill process using the port:
   ```powershell
   # Find process ID
   netstat -ano | findstr :8080
   
   # Kill process (replace <PID> with actual process ID)
   taskkill /PID <PID> /F
   ```

### Nx Project Graph Errors

**Problem:** `implicitDependencies point to non-existent project`

**Solutions:**
1. Verify project names match in `package.json`:
   ```json
   {
     "name": "@subkuch.store/auth-service",
     "nx": {
       "name": "@subkuch.store/auth-service"
     }
   }
   ```

2. Clear Nx cache:
   ```powershell
   npx nx reset
   ```

### Prisma Client Issues

**Problem:** `@prisma/client did not initialize yet`

**Solutions:**
1. Check import path in `packages/libs/prisma/index.ts`:
   ```typescript
   import { PrismaClient } from "../../../generated/prisma/client";
   ```

2. Ensure generated folder is in `tsconfig.app.json`:
   ```json
   {
     "include": ["../../generated/**/*.ts"]
   }
   ```

3. Regenerate client:
   ```powershell
   npx prisma generate
   ```

### Error Middleware Issues

**Problem:** `res.status is not a function` in Express error handler

**Solution:** Ensure error middleware has 4 parameters:
```typescript
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction  // Required for Express to recognize it as error middleware
) => {
  // ... error handling logic
};
```

### Email Delivery Issues

**Problem:** SMTP authentication failed or emails not sending

**Solutions:**
1. For Gmail with 2FA enabled, use App Password (not regular password):
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate new app password
   - Use it in `.env`:
     ```env
     SMTP_USER=your-email@gmail.com
     SMTP_PASSWORD=your-app-password-here
     ```

2. Verify SMTP settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SERVICE=gmail
   ```

### TypeScript Errors

**Problem:** Type errors in codebase

**Solutions:**
1. Run typecheck to identify errors:
   ```powershell
   npx nx run-many -t typecheck --all
   ```

2. Check for missing type definitions:
   ```powershell
   npm install --save-dev @types/<package-name>
   ```

### Build Errors

**Problem:** Webpack or esbuild compilation errors

**Solutions:**
1. Clear build cache:
   ```powershell
   npx nx reset
   rm -r dist/
   ```

2. Rebuild with verbose output:
   ```powershell
   npx nx build "@subkuch.store/auth-service" --verbose
   ```

3. Check for missing dependencies:
   ```powershell
   npm install
   ```

---

## 📚 Documentation

- **Comprehensive Technical Reference:** [`docs/CONTEXT.md`](docs/CONTEXT.md) — Complete architecture, configurations, troubleshooting
- **AI Agent Instructions:** [`AGENTS.md`](AGENTS.md) — Quick reference for working with the codebase
- **API Documentation:** [http://localhost:6001/api-docs](http://localhost:6001/api-docs) — Interactive Swagger UI (when auth-service is running)
- **Nx Workspace:** [nx.dev](https://nx.dev) — Official Nx documentation
- **Prisma ORM:** [prisma.io/docs](https://www.prisma.io/docs) — Database toolkit documentation

---

## 🛠️ Tech Stack

### Core
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.9
- **Framework:** Express 4.21
- **Monorepo:** Nx 21.6

### Build & Bundle
- **Build Tools:** Webpack 5, esbuild 0.19
- **Module Bundler:** Nx build system with smart caching

### Data Layer
- **Database:** MongoDB (via Prisma 6.18)
- **ORM:** Prisma Client with TypeScript support
- **Cache/Queue:** Redis (via ioredis 5.8)

### Communication
- **Email:** Nodemailer 7.0
- **HTTP Client:** Axios (for service-to-service communication)

### Development Tools
- **Testing:** Jest 30
- **Linting:** ESLint
- **Container:** Docker
- **API Documentation:** Swagger

## 📁 Project Structure

```
subkuch.store/
├── apps/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/          # Authentication service
│   └── auth-service-e2e/      # E2E tests for auth service
├── packages/
│   ├── error-handler/         # Centralized error handling
│   └── libs/
│       ├── prisma/            # Prisma ORM client
│       └── redis/             # Redis client
├── prisma/
│   └── schema.prisma          # Database schema
├── docs/                      # Additional documentation
├── generated/                 # Generated Prisma client
├── nx.json                    # Nx workspace configuration
└── package.json               # Root package configuration
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:**
   ```powershell
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes and commit:**
   ```powershell
   git commit -m "feat: add amazing feature"
   ```
4. **Push to your branch:**
   ```powershell
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

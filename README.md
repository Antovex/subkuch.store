# SubkuchStore

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Nx](https://img.shields.io/badge/Nx-21.6-brightgreen.svg)](https://nx.dev)

> E-commerce microservices platform built with Nx monorepo architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Projects](#projects)
- [Shared Packages](#shared-packages)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

SubkuchStore is a modern, scalable e-commerce platform built as a microservices architecture using Nx monorepo. This repository contains:

- **API Gateway** — Rate-limited reverse proxy with CORS and request logging
- **Auth Service** — OTP-based authentication with MongoDB and Redis
- **E2E Tests** — Automated testing suite for auth flows
- **Shared Packages** — Reusable error handling, database clients

## ✨ Features

- 🏗️ **Nx Monorepo** — Efficient build system with caching and task orchestration
- 🔐 **Secure Authentication** — OTP-based registration with email verification
- 🚀 **API Gateway** — Centralized routing with rate limiting and security
- 📦 **Shared Libraries** — DRY principle with reusable packages
- 🐳 **Docker Ready** — Containerized services for easy deployment
- 🧪 **Comprehensive Testing** — Unit and E2E tests with Jest
- 📊 **Database ORM** — Type-safe Prisma client for MongoDB
- ⚡ **Redis Caching** — Fast OTP storage and rate limiting
- 📧 **Email Integration** — Nodemailer for transactional emails

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

Create a `.env` file in the root directory:

```env
# API Gateway Configuration
PORT=8080

# Auth Service Configuration
PORT=6001
HOST=localhost

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/subkuch
# For MongoDB Atlas:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=your_password  # Optional, uncomment if needed

# Email Configuration (for OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
OTP_EXPIRY=300  # 5 minutes in seconds
```

4. **Initialize the database:**

```powershell
npx prisma generate
npx prisma db push
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

# NestJS Backend Boilerplate

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  A production-ready <a href="http://nestjs.com" target="_blank">NestJS</a> backend boilerplate template with authentication, authorization, rate limiting, background jobs, and more.
</p>

<p align="center">
  <a href="https://github.com/fuunshi/clarity-backend/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg" alt="TypeScript" /></a>
</p>

## Description

A comprehensive NestJS boilerplate template created by **[@fuunshi](https://github.com/fuunshi)**. This template provides a solid foundation for building scalable, production-ready backend applications with best practices built-in.

## Project Structure

```
src/
├── app.module.ts           # Main application module
├── app.controller.ts       # Root controller
├── app.service.ts          # Root service
├── main.ts                 # Application entry point
├── api/                    # API modules
│   ├── api.module.ts       # API module aggregator
│   ├── auth/               # Authentication module
│   └── users/              # Users module
├── common/                 # Shared resources
│   ├── modules/            # Global modules
│   │   ├── config/         # Configuration module
│   │   │   ├── app.config.ts
│   │   │   ├── auth.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── throttler.config.ts
│   │   ├── logger/         # Logging service
│   │   ├── throttler/      # Rate limiting
│   │   ├── queue/          # BullMQ workers
│   │   ├── prisma/         # Database service
│   │   └── cloudinary/     # File upload service
│   ├── interceptors/       # Request/Response interceptors
│   ├── filter/             # Exception filters
│   ├── guard/              # Auth guards
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Shared DTOs
│   ├── constant/           # Constants
│   └── types/              # Shared types
└── utils/                  # Utility functions
```

## Features

### Standardized Response Format

All API responses are automatically wrapped with a standard format including requestId:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": { ... },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Configuration Module

Centralized configuration using `@nestjs/config` with typed config files:

- **app.config.ts**: Port, environment settings
- **auth.config.ts**: JWT secret, expiration
- **redis.config.ts**: Redis connection settings
- **throttler.config.ts**: Rate limiting configuration

```typescript
// Inject and use configuration
constructor(private configService: ConfigService) {}

const jwtSecret = this.configService.get<string>('auth.jwtSecret');
const redisHost = this.configService.get<string>('redis.host');
```

### BullMQ Workers

Background job processing with BullMQ:

- **Queue Module**: Centralized queue configuration with Redis connection
- **Queue Service**: Service for adding jobs to queues
- **Example Processor**: Demonstrates worker patterns with job processing, completion, and failure handling

```typescript
// Add a job to the queue
await queueService.addExampleJob({ data: 'your-data' });
```

### Throttler (Rate Limiting)

Multi-tier rate limiting configured globally:

| Tier   | TTL      | Limit | Description             |
| ------ | -------- | ----- | ----------------------- |
| Short  | 1 second | 3     | 3 requests per second   |
| Medium | 10 secs  | 20    | 20 requests per 10 secs |
| Long   | 1 minute | 100   | 100 requests per minute |

Use `@SkipThrottle()` decorator to exclude specific routes.

### Request UUID Interceptor

Every request receives a unique identifier:

- **Request ID**: UUID assigned to each request (or uses existing `X-Request-ID` header)
- **Response Header**: `X-Request-ID` included in all responses
- **Structured Logging**: All logs include the request ID for traceability

### Logging

Dual-output logging with pino:

- **Normal logs** (info, debug, verbose, warn): Output to stdout (or `logs/app.log` in production)
- **Error logs** (error, fatal): Output to stderr (or `logs/error.log` in production)

## Project setup

```bash
$ npm install
```

## Environment Variables

Copy `.env.template` to `.env` and configure:

```env
# App Configuration
PORT=3000
NODE_ENV=development

# Auth Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1d

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# Redis Configuration for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Throttler Configuration (optional - defaults shown)
# THROTTLE_SHORT_TTL=1000
# THROTTLE_SHORT_LIMIT=3
# THROTTLE_MEDIUM_TTL=10000
# THROTTLE_MEDIUM_LIMIT=20
# THROTTLE_LONG_TTL=60000
# THROTTLE_LONG_LIMIT=100
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [NestJS deployment documentation](https://docs.nestjs.com/deployment) for more information.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) ORM
- **Caching/Queue**: [Redis](https://redis.io/) with [BullMQ](https://bullmq.io/)
- **Authentication**: JWT with refresh tokens
- **Authorization**: [CASL](https://casl.js.org/) for role-based access control
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Pino with structured logging

## Author

**fuunshi** - [@fuunshi](https://github.com/fuunshi)

## License

This project is [MIT licensed](./LICENSE).

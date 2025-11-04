# Pilfer Backend API

High-performance web extraction engine with 95%+ website compatibility.

## 🏴‍☠️ Overview

The Pilfer Backend API provides server-side extraction capabilities using Playwright for full browser automation, enabling extraction from:

- ✅ Static HTML sites
- ✅ Dynamic SPAs (React, Vue, Angular)
- ✅ Server-rendered applications (Next.js, Nuxt)
- ✅ Authenticated websites
- ✅ JavaScript-heavy applications

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0
- (Optional) Redis for caching
- (Optional) PostgreSQL for persistent storage

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

Server will start at `http://localhost:3000`

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Health Check

```bash
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 12345,
    "engines": { ... },
    "dependencies": { ... }
  }
}
```

### Extract

```bash
POST /api/v1/extract
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "preferredEngine": "playwright",
    "timeout": 30000,
    "enableJavaScript": true,
    "extractAssets": true,
    "analysisDepth": "moderate"
  },
  "context": {
    "persona": "professor",
    "targetFramework": "react"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "...",
    "url": "https://example.com",
    "reconResult": {
      "colorPalette": [...],
      "typography": [...],
      "coreStyles": [...],
      "pageArchitecture": [...]
    },
    "framework": {
      "primary": { "name": "react", "confidence": 0.95 }
    }
  }
}
```

## 🔧 Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

### Key Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `PLAYWRIGHT_BROWSER` | Browser engine | `chromium` |
| `PLAYWRIGHT_TIMEOUT` | Extraction timeout | `30000` |
| `ENABLE_CACHING` | Enable Redis caching | `true` |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window | `100` |

## 🏗️ Architecture

```
pilfer-api/
├── src/
│   ├── server.ts              # Express server
│   ├── config/                # Configuration management
│   ├── routes/                # API routes
│   │   ├── health.ts          # Health check
│   │   └── extract.ts         # Extraction endpoint
│   ├── services/              # Business logic
│   │   ├── extractors/        # Extraction engines
│   │   └── orchestrator/      # Strategy pattern
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── rateLimiter.ts
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Utilities
│       └── logger.ts
├── package.json
├── tsconfig.json
└── .env
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint
```

## 🐳 Docker

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## 📊 Performance Targets

- **Latency**: <3s average (p95: <8s)
- **Throughput**: 50+ concurrent extractions
- **Website Compatibility**: 95%+
- **Uptime**: 99.9% SLA

## 🔐 Security

- Helmet.js security headers
- CORS protection
- Rate limiting (DDoS protection)
- Input validation (Zod)
- Browser sandbox isolation
- No file:// or localhost URLs allowed

## 📝 License

MIT

## 🤝 Contributing

See main Pilfer repository for contribution guidelines.

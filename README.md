# 100xPhoto - AI Image Generation Platform

100xPhoto is a powerful AI image platform that lets you generate stunning images and train custom AI models. Built with cutting-edge technology, it enables users to create unique AI-generated artwork and train personalized models on their own image datasets. Whether you're an artist looking to expand your creative possibilities or a developer building AI-powered image applications, 100xPhoto provides an intuitive interface and robust capabilities for AI image generation and model training.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js with TypeScript
- **Authentication**: Clerk
- **Containerization**: Docker
- **Package Management**: Bun
- **Monorepo Management**: Turborepo

## Project Structure

### Apps and Packages

- `web`: Next.js frontend application
- `backend`: Node.js backend service
- `@repo/ui`: Shared React component library
- `@repo/typescript-config`: Shared TypeScript configurations
- `@repo/eslint-config`: Shared ESLint configurations

## Getting Started

### Prerequisites

- Docker
- Bun (for local development)
- Clerk Account (for authentication)

### Environment Setup

1. Create `.env` files:

```bash
# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```


### Local Development

```bash
# Install dependencies
bun install

# Run development servers
bun run dev

# Build all packages
bun run build
```

## Features

- AI-powered image generation
- User authentication and authorization
- Image gallery with preview
- Download generated images
- Responsive design

## Development Commands

```bash
# Run frontend only
bun run start:web

# Run backend only
bun run start:backend

# Run both frontend and backend
bun run dev
```

## Docker Setup

### Environment Variables Required

```bash
# Frontend Environment Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuMTAweGRldnMuY29tJA
NEXT_PUBLIC_BACKEND_URL=https://api.photoaiv2.100xdevs.com
NEXT_PUBLIC_STRIPE_KEY=pk_test_51QsCmFEI53oUr5PHZw5ErO4Xy2lNh9LkH9vXDb8wc7BOvfSPc0i4xt6I5Qy3jaBLnvg9wPenPoeW0LvQ1x3GtfUm00eNFHdBDd
CLERK_SECRET_KEY=your_clerk_secret_key

# Backend Environment Variables
DATABASE_URL=your_database_url
```

### Docker Commands

```bash
# Navigate to docker directory
cd docker

# Build images
docker build -f Dockerfile.frontend -t photoai-frontend ..
docker build -f Dockerfile.backend -t photoai-backend ..

# Run frontend container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuMTAweGRldnMuY29tJA \
  -e NEXT_PUBLIC_BACKEND_URL=https://api.photoaiv2.100xdevs.com \
  -e NEXT_PUBLIC_STRIPE_KEY=pk_test_51QsCmFEI53oUr5PHZw5ErO4Xy2lNh9LkH9vXDb8wc7BOvfSPc0i4xt6I5Qy3jaBLnvg9wPenPoeW0LvQ1x3GtfUm00eNFHdBDd \
  -e CLERK_SECRET_KEY=your_clerk_secret_key \
  photoai-frontend

# Run backend container
docker run -p 8080:8080 \
  -e DATABASE_URL=your_database_url \
  photoai-backend

```


## Project Structure

```
.
├── apps
│   ├── web/                 # Next.js frontend
│   └── backend/            # Node.js backend
├── packages
│   ├── ui/                 # Shared UI components
│   ├── typescript-config/  # Shared TS config
│   └── eslint-config/     # Shared ESLint config
├── docker/                # Docker configuration
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

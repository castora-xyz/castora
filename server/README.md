# Castora - Server

This is a monorepo using npm workspaces containing all Castora server services.

## Architecture

- **shared** - Common utilities, types, and configurations used across all services
- **main** - Main API server (Express.js)
- **archiver** - Pool archiver service
- **syncer** - Pool synchronization service
- **completer** - Pool completion service
- **telegram** - Telegram bot worker

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Installation

Install all dependencies for all services:

```bash
npm install
```

### Building

Build all services:

```bash
npm run build
```

Build only the shared package:

```bash
npm run build:shared
```

### Development

Run a specific service in development mode:

```bash
npm run dev:main      # Main API server
npm run dev:archiver  # Pool archiver
npm run dev:syncer    # Pool syncer
npm run dev:completer # Pool completer
npm run dev:telegram  # Telegram worker
```

### Production

Start a specific service:

```bash
npm run start:main      # Main API server
npm run start:archiver  # Pool archiver
npm run start:syncer    # Pool syncer
npm run start:completer # Pool completer
npm run start:telegram  # Telegram worker
```

### Workspace Commands

Clean all build artifacts:

```bash
npm run clean
```

Run any command in a specific workspace:

```bash
npm run <command> --workspace=@castora/<package-name>
```

Add a dependency to a specific service:

```bash
npm install <package> --workspace=@castora/<service-name>
```

Add a dev dependency to a specific service:

```bash
npm install <package> --save-dev --workspace=@castora/<service-name>
```

## Service Dependencies

All services depend on the `@castora/shared` package which is automatically managed by the workspace configuration.

## Development Workflow

1. Run a specific service in development mode with `npm run dev:<service>`
2. **Automatic rebuilds**: The service will automatically rebuild and restart when you make changes to:
   - Files in the service's own `src/` directory
   - Files in the `shared/src/` directory
3. Both the shared package and the service will be rebuilt automatically when any watched files change

### Hot Reloading Behavior

When you modify files:

- **Service files** (`syncer/src/*`) → Rebuilds shared + service → Restarts service
- **Shared files** (`shared/src/*`) → Rebuilds shared + service → Restarts service

This ensures you always have the latest version of shared code when developing any service.

## TypeScript Configuration

The workspace uses a centralized TypeScript configuration:

- **`tsconfig.json`** (root) - Base TypeScript configuration shared across all services
- **`tsconfig.workspace.json`** (root) - Solution-style configuration for IDE support across all packages
- Each service extends the base configuration with service-specific settings
- All services have TypeScript references to the shared package for type checking
- Path mapping is configured to resolve `@castora/shared` imports correctly

For advanced TypeScript operations, you can use:

```bash
# Build all packages with TypeScript project references
npx tsc --build tsconfig.workspace.json

# Build with verbose output to see dependency resolution
npx tsc --build tsconfig.workspace.json --verbose
```

## Package Structure

Each service follows the same structure:

```
service/
├── src/           # TypeScript source code
├── lib/           # Compiled JavaScript (gitignored)
├── package.json   # Service-specific dependencies and scripts
└── tsconfig.json  # TypeScript configuration
```

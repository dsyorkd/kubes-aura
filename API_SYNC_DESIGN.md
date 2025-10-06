# API Synchronization & Documentation System

## Overview

This document describes the system for maintaining synchronized API definitions between `pi-controller` (Go backend) and `kubes-aura` (TypeScript web interface) using OpenAPI/Swagger specifications.

## Goals

1. **Single Source of Truth**: API definitions live in the pi-controller codebase
2. **Automatic Type Generation**: TypeScript types and API clients auto-generated from OpenAPI specs
3. **Clear Documentation**: Human-readable API docs for third-party developers
4. **AI-Friendly**: Structured specs that AI assistants can understand and work with
5. **Separation of Concerns**: Clear boundaries between backend API and frontend clients

## Architecture

### Data Flow

```
pi-controller (Go)
    ↓ (code annotations)
swag init
    ↓ (generates)
docs/openapi.yaml + docs/swagger.json
    ↓ (git commit)
kubes-aura syncs spec
    ↓ (runs generator)
TypeScript types + API client
    ↓ (used by)
React components
```

### Directory Structure

#### pi-controller
```
pi-controller/
├── docs/
│   ├── api/                          # API documentation
│   │   ├── openapi.yaml              # Generated OpenAPI 3.0 spec (canonical)
│   │   ├── swagger.json              # Generated Swagger JSON (for tools)
│   │   ├── README.md                 # API overview & getting started
│   │   └── CHANGELOG.md              # API version history
│   ├── examples/                     # API usage examples
│   │   ├── curl/                     # cURL examples
│   │   ├── go/                       # Go client examples
│   │   ├── typescript/               # TypeScript client examples
│   │   └── python/                   # Python client examples
│   └── [existing docs...]
├── internal/api/
│   ├── server.go                     # @title, @version, @description annotations
│   └── handlers/
│       ├── cluster.go                # @Summary, @Tags, @Param annotations
│       ├── node.go
│       ├── gpio.go
│       └── auth.go
├── scripts/
│   ├── generate-api-docs.sh          # Generates OpenAPI specs
│   └── validate-openapi.sh           # Validates spec before commit
└── .github/workflows/
    └── api-docs.yml                  # Auto-generates docs on commit
```

#### kubes-aura
```
kubes-aura/
├── api-spec/                         # Synced from pi-controller
│   ├── openapi.yaml                  # Source of truth (copied from pi-controller)
│   ├── README.md                     # How to sync and use
│   └── .sync-timestamp               # Last sync metadata
├── src/
│   ├── api/
│   │   ├── generated/                # Auto-generated (DO NOT EDIT)
│   │   │   ├── types.ts              # TypeScript types from OpenAPI
│   │   │   ├── client.ts             # API client methods
│   │   │   └── models.ts             # Request/response models
│   │   ├── client.ts                 # Custom API client wrapper
│   │   └── hooks.ts                  # React Query hooks
│   ├── types/
│   │   └── pi-controller.ts          # DEPRECATED - replaced by generated types
│   └── lib/
│       └── config.ts                 # API base URL configuration
├── scripts/
│   ├── sync-api-spec.sh              # Copies spec from pi-controller
│   └── generate-api-client.sh        # Generates TypeScript client
└── package.json                      # Includes generation scripts
```

## Implementation Steps

### Phase 1: pi-controller - Add Swagger Annotations

#### Install swaggo/swag

```bash
# In pi-controller directory
go install github.com/swaggo/swag/cmd/swag@latest
```

#### Add annotations to server.go

```go
// @title           Pi-Controller API
// @version         1.0
// @description     REST API for managing Raspberry Pi clusters, nodes, and GPIO resources
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://github.com/dsyorkd/pi-controller/issues
// @contact.email  support@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8765
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name X-API-Key
// @description API key for authentication
```

#### Add handler annotations

Example for cluster handler:

```go
// List godoc
// @Summary      List all clusters
// @Description  Get a list of all managed K3s clusters
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        status    query     string  false  "Filter by status (healthy, warning, critical)"
// @Param        page      query     int     false  "Page number (default 1)"
// @Param        limit     query     int     false  "Items per page (default 20)"
// @Success      200  {object}  handlers.ClusterListResponse
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Security     BearerAuth
// @Router       /clusters [get]
func (h *ClusterHandler) List(c *gin.Context) {
    // ... existing implementation
}
```

#### Create generation script

Create `pi-controller/scripts/generate-api-docs.sh`:

```bash
#!/bin/bash
set -e

echo "Generating OpenAPI documentation..."

# Generate swagger docs
swag init \
  --dir ./internal/api,./internal/api/handlers \
  --generalInfo server.go \
  --output ./docs/api \
  --outputTypes yaml,json \
  --parseInternal \
  --parseDependency

# Validate the generated spec
./scripts/validate-openapi.sh

echo "✅ API documentation generated successfully"
echo "  - YAML: docs/api/openapi.yaml"
echo "  - JSON: docs/api/swagger.json"
```

#### Create validation script

Create `pi-controller/scripts/validate-openapi.sh`:

```bash
#!/bin/bash
set -e

echo "Validating OpenAPI specification..."

# Install validator if not present
if ! command -v swagger &> /dev/null; then
    echo "Installing swagger validator..."
    go install github.com/go-swagger/go-swagger/cmd/swagger@latest
fi

# Validate OpenAPI spec
swagger validate ./docs/api/openapi.yaml

echo "✅ OpenAPI specification is valid"
```

#### Add to Makefile

```makefile
# In pi-controller/Makefile
.PHONY: api-docs
api-docs: ## Generate API documentation from code annotations
	@./scripts/generate-api-docs.sh

.PHONY: api-validate
api-validate: ## Validate OpenAPI specification
	@./scripts/validate-openapi.sh

.PHONY: api-serve
api-serve: ## Serve interactive API documentation
	@echo "Starting Swagger UI on http://localhost:8080"
	@docker run -p 8080:8080 \
		-e SWAGGER_JSON=/api/openapi.yaml \
		-v $(PWD)/docs/api:/api \
		swaggerapi/swagger-ui
```

### Phase 2: kubes-aura - Generate TypeScript Client

#### Install dependencies

```bash
# In kubes-aura directory
npm install --save-dev openapi-typescript-codegen
npm install axios
```

#### Update package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "sync-api": "./scripts/sync-api-spec.sh",
    "generate-api": "./scripts/generate-api-client.sh",
    "api-update": "npm run sync-api && npm run generate-api"
  }
}
```

#### Create sync script

Create `kubes-aura/scripts/sync-api-spec.sh`:

```bash
#!/bin/bash
set -e

PI_CONTROLLER_PATH="${PI_CONTROLLER_PATH:-../pi-controller}"
SPEC_SOURCE="$PI_CONTROLLER_PATH/docs/api/openapi.yaml"
SPEC_DEST="./api-spec/openapi.yaml"

echo "Syncing API spec from pi-controller..."

# Check if pi-controller directory exists
if [ ! -f "$SPEC_SOURCE" ]; then
    echo "❌ Error: OpenAPI spec not found at $SPEC_SOURCE"
    echo "   Please ensure pi-controller is in the correct location"
    echo "   or set PI_CONTROLLER_PATH environment variable"
    exit 1
fi

# Create api-spec directory if it doesn't exist
mkdir -p ./api-spec

# Copy the spec
cp "$SPEC_SOURCE" "$SPEC_DEST"

# Save sync timestamp
date > ./api-spec/.sync-timestamp

echo "✅ API spec synced successfully"
echo "  Source: $SPEC_SOURCE"
echo "  Destination: $SPEC_DEST"
```

#### Create generation script

Create `kubes-aura/scripts/generate-api-client.sh`:

```bash
#!/bin/bash
set -e

echo "Generating TypeScript API client from OpenAPI spec..."

# Check if spec exists
if [ ! -f "./api-spec/openapi.yaml" ]; then
    echo "❌ Error: OpenAPI spec not found at ./api-spec/openapi.yaml"
    echo "   Run 'npm run sync-api' first"
    exit 1
fi

# Remove old generated files
rm -rf ./src/api/generated

# Generate TypeScript client
npx openapi-typescript-codegen \
  --input ./api-spec/openapi.yaml \
  --output ./src/api/generated \
  --client axios \
  --useOptions \
  --useUnionTypes

echo "✅ TypeScript API client generated successfully"
echo "  Output: src/api/generated/"
```

#### Create API client wrapper

Create `kubes-aura/src/api/client.ts`:

```typescript
/**
 * API Client Wrapper
 *
 * This wraps the auto-generated API client with configuration and error handling.
 * DO NOT modify generated files directly - edit this wrapper instead.
 */

import { OpenAPI } from './generated';
import { config } from '@/lib/config';

// Configure the generated client
OpenAPI.BASE = config.piController.apiBaseUrl;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';

// Add auth token from localStorage
OpenAPI.TOKEN = async () => {
  const token = localStorage.getItem('auth_token');
  return token || '';
};

// Export all generated services
export * from './generated/services';
export * from './generated/models';
export type * from './generated/types';

// Custom error handler
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}
```

#### Create React Query hooks

Create `kubes-aura/src/api/hooks.ts`:

```typescript
/**
 * React Query Hooks for API
 *
 * Custom hooks that wrap the generated API client with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClusterService, NodeService, GpioService } from './client';
import type { Cluster, Node, GPIOPin } from './client';

// Cluster hooks
export function useClusters() {
  return useQuery({
    queryKey: ['clusters'],
    queryFn: () => ClusterService.listClusters(),
  });
}

export function useCluster(id: string) {
  return useQuery({
    queryKey: ['clusters', id],
    queryFn: () => ClusterService.getCluster({ id }),
    enabled: !!id,
  });
}

export function useCreateCluster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cluster: Partial<Cluster>) =>
      ClusterService.createCluster({ requestBody: cluster }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
}

// Node hooks
export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: () => NodeService.listNodes(),
  });
}

export function useNode(id: string) {
  return useQuery({
    queryKey: ['nodes', id],
    queryFn: () => NodeService.getNode({ id }),
    enabled: !!id,
  });
}

// GPIO hooks
export function useGPIOPins(nodeId?: string) {
  return useQuery({
    queryKey: ['gpio', nodeId],
    queryFn: () => GpioService.listGPIO({ nodeId }),
  });
}

export function useGPIOControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      GpioService.writeGPIO({ id, requestBody: { value } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpio'] });
    },
  });
}
```

### Phase 3: Documentation Structure

#### Create API README

Create `pi-controller/docs/api/README.md`:

```markdown
# Pi-Controller REST API Documentation

## Overview

The Pi-Controller REST API provides programmatic access to manage Raspberry Pi clusters, nodes, and GPIO resources. This API is the foundation for the official web interface (kubes-aura) and can be used by third-party applications.

## Getting Started

### Base URL

```
http://your-controller-host:8765/api/v1
```

### Authentication

All API endpoints (except `/health` and `/ready`) require authentication. The API supports two authentication methods:

1. **Bearer Token (JWT)** - Recommended for web applications
2. **API Key** - For server-to-server communication

#### Obtaining a Bearer Token

```bash
curl -X POST http://localhost:8765/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "admin"
  }
}
```

#### Using the Token

Include the token in the `Authorization` header:

```bash
curl http://localhost:8765/api/v1/clusters \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Interactive Documentation

An interactive Swagger UI is available when the API server is running:

```
http://localhost:8765/swagger/index.html
```

### OpenAPI Specification

- **YAML**: [openapi.yaml](./openapi.yaml)
- **JSON**: [swagger.json](./swagger.json)

## Quick Examples

### List All Clusters

```bash
curl http://localhost:8765/api/v1/clusters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Node Details

```bash
curl http://localhost:8765/api/v1/nodes/{node-id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Control GPIO Pin

```bash
curl -X POST http://localhost:8765/api/v1/gpio/{pin-id}/write \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

## API Concepts

### Roles & Permissions

The API uses role-based access control (RBAC) with three roles:

- **viewer**: Read-only access to all resources
- **operator**: Can modify clusters, nodes, and GPIO settings
- **admin**: Full access including deletion and sensitive operations

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **GPIO endpoints**: 10 requests per minute (to protect hardware)

### Pagination

List endpoints support pagination:

```bash
GET /api/v1/clusters?page=1&limit=20
```

### Versioning

The API uses URL versioning. The current version is `v1`. When breaking changes are introduced, a new version will be released (e.g., `v2`).

## Separation of Concerns

### What the API Provides

- **Data Management**: CRUD operations for clusters, nodes, GPIO resources
- **Business Logic**: Provisioning, scaling, health checks
- **Authentication & Authorization**: User management and access control
- **Real-time Updates**: WebSocket events for live monitoring

### What the API Does NOT Provide

- **UI/UX**: No HTML rendering or frontend assets
- **User Preferences**: No storage for UI-specific settings (themes, layouts)
- **Client-Side State**: No session management for frontend applications

### Building Custom Interfaces

The API is designed to support multiple clients:

- **Official Web Interface** (kubes-aura): Full-featured React application
- **CLI Tools**: Command-line management utilities
- **Mobile Apps**: Native or hybrid mobile applications
- **Third-Party Integrations**: Custom dashboards, monitoring tools

To build your own interface:

1. Review the [OpenAPI specification](./openapi.yaml)
2. Generate a client library for your language (see examples/)
3. Implement your UI/UX following the API contracts
4. Optionally use WebSockets for real-time updates

## Client Libraries

Official client libraries are available:

- **TypeScript/JavaScript**: Auto-generated from OpenAPI spec
- **Go**: Use the internal packages or generate from spec
- **Python**: Generate using `openapi-generator`

See [examples/](../examples/) for usage examples.

## Support & Contributions

- **Issues**: [GitHub Issues](https://github.com/dsyorkd/pi-controller/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dsyorkd/pi-controller/discussions)
- **Contributing**: See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for API version history and breaking changes.
```

### Phase 4: Automation & CI/CD

#### GitHub Actions for pi-controller

Create `.github/workflows/api-docs.yml`:

```yaml
name: API Documentation

on:
  push:
    branches: [main, develop]
    paths:
      - 'internal/api/**'
      - 'internal/api/handlers/**'
  pull_request:
    branches: [main]
    paths:
      - 'internal/api/**'
      - 'internal/api/handlers/**'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Install swag
        run: go install github.com/swaggo/swag/cmd/swag@latest

      - name: Generate OpenAPI docs
        run: make api-docs

      - name: Validate OpenAPI spec
        run: make api-validate

      - name: Check for uncommitted changes
        run: |
          git diff --exit-code docs/api/
          if [ $? -ne 0 ]; then
            echo "❌ OpenAPI docs are out of sync!"
            echo "Run 'make api-docs' and commit the changes"
            exit 1
          fi

      - name: Upload API spec as artifact
        uses: actions/upload-artifact@v4
        with:
          name: openapi-spec
          path: |
            docs/api/openapi.yaml
            docs/api/swagger.json
```

#### Pre-commit hook for pi-controller

Create `.githooks/pre-commit`:

```bash
#!/bin/bash

# Check if API files changed
if git diff --cached --name-only | grep -q 'internal/api'; then
    echo "API files changed, regenerating docs..."

    if ! make api-docs; then
        echo "❌ Failed to generate API docs"
        exit 1
    fi

    if ! make api-validate; then
        echo "❌ OpenAPI validation failed"
        exit 1
    fi

    # Auto-stage generated docs
    git add docs/api/openapi.yaml docs/api/swagger.json

    echo "✅ API docs regenerated and staged"
fi
```

## Development Workflows

### Workflow 1: Adding a New API Endpoint (Backend Developer)

```bash
# 1. Add handler with Swagger annotations
cd pi-controller
vim internal/api/handlers/new_feature.go

# Add annotations:
# @Summary, @Description, @Tags, @Param, @Success, @Router

# 2. Register route in server.go
vim internal/api/server.go

# 3. Generate and validate docs
make api-docs
make api-validate

# 4. Test the endpoint
make run
curl http://localhost:8765/api/v1/your-endpoint

# 5. Commit (pre-commit hook auto-generates docs)
git add internal/api/handlers/new_feature.go
git add internal/api/server.go
git commit -m "feat: add new endpoint for X"

# Docs are auto-committed by the hook
```

### Workflow 2: Updating Frontend to Use New API (Frontend Developer)

```bash
# 1. Sync the latest API spec
cd kubes-aura
npm run sync-api

# 2. Regenerate TypeScript client
npm run generate-api

# 3. Check what changed
git diff src/api/generated/

# 4. Update your components to use new types/methods
vim src/pages/YourPage.tsx

# Use the generated client:
import { useYourNewEndpoint } from '@/api/hooks';

# 5. Commit changes
git add src/pages/YourPage.tsx
git add api-spec/  # Include synced spec
git commit -m "feat: integrate new API endpoint"
```

### Workflow 3: AI Assistant Development

When working with AI assistants (Claude, GitHub Copilot, etc.):

1. **For Backend Tasks**: AI reads OpenAPI annotations in Go code
2. **For Frontend Tasks**: AI reads generated TypeScript types
3. **For Understanding API**: AI reads `docs/api/README.md`

Example AI prompt:

```
Read the OpenAPI spec at api-spec/openapi.yaml and create
a React component that lists all clusters with their status.
Use the generated hooks from src/api/hooks.ts.
```

## Migration Path

### Deprecating Manual Types

The existing `src/types/pi-controller.ts` should be gradually replaced:

```typescript
// OLD (manual types)
import { PiCluster, PiNode } from '@/types/pi-controller';

// NEW (generated types)
import { Cluster, Node } from '@/api/generated';
```

Create `kubes-aura/src/types/pi-controller.ts` deprecation notice:

```typescript
/**
 * @deprecated This file is deprecated.
 * Use generated types from '@/api/generated' instead.
 *
 * Migration guide:
 * - PiCluster → Cluster
 * - PiNode → Node
 * - GPIOPin → GpioPin (generated)
 */

// Re-export generated types for backward compatibility
export type {
  Cluster as PiCluster,
  Node as PiNode,
  GpioPin as GPIOPin
} from '@/api/generated';
```

## Best Practices

### For Backend Developers

1. **Always add Swagger annotations** when creating/modifying endpoints
2. **Run `make api-docs`** before committing API changes
3. **Use consistent naming** for request/response types
4. **Document error responses** with examples
5. **Version breaking changes** properly

### For Frontend Developers

1. **Never edit generated files** in `src/api/generated/`
2. **Sync API spec regularly**: `npm run sync-api`
3. **Wrap generated client** with custom logic in `src/api/client.ts`
4. **Use React Query hooks** from `src/api/hooks.ts`
5. **Report API issues** to backend team with spec references

### For Third-Party Developers

1. **Use the OpenAPI spec** as the contract
2. **Generate clients** for your language of choice
3. **Follow authentication patterns** in examples
4. **Respect rate limits** to avoid throttling
5. **Subscribe to API changelog** for updates

## Tooling Summary

### pi-controller (Go Backend)

| Tool | Purpose | Installation |
|------|---------|--------------|
| swaggo/swag | Generate OpenAPI from annotations | `go install github.com/swaggo/swag/cmd/swag@latest` |
| go-swagger | Validate OpenAPI specs | `go install github.com/go-swagger/go-swagger/cmd/swagger@latest` |
| swagger-ui | Interactive API documentation | Docker image |
| Sphinx | Generate beautiful static docs | `pip install sphinx sphinxcontrib-openapi` |
| redoc | Alternative API doc renderer | `npm install -g redoc-cli` |

### kubes-aura (TypeScript Frontend)

| Tool | Purpose | Installation |
|------|---------|--------------|
| openapi-typescript-codegen | Generate TypeScript client | `npm install -D openapi-typescript-codegen` |
| axios | HTTP client for API calls | `npm install axios` |
| @tanstack/react-query | Data fetching & caching | `npm install @tanstack/react-query` |

## Maintenance

### When API Changes

1. **Backend dev** adds Swagger annotations
2. **CI/CD** auto-generates OpenAPI spec
3. **Frontend dev** syncs spec and regenerates client
4. **Third-party devs** pull updated spec from git

### Versioning Strategy

- **Patch** (1.0.x): Bug fixes, no API changes
- **Minor** (1.x.0): New endpoints, backward compatible
- **Major** (x.0.0): Breaking changes, new API version (/api/v2)

### Monitoring Sync Health

Create a weekly cron job or GitHub Action to check if specs are in sync:

```bash
#!/bin/bash
# Check if frontend has latest spec
cd kubes-aura
FRONTEND_HASH=$(md5sum api-spec/openapi.yaml | cut -d' ' -f1)
BACKEND_HASH=$(md5sum ../pi-controller/docs/api/openapi.yaml | cut -d' ' -f1)

if [ "$FRONTEND_HASH" != "$BACKEND_HASH" ]; then
    echo "⚠️  API specs are out of sync!"
    echo "Run: npm run api-update"
    exit 1
fi
```

## Advanced Documentation with Sphinx

For production-grade documentation with beautiful theming and versioning support, integrate Sphinx:

### Setup Sphinx for API Docs

#### Directory Structure

```
pi-controller/
├── docs/
│   ├── api/
│   │   ├── openapi.yaml              # Generated spec
│   │   └── swagger.json
│   ├── sphinx/                        # Sphinx documentation source
│   │   ├── conf.py                   # Sphinx configuration
│   │   ├── index.rst                 # Documentation homepage
│   │   ├── getting-started.rst       # Getting started guide
│   │   ├── api-reference.rst         # API reference (imports OpenAPI)
│   │   ├── authentication.rst        # Auth guide
│   │   ├── examples.rst              # Usage examples
│   │   ├── changelog.rst             # Version history
│   │   └── _static/                  # Custom CSS/images
│   └── build/                        # Generated HTML docs
└── scripts/
    └── build-docs.sh                 # Builds Sphinx + OpenAPI docs
```

#### Install Dependencies

```bash
# Install Sphinx and OpenAPI extension
pip install sphinx sphinxcontrib-openapi sphinx-rtd-theme

# Or use requirements.txt
cat > docs/sphinx/requirements.txt <<EOF
sphinx>=7.0.0
sphinxcontrib-openapi>=0.8.0
sphinx-rtd-theme>=2.0.0
sphinx-copybutton>=0.5.0
myst-parser>=2.0.0
EOF

pip install -r docs/sphinx/requirements.txt
```

#### Sphinx Configuration

Create `docs/sphinx/conf.py`:

```python
# Sphinx configuration file

import os
import sys

# Project information
project = 'Pi-Controller API'
copyright = '2024, Your Organization'
author = 'Your Team'
version = '1.0'
release = '1.0.0'

# Extensions
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinxcontrib.openapi',
    'sphinx_copybutton',
    'myst_parser',
]

# OpenAPI spec location
openapi_spec = '../api/openapi.yaml'

# Theme
html_theme = 'sphinx_rtd_theme'
html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'includehidden': True,
    'titles_only': False,
    'logo_only': False,
    'display_version': True,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': True,
}

# Static files
html_static_path = ['_static']
html_css_files = ['custom.css']

# Logo and favicon
html_logo = '_static/logo.png'
html_favicon = '_static/favicon.ico'

# Output
html_output_dir = '../build/html'
```

#### Main Documentation Page

Create `docs/sphinx/index.rst`:

```rst
Pi-Controller API Documentation
=================================

Welcome to the Pi-Controller API documentation. This API enables you to manage
Raspberry Pi clusters, nodes, and GPIO resources programmatically.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   getting-started
   authentication
   api-reference
   examples
   changelog

Quick Links
-----------

* :ref:`getting-started`
* :ref:`api-reference`
* :ref:`authentication`
* `GitHub Repository <https://github.com/dsyorkd/pi-controller>`_
* `Report Issues <https://github.com/dsyorkd/pi-controller/issues>`_

Features
--------

* **Cluster Management**: Create, scale, and manage K3s clusters
* **Node Control**: Provision and monitor Raspberry Pi nodes
* **GPIO Integration**: Direct hardware control via API
* **Real-time Updates**: WebSocket support for live data
* **Security**: JWT authentication and role-based access control

Architecture
------------

The Pi-Controller consists of two main components:

1. **Control Plane** (this API): Central management server
2. **Node Agents**: Lightweight agents running on each Pi

.. image:: _static/architecture.png
   :alt: Architecture Diagram
   :align: center

Support
-------

For questions and support:

* GitHub Discussions: https://github.com/dsyorkd/pi-controller/discussions
* Email: support@example.com
```

#### API Reference Page

Create `docs/sphinx/api-reference.rst`:

```rst
.. _api-reference:

API Reference
=============

Complete REST API reference auto-generated from OpenAPI specification.

Base URL
--------

.. code-block:: text

   http://your-controller-host:8765/api/v1

Authentication
--------------

All endpoints (except health checks) require authentication.
See :ref:`authentication` for details.

Endpoints
---------

.. openapi:: ../api/openapi.yaml
   :group:
   :examples:
   :encoding: utf-8
```

#### Build Script

Create `scripts/build-docs.sh`:

```bash
#!/bin/bash
set -e

echo "Building Pi-Controller documentation..."

# Step 1: Generate OpenAPI spec from code
echo "1/3 Generating OpenAPI specification..."
./scripts/generate-api-docs.sh

# Step 2: Build Sphinx documentation
echo "2/3 Building Sphinx documentation..."
cd docs/sphinx
sphinx-build -b html . ../build/html -W --keep-going

# Step 3: Build Swagger UI (standalone)
echo "3/3 Generating Swagger UI..."
cd ../..
mkdir -p docs/build/swagger
cat > docs/build/swagger/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Pi-Controller API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '../api/openapi.yaml',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
            deepLinking: true
        });
    </script>
</body>
</html>
EOF

cp docs/api/openapi.yaml docs/build/swagger/
cp docs/api/swagger.json docs/build/swagger/

echo "✅ Documentation built successfully!"
echo ""
echo "📚 Documentation locations:"
echo "  - Sphinx HTML: docs/build/html/index.html"
echo "  - Swagger UI:  docs/build/swagger/index.html"
echo ""
echo "To serve locally:"
echo "  cd docs/build/html && python -m http.server 8080"
```

#### Add to Makefile

```makefile
# In pi-controller/Makefile

.PHONY: docs
docs: ## Build all documentation (Sphinx + Swagger)
	@./scripts/build-docs.sh

.PHONY: docs-serve
docs-serve: docs ## Build and serve documentation locally
	@echo "Starting documentation server on http://localhost:8080"
	@cd docs/build/html && python -m http.server 8080

.PHONY: docs-clean
docs-clean: ## Clean generated documentation
	@rm -rf docs/build/
	@echo "✅ Documentation cleaned"
```

### Publishing Documentation

#### Option 1: GitHub Pages

Create `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'internal/api/**'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          go install github.com/swaggo/swag/cmd/swag@latest
          pip install -r docs/sphinx/requirements.txt

      - name: Build documentation
        run: make docs

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'docs/build/html'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Your docs will be available at: `https://yourusername.github.io/pi-controller/`

#### Option 2: ReadTheDocs

1. Connect your GitHub repo to ReadTheDocs
2. Create `.readthedocs.yaml`:

```yaml
version: 2

build:
  os: ubuntu-22.04
  tools:
    python: "3.11"

python:
  install:
    - requirements: docs/sphinx/requirements.txt

sphinx:
  configuration: docs/sphinx/conf.py
  builder: html
  fail_on_warning: true
```

#### Option 3: Self-Hosted with Nginx

```nginx
# nginx configuration
server {
    listen 80;
    server_name docs.your-domain.com;

    root /var/www/pi-controller-docs;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /swagger {
        alias /var/www/pi-controller-docs/swagger;
        try_files $uri $uri/index.html =404;
    }
}
```

Deploy script:

```bash
#!/bin/bash
# deploy-docs.sh

# Build docs
make docs

# Copy to web server
rsync -avz --delete \
    docs/build/html/ \
    user@server:/var/www/pi-controller-docs/

echo "✅ Documentation deployed to https://docs.your-domain.com"
```

### Alternative: ReDoc for Modern API Docs

For a modern, mobile-friendly alternative to Swagger UI:

```bash
# Install ReDoc CLI
npm install -g redoc-cli

# Generate standalone HTML
redoc-cli build docs/api/openapi.yaml \
    --output docs/build/redoc/index.html \
    --title "Pi-Controller API" \
    --theme.colors.primary.main="#007bff"

# Serve locally
redoc-cli serve docs/api/openapi.yaml --watch
```

ReDoc provides:

- Beautiful, responsive design
- Three-panel layout (navigation, description, examples)
- Better mobile support than Swagger UI
- No JavaScript required for viewing
- Supports Markdown in descriptions

Add to Makefile:

```makefile
.PHONY: docs-redoc
docs-redoc: api-docs ## Generate ReDoc documentation
	@mkdir -p docs/build/redoc
	@npx redoc-cli build docs/api/openapi.yaml \
		--output docs/build/redoc/index.html \
		--title "Pi-Controller API"
	@echo "✅ ReDoc documentation generated"
	@echo "  Output: docs/build/redoc/index.html"
```

## Conclusion

This system provides:

✅ **Single source of truth** in Go code
✅ **Automatic type safety** in TypeScript
✅ **Multiple doc formats**: Sphinx (comprehensive), Swagger UI (interactive), ReDoc (modern)
✅ **Human-readable docs** for third-party developers
✅ **AI-friendly structure** for assistant development
✅ **Clear separation** between backend API and frontend clients
✅ **Automated workflows** to prevent drift
✅ **Professional publishing** via GitHub Pages, ReadTheDocs, or self-hosted

The API contract lives in code annotations, documentation is auto-generated in multiple formats, and clients stay in sync with minimal manual effort.

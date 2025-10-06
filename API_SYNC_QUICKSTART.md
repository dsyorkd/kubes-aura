# Quick Start: API Sync Implementation

This is a step-by-step guide to implement the API synchronization system between pi-controller and kubes-aura.

See [API_SYNC_DESIGN.md](./API_SYNC_DESIGN.md) for the complete design document.

## Prerequisites

- Go 1.21+ (for pi-controller)
- Node.js 18+ (for kubes-aura)
- Python 3.11+ (for Sphinx documentation - optional)
- Both repos cloned and adjacent: `/path/to/pi-controller` and `/path/to/kubes-aura`

## Step 1: Setup pi-controller (Backend API)

### Install Tools

```bash
cd pi-controller

# Install swaggo/swag for OpenAPI generation
go install github.com/swaggo/swag/cmd/swag@latest

# Install validator (optional)
go install github.com/go-swagger/go-swagger/cmd/swagger@latest

# Verify installation
swag --version
```

### Create Generation Script

Create `scripts/generate-api-docs.sh`:

```bash
#!/bin/bash
set -e

echo "Generating OpenAPI documentation..."

# Create output directory
mkdir -p docs/api

# Generate swagger docs
swag init \
  --dir ./internal/api,./internal/api/handlers \
  --generalInfo server.go \
  --output ./docs/api \
  --outputTypes yaml,json \
  --parseInternal \
  --parseDependency

echo "✅ API documentation generated successfully"
echo "  - YAML: docs/api/openapi.yaml"
echo "  - JSON: docs/api/swagger.json"
```

Make it executable:

```bash
chmod +x scripts/generate-api-docs.sh
```

### Add Swagger Annotations

Add to `internal/api/server.go` (before package declaration):

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
```

### Add Handler Annotations (Example)

For one handler (e.g., `internal/api/handlers/cluster.go`):

```go
// List godoc
// @Summary      List all clusters
// @Description  Get a list of all managed K3s clusters
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        status    query     string  false  "Filter by status"
// @Param        page      query     int     false  "Page number (default 1)"
// @Param        limit     query     int     false  "Items per page (default 20)"
// @Success      200  {array}   models.Cluster
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Security     BearerAuth
// @Router       /clusters [get]
func (h *ClusterHandler) List(c *gin.Context) {
    // ... existing implementation
}
```

### Generate Initial Docs

```bash
./scripts/generate-api-docs.sh

# Verify output
ls -la docs/api/
# Should see: openapi.yaml, swagger.json
```

### Update Makefile

Add to pi-controller's `Makefile`:

```makefile
.PHONY: api-docs
api-docs: ## Generate API documentation from code annotations
	@./scripts/generate-api-docs.sh

.PHONY: api-serve
api-serve: ## Serve interactive API documentation
	@echo "Starting Swagger UI on http://localhost:8080"
	@docker run -p 8080:8080 \
		-e SWAGGER_JSON=/api/openapi.yaml \
		-v $(PWD)/docs/api:/api \
		swaggerapi/swagger-ui
```

Test it:

```bash
make api-docs
make api-serve
# Visit http://localhost:8080
```

### Commit Generated Docs

```bash
git add docs/api/openapi.yaml docs/api/swagger.json
git add scripts/generate-api-docs.sh
git add internal/api/server.go
git add internal/api/handlers/cluster.go  # and any other annotated files
git add Makefile
git commit -m "feat: add OpenAPI spec generation"
```

## Step 2: Setup kubes-aura (Frontend)

### Install Dependencies

```bash
cd kubes-aura

# Install OpenAPI TypeScript generator
npm install --save-dev openapi-typescript-codegen

# axios is already installed (check package.json)
```

### Create Sync Script

Create `scripts/sync-api-spec.sh`:

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

Make it executable:

```bash
chmod +x scripts/sync-api-spec.sh
```

### Create Generation Script

Create `scripts/generate-api-client.sh`:

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

Make it executable:

```bash
chmod +x scripts/generate-api-client.sh
```

### Update package.json

Add scripts to `package.json`:

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

### Run Initial Sync & Generation

```bash
# Sync spec from pi-controller
npm run sync-api

# Generate TypeScript client
npm run generate-api

# Verify output
ls -la src/api/generated/
# Should see: index.ts, types.ts, models/, services/, etc.
```

### Create API Client Wrapper

Create `src/api/client.ts`:

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
export type * from './generated';

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

### Add .gitignore Entry

Add to `.gitignore`:

```
# Generated API client (regenerate with npm run generate-api)
src/api/generated/
```

### Commit Setup Files

```bash
git add scripts/sync-api-spec.sh
git add scripts/generate-api-client.sh
git add package.json
git add src/api/client.ts
git add api-spec/  # Include the synced spec
git add .gitignore
git commit -m "feat: add API sync and client generation"
```

## Step 3: Usage Examples

### Example 1: Backend - Add New Endpoint

```go
// In pi-controller/internal/api/handlers/node.go

// GetMetrics godoc
// @Summary      Get node metrics
// @Description  Get real-time system metrics for a specific node
// @Tags         nodes
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Node ID"
// @Success      200  {object}  models.SystemMetrics
// @Failure      404  {object}  ErrorResponse
// @Security     BearerAuth
// @Router       /nodes/{id}/metrics [get]
func (h *NodeHandler) GetMetrics(c *gin.Context) {
    nodeID := c.Param("id")

    metrics, err := h.service.GetMetrics(c.Request.Context(), nodeID)
    if err != nil {
        c.JSON(http.StatusNotFound, ErrorResponse{
            Error: "Node not found",
        })
        return
    }

    c.JSON(http.StatusOK, metrics)
}
```

Register route in `server.go`:

```go
nodes.GET("/:id/metrics", s.requireRole("viewer"), nodeHandler.GetMetrics)
```

Generate docs:

```bash
make api-docs
git add docs/api/
git commit -m "feat: add node metrics endpoint"
```

### Example 2: Frontend - Use New Endpoint

In kubes-aura:

```bash
# Sync latest API spec
npm run api-update
```

Create React Query hook in `src/api/hooks.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { NodeService } from './client';

export function useNodeMetrics(nodeId: string) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'metrics'],
    queryFn: () => NodeService.getNodeMetrics({ id: nodeId }),
    enabled: !!nodeId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
```

Use in component:

```typescript
import { useNodeMetrics } from '@/api/hooks';

export function NodeMetricsCard({ nodeId }: { nodeId: string }) {
  const { data: metrics, isLoading } = useNodeMetrics(nodeId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h3>System Metrics</h3>
      <p>CPU: {metrics?.cpuUsage}%</p>
      <p>Memory: {metrics?.memoryUsage}%</p>
      <p>Temperature: {metrics?.temperature}°C</p>
    </div>
  );
}
```

## Step 4: Optional - Add Sphinx Documentation

### Install Sphinx

```bash
cd pi-controller

# Create Python virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate

# Install Sphinx and extensions
pip install sphinx sphinxcontrib-openapi sphinx-rtd-theme sphinx-copybutton myst-parser

# Save requirements
pip freeze > docs/sphinx/requirements.txt
```

### Initialize Sphinx

```bash
mkdir -p docs/sphinx
cd docs/sphinx

# Create basic structure
cat > index.rst <<'EOF'
Pi-Controller API Documentation
=================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   getting-started
   api-reference
   examples

API Reference
-------------

.. openapi:: ../api/openapi.yaml
   :group:
   :examples:
EOF

cat > conf.py <<'EOF'
project = 'Pi-Controller API'
copyright = '2024'
extensions = ['sphinxcontrib.openapi', 'sphinx_copybutton']
html_theme = 'sphinx_rtd_theme'
openapi_spec = '../api/openapi.yaml'
EOF
```

### Build Docs

```bash
cd ../..  # Back to pi-controller root

# Build Sphinx docs
sphinx-build -b html docs/sphinx docs/build/html

# Serve locally
cd docs/build/html && python -m http.server 8080
# Visit http://localhost:8080
```

## Step 5: Automation (Optional)

### Pre-commit Hook for pi-controller

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check if API files changed
if git diff --cached --name-only | grep -q 'internal/api'; then
    echo "API files changed, regenerating docs..."

    make api-docs

    # Auto-stage generated docs
    git add docs/api/openapi.yaml docs/api/swagger.json

    echo "✅ API docs regenerated and staged"
fi
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### GitHub Actions for pi-controller

Create `.github/workflows/api-docs.yml`:

```yaml
name: API Documentation

on:
  push:
    paths:
      - 'internal/api/**'
  pull_request:
    paths:
      - 'internal/api/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Install swag
        run: go install github.com/swaggo/swag/cmd/swag@latest

      - name: Generate docs
        run: make api-docs

      - name: Check for uncommitted changes
        run: |
          git diff --exit-code docs/api/
          if [ $? -ne 0 ]; then
            echo "❌ OpenAPI docs are out of sync!"
            echo "Run 'make api-docs' and commit the changes"
            exit 1
          fi
```

## Daily Workflow

### Backend Developer (Adding/Changing API)

```bash
# 1. Make changes to handlers with Swagger annotations
vim internal/api/handlers/your_handler.go

# 2. Regenerate docs
make api-docs

# 3. Test endpoint
make run
curl http://localhost:8765/api/v1/your-endpoint

# 4. Commit (pre-commit hook auto-updates docs)
git add internal/api/handlers/your_handler.go
git commit -m "feat: add/update endpoint"
```

### Frontend Developer (Using API)

```bash
# 1. Sync latest API spec
npm run sync-api

# 2. Regenerate TypeScript client
npm run generate-api

# 3. Check what changed
git diff src/api/generated/

# 4. Use new types/methods in your components
vim src/pages/YourPage.tsx

# 5. Commit
git add src/pages/YourPage.tsx
git add api-spec/  # Include synced spec
git commit -m "feat: use new API endpoint"
```

## Troubleshooting

### Issue: swag command not found

```bash
# Ensure GOPATH/bin is in PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Re-install swag
go install github.com/swaggo/swag/cmd/swag@latest
```

### Issue: Generated client has errors

```bash
# Check OpenAPI spec validity
cd pi-controller
swagger validate docs/api/openapi.yaml

# If invalid, fix annotations and regenerate
make api-docs
```

### Issue: Types don't match between frontend and backend

```bash
# Ensure you've synced latest spec
cd kubes-aura
npm run api-update

# Check sync timestamp
cat api-spec/.sync-timestamp
```

## Next Steps

1. **Annotate all existing handlers** in pi-controller
2. **Migrate manual types** in kubes-aura to generated ones
3. **Setup CI/CD** to auto-validate and publish docs
4. **Create examples** for third-party developers
5. **Publish docs** to GitHub Pages or ReadTheDocs

## Resources

- [Swaggo Documentation](https://github.com/swaggo/swag)
- [OpenAPI Specification](https://swagger.io/specification/)
- [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- [Sphinx OpenAPI Extension](https://sphinxcontrib-openapi.readthedocs.io/)
- [Complete Design Document](./API_SYNC_DESIGN.md)

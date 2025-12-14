# Kubes Aura Release Process

This document describes the release pipeline and process for Kubes Aura.

## Overview

The release pipeline automatically:
1. Validates the code (lint, type check, tests)
2. Builds production artifacts
3. Creates and publishes a container image
4. Publishes an NPM package to GitHub Packages
5. Creates a GitHub Release with artifacts and checksums

## Release Workflow

### Automated Release (Recommended)

1. **Create a version tag:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. The release workflow automatically triggers and:
   - Runs all validation checks (lint, type check, tests)
   - Builds the production bundle
   - Creates a tarball with checksums
   - Builds and pushes multi-arch container images (amd64, arm64)
   - Publishes to GitHub Packages
   - Creates a GitHub Release with all artifacts

### Manual Release

Trigger a release manually from the GitHub Actions UI:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter the version (e.g., `v1.0.0`)
4. Click "Run workflow"

## Artifacts

Each release produces:

### 1. Container Image
```bash
# Pull the image
docker pull ghcr.io/dsyorkd/kubes-aura:v1.0.0

# Run locally
docker run -p 8080:80 ghcr.io/dsyorkd/kubes-aura:v1.0.0
```

**Platforms:** `linux/amd64`, `linux/arm64`

### 2. NPM Package
```bash
# Configure GitHub Packages authentication
npm login --registry=https://npm.pkg.github.com

# Install the package
npm install @dsyorkd/kubes-aura@1.0.0
```

### 3. Tarball
Download from GitHub Releases:
```bash
# Download specific version
curl -L -O https://github.com/dsyorkd/kubes-aura/releases/download/v1.0.0/kubes-aura-1.0.0.tar.gz

# Verify checksum
sha256sum -c checksums.txt
```

## Consuming in Pi-Controller

### Option 1: Build from Submodule (Development)
```bash
make ui
```

This builds from the `web/kubes-aura` submodule.

### Option 2: Use Pre-built Release (Production/CI)
```bash
make ui-from-release UI_VERSION=v1.0.0
```

This downloads and extracts the pre-built tarball from GitHub Releases.

### Option 3: Use Container Image
```bash
# Pull and run the UI container separately
docker run -d -p 8080:80 ghcr.io/dsyorkd/kubes-aura:v1.0.0
```

## Version Scheme

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Breaking changes
- **MINOR** (v1.1.0): New features, backwards compatible
- **PATCH** (v1.0.1): Bug fixes, backwards compatible

## CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Runs on every push and PR:
- **Lint & Type Check**: ESLint + TypeScript
- **Tests**: Playwright E2E tests
- **Build**: Production build validation
- **Security**: npm audit + Trivy vulnerability scan

### Release Pipeline (`release.yml`)

Triggered by version tags:
1. **Validate**: Lint, type check, tests
2. **Build Artifacts**: Production bundle + tarball
3. **Build Container**: Multi-arch Docker image
4. **Publish NPM**: GitHub Packages
5. **Create Release**: GitHub Release with all artifacts

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   cd web/kubes-aura
   git checkout -b feature/my-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/my-feature
   ```

4. CI runs automatically on PR

### Creating a Release

1. Merge PR to main
2. Update version in package.json (if not using automated versioning)
3. Create and push tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. Release workflow runs automatically
5. Update pi-controller submodule reference:
   ```bash
   cd /path/to/pi-controller
   git submodule update --remote web/kubes-aura
   git add web/kubes-aura
   git commit -m "chore(ui): update kubes-aura to v1.0.0"
   ```

## Automated Dependencies

### Renovate Bot

Renovate automatically:
- Checks for dependency updates weekly (Mondays at 9 AM UTC)
- Groups related updates (React, Radix UI, build tools)
- Auto-merges minor and patch updates
- Creates PRs for major updates requiring review

### Manual Dependency Update

```bash
npm update
npm outdated
npm audit fix
```

## Security

- **npm audit**: Runs on every CI build
- **Trivy**: Scans for vulnerabilities in dependencies
- **SARIF upload**: Results uploaded to GitHub Security tab
- **Automated updates**: Renovate keeps dependencies current

## Troubleshooting

### Release Failed

Check the GitHub Actions logs for specific errors. Common issues:

- **Tests failed**: Fix failing tests before releasing
- **Build failed**: Check for TypeScript errors or missing dependencies
- **Docker build failed**: Verify Dockerfile and build args
- **NPM publish failed**: Ensure GitHub token has package write permissions

### Container Image Issues

```bash
# Test locally
docker build -t kubes-aura:test .
docker run -p 8080:80 kubes-aura:test

# Check logs
docker logs <container-id>
```

### Package Installation Issues

Ensure GitHub Packages authentication:
```bash
npm login --registry=https://npm.pkg.github.com
# Use GitHub personal access token with read:packages scope
```

## Support

For issues or questions:
- Open an issue in the [kubes-aura repository](https://github.com/dsyorkd/kubes-aura/issues)
- Check existing [discussions](https://github.com/dsyorkd/kubes-aura/discussions)

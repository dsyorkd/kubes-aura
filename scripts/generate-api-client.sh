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

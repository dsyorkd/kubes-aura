#!/bin/bash
set -e

PI_CONTROLLER_PATH="${PI_CONTROLLER_PATH:-../pi-controller}"
SPEC_SOURCE="$PI_CONTROLLER_PATH/docs/api/swagger.yaml"
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

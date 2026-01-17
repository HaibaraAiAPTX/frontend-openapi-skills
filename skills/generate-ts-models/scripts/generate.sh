#!/bin/bash

set -e

# Script to generate TypeScript models from OpenAPI/Swagger specification
# Usage: generate.sh <spec-file> [output-file]

SPEC_FILE="$1"
OUTPUT_FILE="${2:-api-models.ts}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate arguments
if [ -z "$SPEC_FILE" ]; then
    echo '{"success": false, "error": "Specification file is required"}' >&2
    exit 1
fi

# Check if spec file exists
if [ ! -f "$SPEC_FILE" ]; then
    echo "{\"success\": false, \"error\": \"Specification file not found: $SPEC_FILE\"}" >&2
    exit 1
fi

# Status messages to stderr
echo "Generating TypeScript models from: $SPEC_FILE" >&2

# Run Node.js script
node "$SCRIPT_DIR/generate.js" "$SPEC_FILE" "$OUTPUT_FILE"

exit $?

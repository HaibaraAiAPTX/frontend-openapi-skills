#!/bin/bash

set -e

# Script to download OpenAPI/Swagger specification files
# Usage: download.sh <url> [output-path]

URL="$1"
OUTPUT_PATH="${2:-openapi.json}"
TEMP_FILE=$(mktemp)

# Cleanup trap
trap "rm -f $TEMP_FILE" EXIT

# Validate arguments
if [ -z "$URL" ]; then
    echo '{"success": false, "error": "URL is required"}' >&2
    exit 1
fi

# Status messages to stderr
echo "Downloading OpenAPI specification from: $URL" >&2

# Download the file
if ! curl -fsSL "$URL" -o "$TEMP_FILE"; then
    echo '{"success": false, "error": "Failed to download file from URL"}' >&2
    exit 1
fi

# Detect format
FORMAT="json"
if grep -q "^openapi:" "$TEMP_FILE" 2>/dev/null || grep -q "^swagger:" "$TEMP_FILE" 2>/dev/null; then
    FORMAT="yaml"
elif ! head -1 "$TEMP_FILE" | grep -qE '^\s*\{'; then
    echo '{"success": false, "error": "Downloaded file is not a valid JSON or YAML OpenAPI specification"}' >&2
    exit 1
fi

# Get file size
SIZE=$(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE" 2>/dev/null || echo "0")

# Create output directory if needed
OUTPUT_DIR=$(dirname "$OUTPUT_PATH")
if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir -p "$OUTPUT_DIR"
fi

# Move to output path
mv "$TEMP_FILE" "$OUTPUT_PATH"

echo "Downloaded successfully: $OUTPUT_PATH" >&2

# Output JSON result
cat <<EOF
{
  "success": true,
  "filePath": "$OUTPUT_PATH",
  "format": "$FORMAT",
  "size": $SIZE,
  "url": "$URL"
}
EOF

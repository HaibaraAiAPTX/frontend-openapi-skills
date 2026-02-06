#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_OUTPUT = 'openapi.json';
const TIMEOUT_MS = 30000; // 30 seconds

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: URL is required');
  console.error(JSON.stringify({
    success: false,
    error: 'URL is required',
    code: 'MISSING_URL'
  }));
  process.exit(1);
}

const url = args[0];
const outputPath = args[1] || DEFAULT_OUTPUT;

// Helper functions
function log(message) {
  process.stderr.write(message + '\n');
}

function fail(message, code = 'UNKNOWN') {
  console.error(JSON.stringify({
    success: false,
    error: message,
    code: code
  }));
  process.exit(1);
}

// Validate URL
if (!url) {
  fail('URL is required', 'MISSING_URL');
}

try {
  new URL(url);
} catch {
  fail('Invalid URL format', 'INVALID_URL');
}

// Download using native fetch
(async () => {
  let tempFile = null;

  try {
    log(`Downloading OpenAPI specification from: ${url}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Fetch the URL
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    // Check response status
    if (!response.ok) {
      fail(`HTTP ${response.status}: ${response.statusText}`, 'DOWNLOAD_FAILED');
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      fail('URL points to an HTML page, not a JSON file. Please provide the direct JSON file URL.', 'INVALID_FORMAT');
    }

    // Get content
    const content = await response.text();

    // Check if content looks like JSON
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      fail('Downloaded file is not a valid OpenAPI specification (must start with { or [)', 'INVALID_FORMAT');
    }

    // Create temp file
    tempFile = path.join(__dirname, `../.temp_${Date.now()}`);
    fs.writeFileSync(tempFile, content, 'utf8');

    // Get file size
    const stats = fs.statSync(tempFile);
    const size = stats.size;

    // Create output directory if needed
    const outputDir = path.dirname(outputPath);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Move to output path
    fs.renameSync(tempFile, outputPath);
    tempFile = null;

    // Success output
    console.log(JSON.stringify({
      success: true,
      filePath: outputPath,
      size: size,
      url: url
    }));

  } catch (error) {
    // Clean up temp file if it exists
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      fail('Request timeout after 30 seconds', 'API_TIMEOUT');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      fail('Failed to connect to URL', 'DOWNLOAD_FAILED');
    } else {
      fail(error.message || 'Unknown error occurred', 'DOWNLOAD_FAILED');
    }
  }
})();

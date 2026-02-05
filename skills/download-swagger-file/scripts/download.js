#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DEFAULT_OUTPUT = 'openapi.json';

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

// Download using curl
const tempFile = path.join(__dirname, `../.temp_${Date.now()}`);

try {
  log(`Downloading OpenAPI specification from: ${url}`);

  // Use curl to download
  execSync(`curl -fsSL "${url}" -o "${tempFile}"`, {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 50 * 1024 * 1024 // 50MB
  });

  // Read and validate content
  const content = fs.readFileSync(tempFile, 'utf8').trim();

  // Check if content looks like JSON
  if (!content.startsWith('{') && !content.startsWith('[') && !content.startsWith('openapi:') && !content.startsWith('swagger:')) {
    fs.unlinkSync(tempFile);
    fail('Downloaded file is not a valid OpenAPI specification', 'INVALID_FORMAT');
  }

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

  // Success output
  console.log(JSON.stringify({
    success: true,
    filePath: outputPath,
    size: size,
    url: url
  }));

} catch (error) {
  // Clean up temp file if it exists
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }

  if (error.code === 'ENOENT') {
    fail('curl command not found', 'MISSING_CURL');
  } else if (error.status === 22) {
    fail('Failed to download file from URL', 'DOWNLOAD_FAILED');
  } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    fail('Request timeout', 'API_TIMEOUT');
  } else {
    fail(error.message, 'DOWNLOAD_FAILED');
  }
}

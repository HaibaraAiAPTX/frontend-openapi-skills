#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');

/**
 * Materal Framework Enum Adapter
 *
 * Parses OpenAPI spec to find enum endpoints, fetches enum data from Materal API,
 * and outputs JSON for AI to process translations and naming.
 */

function printJson(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function fail(message, extra = {}) {
  console.error(`Error: ${message}`);
  printJson({ success: false, error: message, ...extra });
  process.exit(1);
}

function detectMateralFramework(spec) {
  const paths = spec.paths || {};
  const enumPaths = Object.keys(paths).filter(p =>
    p.includes('/MainAPI/Enums/GetAll')
  );

  return {
    detected: enumPaths.length > 0,
    enumEndpoints: enumPaths
  };
}

function extractEnumNamesFromPaths(enumPaths) {
  const enumNames = new Set();

  for (const path of enumPaths) {
    const match = path.match(/GetAll([A-Z][a-zA-Z]+)/);
    if (match) {
      enumNames.add(match[1]);
    }
  }

  return Array.from(enumNames);
}

async function fetchWithRetry(url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseTimeout = options.timeout || 10000;
  const initialDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const transport = url.startsWith('http:') ? http : https;
        const req = transport.get(url, {
          timeout: baseTimeout * attempt
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function fetchEnumFromAPI(baseUrl, enumName) {
  const endpoint = `/MainAPI/Enums/GetAll${enumName}`;
  const url = new URL(endpoint, baseUrl).toString();

  try {
    const data = await fetchWithRetry(url, { maxRetries: 3, timeout: 10000 });
    const json = JSON.parse(data);
    if (json.Data && Array.isArray(json.Data)) {
      return json.Data;
    }
    return [];
  } catch (e) {
    console.error(`Failed to fetch ${enumName}: ${e.message}`);
    return null;
  }
}

function readSpecFile(specFile) {
  try {
    const content = fs.readFileSync(specFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    fail('Failed to read or parse spec file (JSON only)', { details: error.message });
  }
}

function findEnumInSpec(spec, enumName) {
  const schemas = spec.components?.schemas || spec.definitions || {};

  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.enum && name === enumName) {
      return schema;
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node adapter.js <spec-file> --base-url <url>');
    console.error('');
    console.error('Options:');
    console.error('  --base-url <url>  : Materal API base URL (required)');
    printJson({ success: false, error: 'Invalid arguments' });
    process.exit(1);
  }

  const specFile = args[0];
  let baseUrl = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--base-url' && args[i + 1]) {
      baseUrl = args[i + 1];
      i++;
    }
  }

  if (!baseUrl) {
    fail('--base-url is required');
  }

  console.error(`Materal Framework Enum Adapter`);
  console.error(`================================`);
  console.error(`Spec file: ${specFile}`);
  console.error(`Base URL: ${baseUrl}`);
  console.error('');

  const spec = readSpecFile(specFile);
  const detection = detectMateralFramework(spec);

  if (!detection.detected) {
    console.error('No Materal Framework Enums controller detected.');
    printJson({
      success: true,
      detected: false,
      enums: [],
      enumsSkipped: 0,
      enumData: []
    });
    process.exit(0);
  }

  console.error(`Detected ${detection.enumEndpoints.length} enum endpoints`);

  const enumNames = extractEnumNamesFromPaths(detection.enumEndpoints);
  console.error(`Enum names: ${enumNames.join(', ')}`);
  console.error('');

  const results = {
    success: true,
    detected: true,
    enums: [],
    enumsSkipped: 0,
    enumData: []
  };

  for (const enumName of enumNames) {
    const enumSchema = findEnumInSpec(spec, enumName);
    const description = enumSchema?.description || '';

    console.error(`Fetching ${enumName}...`);
    const apiData = await fetchEnumFromAPI(baseUrl, enumName);

    if (!apiData) {
      console.error(`  Skipped ${enumName}: Failed to fetch from API`);
      results.enumsSkipped++;
      continue;
    }

    const enumValues = apiData.map((item, index) => {
      const rawKey = item?.Key ?? item?.key ?? index;
      const rawValue = item?.Value ?? item?.value ?? '';
      const key = (typeof rawKey === 'string' && rawKey.trim() !== '' && !Number.isNaN(Number(rawKey)))
        ? Number(rawKey)
        : rawKey;
      return { key, value: rawValue };
    });

    console.error(`  Found ${enumValues.length} values`);

    results.enumData.push({
      name: enumName,
      description: description,
      values: enumValues
    });

    results.enums.push(enumName);
  }

  console.error('');
  console.error(`Summary:`);
  console.error(`  Enums fetched: ${results.enums.length}`);
  console.error(`  Enums skipped: ${results.enumsSkipped}`);

  printJson(results);
}

if (require.main === module) {
  main().catch(error => {
    fail(error.message, { stack: error.stack });
  });
}

module.exports = { detectMateralFramework, fetchEnumFromAPI };

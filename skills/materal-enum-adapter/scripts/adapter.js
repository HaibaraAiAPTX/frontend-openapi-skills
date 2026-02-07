#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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
    p.includes('/Enums/GetAll')
  );

  // Extract the namespace prefix (everything before /Enums/GetAll)
  // Works for any gateway namespace: /MainAPI, /GatewayAPI, etc.
  let namespacePrefix = '';
  if (enumPaths.length > 0) {
    const namespaceMatch = enumPaths[0].match(/^(.*?)(?=\/Enums\/GetAll)/);
    if (namespaceMatch) {
      namespacePrefix = namespaceMatch[1];
    }
  }

  return {
    detected: enumPaths.length > 0,
    enumEndpoints: enumPaths,
    namespace: namespacePrefix
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

async function fetchEnumFromAPI(baseUrl, enumName, namespace = '') {
  const endpoint = `${namespace}/Enums/GetAll${enumName}`;
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

function readTranslationFile(translationFile) {
  try {
    const content = fs.readFileSync(translationFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    fail('Failed to read or parse translation file (JSON only)', { details: error.message });
  }
}

function validateTranslationData(data) {
  if (!data.enumData || !Array.isArray(data.enumData)) {
    fail('Invalid translation data: missing or invalid enumData array');
  }

  for (const enumData of data.enumData) {
    if (!enumData.name || !enumData.values || !Array.isArray(enumData.values)) {
      fail(`Invalid enum data for ${enumData.name || 'unknown'}: missing name or values`);
    }

    for (const value of enumData.values) {
      if (value.key === undefined || value.key === null || value.englishName === undefined || value.englishName === null) {
        fail(`Invalid value in ${enumData.name}: missing key or englishName`);
      }
    }
  }

  return data;
}

function generateEnumFile(enumData, outputPath) {
  const { name, values, description } = enumData;

  let content = '/**\n * Auto-generated from OpenAPI specification\n * Do not edit manually\n */\n\n';

  if (description) {
    content += `/**\n * ${description}\n */\n`;
  }

  content += `export enum ${name} {\n`;

  const sortedValues = [...values].sort((a, b) => {
    if (typeof a.key === 'number' && typeof b.key === 'number') {
      return a.key - b.key;
    }
    return 0;
  });

  for (const value of sortedValues) {
    const key = value.key;
    const englishName = value.englishName;
    const originalValue = value.originalValue || '';

    if (originalValue) {
      content += `  /** ${originalValue} */\n`;
    }
    content += `  ${englishName} = ${typeof key === 'number' ? key : `"${key}"`},\n`;
  }

  content += '}\n';

  fs.writeFileSync(outputPath, content, 'utf8');
  console.error(`Generated: ${outputPath}`);
}

function generateEnumFiles(translationData, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const enumData of translationData.enumData) {
    const filePath = path.join(outputDir, `${enumData.name}.ts`);
    generateEnumFile(enumData, filePath);
  }

  console.error('');
  console.error(`Generated ${translationData.enumData.length} enum files in ${outputDir}`);
  console.error(`Note: index.ts is not generated (already exists from generate-ts-models)`);
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

async function fetchEnumData(baseUrl, enumName, namespace, spec) {
  const enumSchema = findEnumInSpec(spec, enumName);
  const description = enumSchema?.description || '';

  console.error(`Fetching ${enumName}...`);
  const apiData = await fetchEnumFromAPI(baseUrl, enumName, namespace);

  if (!apiData) {
    console.error(`  Failed to fetch ${enumName} from API`);
    return { success: false, name: enumName };
  }

  const enumValues = apiData.map((item, index) => {
    const rawKey = item?.Key ?? item?.key ?? index;
    const rawValue = item?.Value ?? item?.value ?? '';
    const key = (typeof rawKey === 'string' && rawKey.trim() !== '' && !Number.isNaN(Number(rawKey)))
      ? Number(rawKey)
      : rawKey;
    return { key, originalValue: rawValue };
  });

  console.error(`  Found ${enumValues.length} values for ${enumName}`);

  return {
    success: true,
    name: enumName,
    description: description,
    values: enumValues
  };
}

async function fetchCommand(specFile, baseUrl, outputFile) {
  console.error(`Materal Framework Enum Adapter`);
  console.error(`================================`);
  console.error(`Spec file: ${specFile}`);
  console.error(`Base URL: ${baseUrl}`);
  console.error(`Output file: ${outputFile}`);
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
  console.error(`Namespace: ${detection.namespace || '(root)'}`);

  const enumNames = extractEnumNamesFromPaths(detection.enumEndpoints);
  console.error(`Enum names: ${enumNames.join(', ')}`);
  console.error('');
  console.error(`Starting parallel fetch for ${enumNames.length} enums...`);
  console.error('');

  const fetchPromises = enumNames.map(enumName =>
    fetchEnumData(baseUrl, enumName, detection.namespace, spec)
  );

  const results = await Promise.allSettled(fetchPromises);

  const successEnums = [];
  const failedEnums = [];
  const enumData = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      if (data.success) {
        successEnums.push(data.name);
        enumData.push({
          name: data.name,
          description: data.description,
          values: data.values
        });
      } else {
        failedEnums.push(data.name);
      }
    } else {
      console.error(`Error fetching enum: ${result.reason.message}`);
    }
  });

  console.error('');
  console.error(`Summary:`);
  console.error(`  Enums fetched: ${successEnums.length}`);
  console.error(`  Enums skipped: ${failedEnums.length}`);

  if (failedEnums.length > 0) {
    console.error(`  Failed: ${failedEnums.join(', ')}`);
  }

  const result = {
    success: true,
    detected: true,
    enums: successEnums,
    enumsSkipped: failedEnums.length,
    enumData: enumData
  };

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
  console.error(`Output written to: ${outputFile}`);
}

function generateCommand(translationFile, outputDir) {
  console.error(`Materal Framework Enum Generator`);
  console.error(`=================================`);
  console.error(`Translation file: ${translationFile}`);
  console.error(`Output directory: ${outputDir}`);
  console.error('');

  const translationData = readTranslationFile(translationFile);
  const validatedData = validateTranslationData(translationData);

  generateEnumFiles(validatedData, outputDir);

  try {
    fs.unlinkSync(translationFile);
    console.error(`Deleted: ${translationFile}`);
  } catch (error) {
    console.error(`Warning: Failed to delete ${translationFile}: ${error.message}`);
  }

  printJson({
    success: true,
    generated: validatedData.enumData.length,
    enums: validatedData.enumData.map(e => e.name),
    outputDir: outputDir
  });
}


async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[args.length - 1];

  if (command === 'fetch') {
    let specFile = null;
    let baseUrl = null;
    let outputFile = null;

    for (let i = 0; i < args.length - 1; i++) {
      if (args[i] === '--base-url' && args[i + 1]) {
        baseUrl = args[i + 1];
        i++;
      } else if (args[i] === '--output' && args[i + 1]) {
        outputFile = args[i + 1];
        i++;
      } else if (!args[i].startsWith('--') && !specFile) {
        specFile = args[i];
      }
    }

    if (!specFile || !baseUrl || !outputFile) {
      console.error('Error: Missing required arguments for fetch command');
      console.error('');
      printUsage();
      process.exit(1);
    }

    await fetchCommand(specFile, baseUrl, outputFile);
  } else if (command === 'generate') {
    let translationFile = null;
    let outputDir = null;

    for (let i = 0; i < args.length - 1; i++) {
      if (args[i] === '--output-dir' && args[i + 1]) {
        outputDir = args[i + 1];
        i++;
      } else if (!args[i].startsWith('--') && !translationFile) {
        translationFile = args[i];
      }
    }

    if (!translationFile) {
      console.error('Error: Missing translation file for generate command');
      console.error('');
      printUsage();
      process.exit(1);
    }

    if (!outputDir) {
      console.error('Error: Missing required argument --output-dir');
      console.error('');
      printUsage();
      process.exit(1);
    }

    generateCommand(translationFile, outputDir);
  } else {
    console.error(`Error: Unknown command '${command}'`);
    console.error('');
    printUsage();
    process.exit(1);
  }
}

function printUsage() {
  console.error('Materal Framework Enum Adapter');
  console.error('=================================');
  console.error('');
  console.error('Usage:');
  console.error('  node adapter.js <spec-file> --base-url <url> --output <file> fetch');
  console.error('  node adapter.js <translation-file> --output-dir <dir> generate');
  console.error('');
  console.error('Commands:');
  console.error('  fetch       - Fetch enum data from API and write to file');
  console.error('  generate    - Generate TypeScript enum files from translation data');
  console.error('');
  console.error('Fetch options:');
  console.error('  --base-url <url>   : Materal API base URL (required)');
  console.error('  --output <file>    : Output JSON file path (required)');
  console.error('');
  console.error('Generate options:');
  console.error('  --output-dir <dir> : Output directory (required)');
  console.error('');
  console.error('Examples:');
  console.error('  node adapter.js openapi.json --base-url http://localhost:5000 --output enums.json fetch');
  console.error('  node adapter.js enums.json --output-dir ./src/types generate');
}

if (require.main === module) {
  main().catch(error => {
    fail(error.message, { stack: error.stack });
  });
}

module.exports = { detectMateralFramework, fetchEnumFromAPI };

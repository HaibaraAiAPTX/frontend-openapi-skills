#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function renderWarningHeader(preservedKeys = []) {
  let header = '/**\n * Auto-generated from OpenAPI specification\n';
  if (preservedKeys.length > 0) {
    header += ` * @preserve-manual ${preservedKeys.join(', ')}\n`;
  }
  header += ' * Do not edit manually\n */\n\n';
  return header;
}

function renderPreserveMarker(preservedKeys = []) {
  if (!preservedKeys || preservedKeys.length === 0) {
    return '';
  }
  return `/**\n * @preserve-manual ${preservedKeys.join(', ')}\n */\n`;
}

/**
 * Parse the file header to extract @preserve-manual markers
 * Returns an array of preserved enum keys
 */
function parseFileHeader(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*\*\s*@preserve-manual\s+(.+)$/);
      if (match) {
        const keys = match[1].split(',').map(k => k.trim()).filter(k => k);
        return keys;
      }
    }

    return [];
  } catch (error) {
    console.error(`Warning: Failed to parse file header: ${error.message}`);
    return [];
  }
}

function parsePreserveKeysFromContent(content) {
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*\*\s*@preserve-manual\s+(.+)$/);
    if (match) {
      return match[1].split(',').map(k => k.trim()).filter(k => k);
    }
  }

  return [];
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePreservedKeysForEnumFromContent(content, enumName) {
  try {
    const enumRegex = new RegExp(`export enum\\s+${escapeRegExp(enumName)}\\b`);
    const enumMatch = enumRegex.exec(content);
    if (!enumMatch) {
      return [];
    }

    const preserved = [];
    let cursor = enumMatch.index;

    while (true) {
      const commentEnd = content.lastIndexOf('*/', cursor);
      if (commentEnd === -1) break;

      const between = content.slice(commentEnd + 2, cursor);
      if (!/^\s*$/.test(between)) break;

      const commentStart = content.lastIndexOf('/**', commentEnd);
      if (commentStart === -1) break;

      const block = content.slice(commentStart, commentEnd + 2);
      const keys = parsePreserveKeysFromContent(block);
      preserved.push(...keys);

      cursor = commentStart;
    }

    return Array.from(new Set(preserved));
  } catch (error) {
    console.error(`Warning: Failed to parse preserved keys for enum ${enumName}: ${error.message}`);
    return [];
  }
}

function parseEnumValuesFromBody(enumBody) {
  const values = [];
  const lines = enumBody.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/**') || trimmed.startsWith('*')) {
      continue;
    }

    const match = trimmed.match(/^(\w+)\s*=\s*(.+?)(?:,|$)/);
    if (match) {
      let value = match[2].trim();
      const isString = value.startsWith('"') || value.startsWith("'");
      if (isString) {
        value = value.slice(1, -1);
      } else {
        value = parseInt(value, 10);
      }
      values.push({
        key: match[1],
        value: value,
        isString: isString
      });
    }
  }

  return values;
}

function parseExistingEnumValuesFromContent(content, enumName) {
  try {
    const enumRegex = new RegExp(`export enum\\s+${escapeRegExp(enumName)}\\s*\\{([\\s\\S]*?)\\}`, 'm');
    const enumMatch = enumRegex.exec(content);
    if (!enumMatch) {
      return [];
    }

    return parseEnumValuesFromBody(enumMatch[1]);
  } catch (error) {
    console.error(`Warning: Failed to parse existing enum from content: ${error.message}`);
    return [];
  }
}

/**
 * Merge new enum values with preserved manual keys and auto-detected translated keys
 * @param {Array} newValues - New enum values from OpenAPI spec
 * @param {Array} preservedKeys - Keys that should be preserved from existing file
 * @param {Array} existingValues - Existing enum values (if file exists)
 * @returns {Array} - Merged enum values
 */
function mergeEnumValues(newValues, preservedKeys = [], existingValues = []) {
  // Detect auto-translated keys (keys that are not auto-generated)
  const translatedValues = detectTranslatedEnumValues(existingValues);

  // Build preservation map from both manual preserved keys and auto-detected translated keys
  const preservedMap = new Map();
  for (const existing of existingValues) {
    if ((preservedKeys.includes(existing.key) || translatedValues.has(existing.value))) {
      preservedMap.set(existing.value, existing);
    }
  }

  const result = [];
  const usedValues = new Set();

  for (const newVal of newValues) {
    if (preservedMap.has(newVal.value)) {
      const preserved = preservedMap.get(newVal.value);
      result.push(preserved);
      usedValues.add(newVal.value);
    } else {
      result.push(newVal);
      usedValues.add(newVal.value);
    }
  }

  return result;
}

function extractTypeReferences(typeStr, knownTypes) {
  const references = new Set();
  
  // Check if the type itself is a known type
  if (knownTypes.has(typeStr)) {
    references.add(typeStr);
  }
  
  // Handle array types: Array<SomeType> or SomeType[]
  const arrayMatch = typeStr.match(/Array<(.+)>/) || typeStr.match(/(.+)\[\]/);
  if (arrayMatch) {
    const innerType = arrayMatch[1].trim();
    const innerRefs = extractTypeReferences(innerType, knownTypes);
    innerRefs.forEach(ref => references.add(ref));
  }
  
  // Handle union types: Type1 | Type2
  if (typeStr.includes('|')) {
    const types = typeStr.split('|').map(t => t.trim());
    types.forEach(t => {
      const refs = extractTypeReferences(t, knownTypes);
      refs.forEach(ref => references.add(ref));
    });
  }
  
  return references;
}

function renderImports(references, currentTypeName) {
  // Filter out self-references (e.g., User importing User)
  const filteredRefs = Array.from(references).filter(ref => ref !== currentTypeName);
  
  if (filteredRefs.length === 0) {
    return '';
  }
  
  return filteredRefs
    .sort()
    .map(ref => `import { ${ref} } from './${ref}';`)
    .join('\n') + '\n\n';
}

function renderModel(model, knownTypes = new Set()) {
  let output = '';
  
  // Extract and render imports for folder mode
  if (knownTypes.size > 0 && model.type === 'interface') {
    const references = new Set();
    for (const prop of model.properties) {
      const refs = extractTypeReferences(prop.type, knownTypes);
      refs.forEach(ref => references.add(ref));
    }
    output += renderImports(references, model.name);
  }

  if (model.description) {
    output += `/**\n * ${model.description}\n */\n`;
  }

  if (model.type === 'interface') {
    output += `export interface ${model.name} {\n`;
    for (const prop of model.properties) {
      if (prop.description) {
        output += `  /** ${prop.description} */\n`;
      }
      output += `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};\n`;
    }
    output += '}\n';
  } else if (model.type === 'enum') {
    if (model.emitPreserveMarker && model.preservedKeys && model.preservedKeys.length > 0) {
      output += renderPreserveMarker(model.preservedKeys);
    }
    output += `export enum ${model.name} {\n`;
    for (const val of model.values) {
      output += `  ${val.key} = ${val.isString ? `"${val.value}"` : val.value}`;
      if (val !== model.values[model.values.length - 1]) {
        output += ',';
      }
      output += '\n';
    }
    output += '}\n';
  }

  return output;
}

function renderTemplate(data) {
  let output = '';

  if (data.addWarningHeader) {
    output += renderWarningHeader(data.preservedKeys || []);
  }

  for (const iface of data.interfaces) {
    output += renderModel({ ...iface, type: 'interface' }, new Set()) + '\n';
  }

  for (const enumItem of data.enums) {
    output += renderModel({ ...enumItem, type: 'enum' }, new Set()) + '\n';
  }

  return output.trim();
}

const reservedWords = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'as', 'implements', 'interface', 'let', 'package', 'private',
  'protected', 'public', 'static', 'yield', 'any', 'boolean', 'constructor',
  'declare', 'get', 'module', 'require', 'number', 'set', 'string', 'symbol',
  'type', 'from', 'of'
]);

function splitIntoWords(input) {
  const str = String(input ?? '').trim();
  if (!str) return [];

  // Normalize separators to spaces, then split.
  const normalized = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  return normalized ? normalized.split(/\s+/) : [];
}

function toPascalCase(input) {
  const words = splitIntoWords(input);
  const joined = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return joined || 'Unnamed';
}

function toCamelCase(input) {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function isValidIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !reservedWords.has(name);
}

function toTsPropertyName(rawName, preferredIdentifier) {
  const preferred = preferredIdentifier && isValidIdentifier(preferredIdentifier)
    ? preferredIdentifier
    : null;

  if (preferred) return preferred;

  const literal = String(rawName).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${literal}'`;
}

// Convert string naming convention
function convertName(name, convention) {
  switch (convention) {
    case 'PascalCase':
      return toPascalCase(name);
    case 'camelCase':
      return toCamelCase(name);
    default:
      return name;
  }
}

// Generate enum key from value
// If value is a valid identifier, use it directly; otherwise prefix with "Enum"
function generateEnumKey(value) {
  const strValue = String(value);

  if (isValidIdentifier(strValue)) {
    return strValue;
  }

  // Negative numbers: EnumMinus1, EnumMinus2
  if (/^-?\d+$/.test(strValue)) {
    const num = Number(strValue);
    if (num < 0) {
      return `EnumMinus${Math.abs(num)}`;
    }
    return `Enum${strValue}`;
  }

  // Generate PascalCase and ensure valid identifier
  const pascal = toPascalCase(strValue);

  // If still invalid after conversion, add Enum prefix
  if (!isValidIdentifier(pascal)) {
    return `Enum${pascal}`;
  }

  return pascal;
}

/**
 * Check if an enum key is auto-generated by generateEnumKey
 * Auto-generated keys follow patterns like:
 * - EnumValue0, EnumValue1 (for string values)
 * - Enum0, Enum1 (for positive numbers)
 * - EnumMinus1, EnumMinus2 (for negative numbers)
 * - EnumWord, EnumWord (for PascalCase converted values)
 *
 * Returns true if the key appears to be auto-generated
 */
function isAutoGeneratedKey(key) {
  const strKey = String(key);

  // Check for EnumValueN pattern (most common for strings)
  if (/^EnumValue\d+$/.test(strKey)) {
    return true;
  }

  // Check for EnumN pattern (for positive numbers)
  if (/^Enum\d+$/.test(strKey)) {
    return true;
  }

  // Check for EnumMinusN pattern (for negative numbers)
  if (/^EnumMinus\d+$/.test(strKey)) {
    return true;
  }

  // Any key starting with "Enum" followed by PascalCase is likely auto-generated
  // e.g., EnumSuccess, EnumHelloWorld
  if (/^Enum[A-Z][a-zA-Z]*$/.test(strKey)) {
    return true;
  }

  return false;
}

/**
 * Detect which enum keys from existing file are already translated
 * A key is considered "translated" if:
 * 1. It's NOT auto-generated (per isAutoGeneratedKey)
 * 2. It's a valid PascalCase identifier
 *
 * @param {Array} existingValues - Existing enum values from file
 * @returns {Set} - Set of enum values that have translated keys
 */
function detectTranslatedEnumValues(existingValues) {
  const translatedValues = new Set();

  for (const existing of existingValues) {
    if (!isAutoGeneratedKey(existing.key)) {
      // This key appears to be manually translated or AI-translated
      translatedValues.add(existing.value);
    }
  }

  return translatedValues;
}

// Map OpenAPI type to TypeScript type
function mapType(schema, config) {
  if (!schema) return 'any';
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return convertName(refName, config.naming.interface);
  }
  if (schema.enum) return schema.type === 'string' ? 'string' : 'number';
  if (schema.type === 'array') {
    const itemType = mapType(schema.items, config);
    return config.typeMapping.array.replace('{{type}}', itemType);
  }
  if (schema.format && config.formatMapping[schema.format]) {
    return config.formatMapping[schema.format];
  }
  return config.typeMapping[schema.type] || 'any';
}

// Parse OpenAPI spec
function parseSchemas(spec, config, interfaces, enums) {
  const schemaDefinitions = spec.components?.schemas || spec.definitions || {};

  for (const [name, schema] of Object.entries(schemaDefinitions)) {
    if (schema.enum) {
      const usedKeys = new Set();
      enums.push({
        name: convertName(name, config.naming.enum),
        description: schema.description || '',
        values: schema.enum.map((v, index) => {
          let key = generateEnumKey(v);
          while (usedKeys.has(key)) {
            key = `${key}_${index}`;
          }
          usedKeys.add(key);
          return {
            key,
            value: v,
            isString: typeof v === 'string'
          };
        })
      });
      continue;
    }

    if (schema.type === 'object' || schema.properties) {
      const properties = [];
      const requiredFields = new Set(schema.required || []);

      for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
        const preferred = convertName(propName, config.naming.property);
        properties.push({
          name: toTsPropertyName(propName, preferred),
          type: mapType(propSchema, config),
          required: requiredFields.has(propName),
          description: propSchema.description || ''
        });
      }

      interfaces.push({
        name: convertName(name, config.naming.interface),
        description: schema.description || '',
        properties: properties
      });
    }
  }
}

/**
 * Parse existing enum file to extract current values
 */
function parseExistingEnumFile(filePath, enumName) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');

    if (enumName) {
      return parseExistingEnumValuesFromContent(content, enumName);
    }

    const enumMatch = content.match(/export enum\s+(\w+)\s*\{([\s\S]*?)\}/);
    if (!enumMatch) return [];
    return parseEnumValuesFromBody(enumMatch[2]);
  } catch (error) {
    console.error(`Warning: Failed to parse existing enum file: ${error.message}`);
    return [];
  }
}

function generateToFolder(interfaces, enums, outputDir, config, enumProtectStrategy = 'none') {
  const generatedFiles = [];

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const knownTypes = new Set();
  interfaces.forEach(i => knownTypes.add(i.name));
  enums.forEach(e => knownTypes.add(e.name));

  for (const iface of interfaces) {
    const fileName = `${iface.name}${config.output.fileExtension}`;
    const filePath = path.join(outputDir, fileName);
    const warningHeader = config.output.addWarningHeader ? renderWarningHeader() : '';
    const content = warningHeader + renderModel({ ...iface, type: 'interface' }, knownTypes);
    fs.writeFileSync(filePath, content, 'utf8');
    generatedFiles.push(fileName);
  }

  for (const enumItem of enums) {
    const fileName = `${enumItem.name}${config.output.fileExtension}`;
    const filePath = path.join(outputDir, fileName);

    let preservedKeys = [];
    let existingValues = [];
    let finalValues = enumItem.values;

    const existingFile = path.join(outputDir, fileName);
    existingValues = parseExistingEnumFile(existingFile);

    if (enumProtectStrategy !== 'none' && enumProtectStrategy !== 'always') {
      preservedKeys = parseFileHeader(existingFile);

      if (preservedKeys.length > 0 || existingValues.length > 0) {
        finalValues = mergeEnumValues(enumItem.values, preservedKeys, existingValues);
      }
    } else if (existingValues.length > 0) {
      // Even without enumProtectStrategy, auto-detect and preserve translated keys
      finalValues = mergeEnumValues(enumItem.values, [], existingValues);
    }

    const warningHeader = config.output.addWarningHeader ? renderWarningHeader(preservedKeys) : '';
    const content = warningHeader + renderModel({ ...enumItem, type: 'enum', values: finalValues }, knownTypes);
    fs.writeFileSync(filePath, content, 'utf8');
    generatedFiles.push(fileName);
  }

  if (config.output.generateIndex && generatedFiles.length > 0) {
    const indexContent = generatedFiles
      .sort()
      .map(file => file.replace(config.output.fileExtension, ''))
      .map(name => `export * from './${name}';`)
      .join('\n');

    const indexPath = path.join(outputDir, config.output.indexFileName);
    fs.writeFileSync(indexPath, indexContent + '\n', 'utf8');
    generatedFiles.push(config.output.indexFileName);
  }

  return generatedFiles;
}

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
    return {
      ...defaultConfig,
      typeMapping: { ...defaultConfig.typeMapping, ...(userConfig.typeMapping || {}) },
      formatMapping: { ...defaultConfig.formatMapping, ...(userConfig.formatMapping || {}) },
      naming: { ...defaultConfig.naming, ...(userConfig.naming || {}) },
      output: { ...defaultConfig.output, ...(userConfig.output || {}) }
    };
  } catch (error) {
    console.error(`Warning: Failed to parse config.json, using defaults: ${error.message}`);
    return defaultConfig;
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate input file (size and format)
 */
function validateInputFile(filePath) {
  const stats = fs.statSync(filePath);

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const ext = path.extname(filePath);
  if (ext !== '.json') {
    throw new Error('Input file must be a JSON file');
  }

  // Validate JSON format
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    JSON.parse(content);
  } catch (e) {
    throw new Error('Invalid JSON format in input file');
  }

  return true;
}

// Default configuration (built-in, no config file needed)
const defaultConfig = {
  typeMapping: {
    string: 'string',
    integer: 'number',
    int: 'number',
    float: 'number',
    boolean: 'boolean',
    array: 'Array<{{type}}>',
    object: 'Record<string, any>'
  },
  formatMapping: {
    date: 'Date',
    'date-time': 'Date',
    uuid: 'string',
    uri: 'string',
    url: 'string',
    email: 'string',
    password: 'string',
    byte: 'string',
    binary: 'Blob',
    int64: 'number'
  },
  naming: {
    interface: 'PascalCase',
    property: 'preserve',
    enum: 'PascalCase'
  },
  output: {
    addWarningHeader: true,
    mode: 'auto',
    generateIndex: true,
    fileExtension: '.ts',
    indexFileName: 'index.ts'
  }
};

// Main generation function
function generate(inputFile, outputDir, options = {}) {
  validateInputFile(inputFile);

  const specContent = fs.readFileSync(inputFile, 'utf8');
  const spec = JSON.parse(specContent);

  const config = loadConfig();

  const interfaces = [];
  const enums = [];

  parseSchemas(spec, config, interfaces, enums);

  const generatedFiles = generateToFolder(interfaces, enums, outputDir, config, options.enumProtect);
  return {
    success: true,
    outputDir,
    generatedFiles,
    interfaceCount: interfaces.length,
    enumCount: enums.length
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const outputDir = args[1] || './types';

  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--enum-protect' && args[i + 1]) {
      options.enumProtect = args[i + 1];
      i++;
    }
  }

  if (!inputFile) {
    console.error('Error: Input file is required');
    console.log(JSON.stringify({ success: false, error: 'Input file is required' }));
    process.exit(1);
  }

  try {
    if (path.extname(outputDir) === '.ts') {
      throw new Error('Single-file output is not supported. Pass an output directory (e.g. ./types/)');
    }
    if (fs.existsSync(outputDir) && fs.statSync(outputDir).isFile()) {
      throw new Error(`Output path is a file, expected a directory: ${outputDir}`);
    }

    const result = generate(inputFile, outputDir, options);
    console.error(`Generated ${result.generatedFiles.length} files in ${result.outputDir}`);
    console.error(`  - ${result.interfaceCount} interfaces`);
    console.error(`  - ${result.enumCount} enums`);
    console.log(JSON.stringify(result));
  } catch (error) {
    const errorCode = getErrorCode(error);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      code: errorCode
    }));
    process.exit(1);
  }
}

/**
 * Map errors to standardized error codes
 */
function getErrorCode(error) {
  if (error.message.includes('Input file') || error.message.includes('required')) {
    return 'INVALID_INPUT';
  }
  if (error.message.includes('JSON')) {
    return 'INVALID_JSON';
  }
  if (error.message.includes('No schemas') || error.message.includes('Empty or invalid')) {
    return 'NO_SCHEMAS';
  }
  if (error.message.includes('permission') || error.message.includes('denied')) {
    return 'PERMISSION_DENIED';
  }
  if (error.message.includes('Single-file output')) {
    return 'SINGLE_FILE_NOT_SUPPORTED';
  }
  if (error.message.includes('is a file, expected a directory')) {
    return 'INVALID_OUTPUT_PATH';
  }
  return 'UNKNOWN';
}

module.exports = { generate };

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function renderTemplate(data) {
  let output = '';

  if (data.addWarningHeader) {
    output += '/**\n * Auto-generated from OpenAPI specification\n * Do not edit manually\n */\n\n';
  }

  for (const iface of data.interfaces) {
    if (iface.description) {
      output += `/**\n * ${iface.description}\n */\n`;
    }
    output += `export interface ${iface.name} {\n`;
    for (const prop of iface.properties) {
      if (prop.description) {
        output += `  /** ${prop.description} */\n`;
      }
      output += `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};\n`;
    }
    output += '}\n\n';
  }

  for (const enumItem of data.enums) {
    if (enumItem.description) {
      output += `/**\n * ${enumItem.description}\n */\n`;
    }
    output += `export enum ${enumItem.name} {\n`;
    for (const val of enumItem.values) {
      output += `  ${val.key} = ${val.isString ? `"${val.value}"` : val.value}`;
      if (val !== enumItem.values[enumItem.values.length - 1]) {
        output += ',';
      }
      output += '\n';
    }
    output += '}\n\n';
  }

  return output.trim();
}

// Convert string naming convention
function convertName(name, convention) {
  switch (convention) {
    case 'PascalCase':
      return name.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
                 .replace(/^[a-z]/, c => c.toUpperCase());
    default:
      return name;
  }
}

// Map OpenAPI type to TypeScript type
function mapType(schema, config) {
  if (!schema) return 'any';
  if (schema.$ref) return schema.$ref.split('/').pop();
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
      enums.push({
        name: convertName(name, config.naming.enum),
        description: schema.description || '',
        values: schema.enum.map(v => ({
          key: convertName(String(v), config.naming.enum),
          value: v,
          isString: typeof v === 'string'
        }))
      });
      continue;
    }

    if (schema.type === 'object' || schema.properties) {
      const properties = [];
      const requiredFields = new Set(schema.required || []);

      for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
        properties.push({
          name: convertName(propName, config.naming.property),
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

// Main generation function
function generate(inputFile, outputFile) {
  const specContent = fs.readFileSync(inputFile, 'utf8');
  const spec = JSON.parse(specContent);

  const defaultConfigPath = path.join(__dirname, '..', 'config.json');
  const config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));

  const interfaces = [];
  const enums = [];

  parseSchemas(spec, config, interfaces, enums);

  const output = renderTemplate({
    addWarningHeader: config.output.addWarningHeader,
    interfaces,
    enums
  });

  fs.writeFileSync(outputFile, output, 'utf8');

  return {
    success: true,
    outputFile,
    interfaceCount: interfaces.length,
    enumCount: enums.length
  };
}

if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || 'api-models.ts';

  if (!inputFile) {
    console.error(JSON.stringify({ success: false, error: 'Input file is required' }));
    process.exit(1);
  }

  try {
    const result = generate(inputFile, outputFile);
    console.error(`Generated ${result.interfaceCount} interfaces, ${result.enumCount} enums`);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.log(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

module.exports = { generate };

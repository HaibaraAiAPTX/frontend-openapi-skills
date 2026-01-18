#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function renderWarningHeader() {
  return '/**\n * Auto-generated from OpenAPI specification\n * Do not edit manually\n */\n\n';
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
    output += renderWarningHeader();
  }

  for (const iface of data.interfaces) {
    output += renderModel({ ...iface, type: 'interface' }, new Set()) + '\n';
  }

  for (const enumItem of data.enums) {
    output += renderModel({ ...enumItem, type: 'enum' }, new Set()) + '\n';
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

function generateToFolder(interfaces, enums, outputDir, config) {
  const generatedFiles = [];
  const warningHeader = config.output.addWarningHeader ? renderWarningHeader() : '';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const knownTypes = new Set();
  interfaces.forEach(i => knownTypes.add(i.name));
  enums.forEach(e => knownTypes.add(e.name));

  for (const iface of interfaces) {
    const fileName = `${iface.name}${config.output.fileExtension}`;
    const filePath = path.join(outputDir, fileName);
    const content = warningHeader + renderModel({ ...iface, type: 'interface' }, knownTypes);
    fs.writeFileSync(filePath, content, 'utf8');
    generatedFiles.push(fileName);
  }

  for (const enumItem of enums) {
    const fileName = `${enumItem.name}${config.output.fileExtension}`;
    const filePath = path.join(outputDir, fileName);
    const content = warningHeader + renderModel({ ...enumItem, type: 'enum' }, knownTypes);
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

// Main generation function
function generate(inputFile, outputFile, options = {}) {
  const specContent = fs.readFileSync(inputFile, 'utf8');
  const spec = JSON.parse(specContent);

  const defaultConfigPath = path.join(__dirname, '..', 'config.json');
  const config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));

  const interfaces = [];
  const enums = [];

  parseSchemas(spec, config, interfaces, enums);

  let outputMode = options.mode || config.output.mode;
  if (outputMode === 'auto') {
    if (fs.existsSync(outputFile)) {
      outputMode = fs.statSync(outputFile).isDirectory() ? 'folder' : 'single';
    } else {
      outputMode = path.extname(outputFile) === '.ts' ? 'single' : 'folder';
    }
  }

  if (outputMode === 'folder') {
    const generatedFiles = generateToFolder(interfaces, enums, outputFile, config);
    return {
      success: true,
      outputMode: 'folder',
      outputDir: outputFile,
      generatedFiles,
      interfaceCount: interfaces.length,
      enumCount: enums.length
    };
  } else {
    const output = renderTemplate({
      addWarningHeader: config.output.addWarningHeader,
      interfaces,
      enums
    });

    fs.writeFileSync(outputFile, output, 'utf8');

    return {
      success: true,
      outputMode: 'single',
      outputFile,
      interfaceCount: interfaces.length,
      enumCount: enums.length
    };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  let outputFile = args[1] || 'api-models.ts';

  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--output-mode' && args[i + 1]) {
      options.mode = args[i + 1];
      i++;
    }
  }

  if (!inputFile) {
    console.error(JSON.stringify({ success: false, error: 'Input file is required' }));
    process.exit(1);
  }

  try {
    const result = generate(inputFile, outputFile, options);
    if (result.outputMode === 'folder') {
      console.error(`Generated ${result.generatedFiles.length} files in ${result.outputDir}`);
      console.error(`  - ${result.interfaceCount} interfaces`);
      console.error(`  - ${result.enumCount} enums`);
    } else {
      console.error(`Generated ${result.interfaceCount} interfaces, ${result.enumCount} enums to ${result.outputFile}`);
    }
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.log(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

module.exports = { generate };

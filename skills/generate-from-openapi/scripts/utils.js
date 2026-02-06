/**
 * Utility functions for the generate-from-openapi skill
 */

/**
 * Convert string to PascalCase
 * @param {string} input - Input string
 * @returns {string} PascalCase string
 */
export function toPascalCase(input) {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/**
 * Convert string to camelCase
 * @param {string} input - Input string
 * @returns {string} camelCase string
 */
export function toCamelCase(input) {
  const pascal = toPascalCase(input);
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : "";
}

/**
 * Sanitize identifier to make it valid TypeScript/JavaScript identifier
 * @param {string} name - Raw identifier name
 * @returns {string} Valid identifier
 */
export function sanitizeIdentifier(name) {
  const safe = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (!safe) return "op";
  if (/^[0-9]/.test(safe)) return `op_${safe}`;
  return safe;
}

/**
 * Validate OpenAPI spec file path
 * @param {string} filePath - Path to OpenAPI spec file
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateSpecPath(filePath) {
  if (!filePath) {
    return { valid: false, error: "OpenAPI spec file path is required" };
  }
  if (typeof filePath !== "string") {
    return { valid: false, error: "File path must be a string" };
  }
  return { valid: true };
}

/**
 * Validate OpenAPI spec object
 * @param {object} spec - OpenAPI specification object
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateSpec(spec) {
  if (!spec) {
    return { valid: false, error: "OpenAPI spec is required" };
  }
  if (typeof spec !== "object") {
    return { valid: false, error: "OpenAPI spec must be an object" };
  }
  if (!spec.paths || typeof spec.paths !== "object") {
    return { valid: false, error: "OpenAPI spec must have a 'paths' object" };
  }
  if (!spec.info || typeof spec.info !== "object") {
    return { valid: false, error: "OpenAPI spec must have an 'info' object" };
  }
  return { valid: true };
}

/**
 * Validate output path
 * @param {string} outputPath - Output file path
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateOutputPath(outputPath) {
  if (!outputPath) {
    return { valid: false, error: "Output path is required" };
  }
  if (typeof outputPath !== "string") {
    return { valid: false, error: "Output path must be a string" };
  }
  if (!outputPath.endsWith(".ts") && !outputPath.endsWith(".tsx")) {
    return { valid: false, error: "Output path must end with .ts or .tsx" };
  }
  return { valid: true };
}

/**
 * Validate import statement
 * @param {string} importStatement - Import statement to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateImport(importStatement) {
  if (!importStatement) {
    return { valid: true };
  }
  if (typeof importStatement !== "string") {
    return { valid: false, error: "Import statement must be a string" };
  }
  if (!importStatement.trim().startsWith("import")) {
    return { valid: false, error: "Import statement must start with 'import'" };
  }
  return { valid: true };
}

/**
 * Validate query detection rules
 * @param {object} rules - Query detection rules to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateQueryRules(rules) {
  if (!rules) {
    return { valid: true };
  }
  if (typeof rules !== "object") {
    return { valid: false, error: "Query rules must be an object" };
  }
  if (rules.methods && !Array.isArray(rules.methods)) {
    return { valid: false, error: "Query rules.methods must be an array" };
  }
  if (rules.pathPatterns && !Array.isArray(rules.pathPatterns)) {
    return { valid: false, error: "Query rules.pathPatterns must be an array" };
  }
  if (rules.forceQuery && !Array.isArray(rules.forceQuery)) {
    return { valid: false, error: "Query rules.forceQuery must be an array" };
  }
  if (rules.forceMutation && !Array.isArray(rules.forceMutation)) {
    return { valid: false, error: "Query rules.forceMutation must be an array" };
  }
  return { valid: true };
}

/**
 * Validate Handlebars template by attempting to compile it
 * @param {string} content - Template content to validate
 * @param {string} filePath - File path for error messages
 * @param {object} Handlebars - Handlebars instance
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateTemplate(content, filePath, Handlebars) {
  try {
    Handlebars.compile(content);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Template syntax error in ${filePath}: ${error.message}`,
    };
  }
}

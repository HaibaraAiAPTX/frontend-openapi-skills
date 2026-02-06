/**
 * OpenAPI Parser - Extracts operations, parameters, and types from OpenAPI spec
 */

import { toCamelCase, sanitizeIdentifier } from "./utils.js";

/**
 * Get schema reference name from $ref string
 * @param {object} schema - Schema object
 * @returns {string|null} Schema name or null
 */
function getSchemaRefName(schema) {
  if (!schema) return null;
  if (schema.$ref && typeof schema.$ref === "string") {
    const prefix = "#/components/schemas/";
    if (!schema.$ref.startsWith(prefix)) return null;
    return schema.$ref.slice(prefix.length) || null;
  }
  return null;
}

/**
 * Pick content schema from content object
 * @param {object} content - Content object from request/response
 * @returns {object|null} Schema object or null
 */
function pickContentSchema(content) {
  if (!content) return null;
  const priority = ["application/json", "text/json", "text/plain", "application/*+json"];
  for (const key of priority) {
    if (content[key]?.schema) return content[key].schema;
  }
  const firstKey = Object.keys(content)[0];
  return firstKey ? content[firstKey]?.schema ?? null : null;
}

/**
 * Pick response schema from responses object
 * @param {object} responses - Responses object from OpenAPI operation
 * @returns {object|null} Schema object or null
 */
function pickResponseSchema(responses) {
  if (!responses) return null;
  const statusKeys = Object.keys(responses);
  const okKey =
    statusKeys.find((k) => k.startsWith("2")) ??
    (responses["default"] ? "default" : null);
  if (!okKey) return null;
  const content = responses[okKey]?.content;
  return pickContentSchema(content);
}

/**
 * Determine if operation is a query operation
 * @param {{ pathKey: string, method: string }} params - Operation parameters
 * @param {object|null} rules - Custom query detection rules
 * @returns {boolean} True if operation should be treated as query
 */
function isQueryOperation({ pathKey, method }, rules = null) {
  const p = pathKey.toLowerCase();

  if (rules) {
    if (rules.forceMutation?.some((pattern) => matchPattern(pathKey, pattern))) {
      return false;
    }
    if (rules.forceQuery?.some((pattern) => matchPattern(pathKey, pattern))) {
      return true;
    }
    if (rules.methods?.includes(method.toLowerCase())) {
      return true;
    }
    if (rules.pathPatterns?.some((pattern) => matchPattern(p, pattern))) {
      return true;
    }
  }

  if (method === "get") return true;
  return (
    p.includes("/get") ||
    p.includes("/query") ||
    p.endsWith("/list") ||
    p.endsWith("/info") ||
    p.includes("getlist") ||
    p.includes("getinfo") ||
    p.includes("query")
  );
}

/**
 * Check if path matches a pattern (supports wildcards)
 */
function matchPattern(path, pattern) {
  const p = pattern.toLowerCase();
  const pathLower = path.toLowerCase();

  if (p.includes("*")) {
    const regex = new RegExp("^" + p.replace(/\*/g, ".*") + "$");
    return regex.test(pathLower);
  }
  return pathLower.includes(p);
}

/**
 * Build operation name from tag, path, and method
 * @param {string} tag - Operation tag
 * @param {string} pathKey - API path
 * @param {string} method - HTTP method
 * @returns {string} Operation name in camelCase
 */
function buildOperationName({ tag, pathKey, method }) {
  const segments = pathKey.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "op";
  const base = `${tag ?? "default"}_${last}_${method}`;
  return sanitizeIdentifier(toCamelCase(base));
}

/**
 * Collect and categorize parameters
 * @param {Array<object>} parameters - Parameters from OpenAPI operation
 * @returns {{ pathParams: Array<object>, queryParams: Array<object> }} Categorized parameters
 */
function collectParams(parameters) {
  const pathParams = [];
  const queryParams = [];
  for (const p of parameters ?? []) {
    const where = p.in;
    const name = p.name;
    const required = Boolean(p.required);
    const schema = p.schema ?? null;
    const refName = getSchemaRefName(schema);
    const paramType = refName
      ? `Domains.${refName}`
      : schema?.type === "integer" || schema?.type === "number"
        ? "number"
        : schema?.type === "boolean"
          ? "boolean"
          : "string";
    const entry = { name, required, type: paramType };
    if (where === "path") pathParams.push(entry);
    if (where === "query") queryParams.push(entry);
  }
  return { pathParams, queryParams };
}

/**
 * Parse OpenAPI spec and extract all operations
 * @param {object} spec - OpenAPI specification object
 * @param {object|null} queryDetectionRules - Custom query detection rules
 * @returns {{ operations: Array<object>, info: object }} Parsed operations and metadata
 */
export function parseOperations(spec, queryDetectionRules = null) {
  const paths = spec.paths ?? {};
  const operations = [];
  const usedNames = new Map();

  for (const [pathKey, ops] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(ops)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      const tag = Array.isArray(op.tags) ? op.tags[0] : "default";
      let name = buildOperationName({ tag, pathKey, method });
      const count = (usedNames.get(name) ?? 0) + 1;
      usedNames.set(name, count);
      if (count > 1) name = `${name}_${count}`;

      const requestSchema = pickContentSchema(op.requestBody?.content);
      const requestRef = getSchemaRefName(requestSchema);
      const hasBody = Boolean(requestSchema);
      const bodyType = requestRef ? `Domains.${requestRef}` : hasBody ? "unknown" : "never";

      const responseSchema = pickResponseSchema(op.responses);
      const responseRef = getSchemaRefName(responseSchema);
      const responseType = responseRef ? `Domains.${responseRef}` : "unknown";

      const { pathParams, queryParams } = collectParams(op.parameters);
      const hasArgs = hasBody || pathParams.length > 0 || queryParams.length > 0;
      const requiredArgs =
        hasBody || pathParams.some((p) => p.required) || queryParams.some((p) => p.required);

      const isQuery = isQueryOperation({ pathKey, method }, queryDetectionRules);

      operations.push({
        name,
        tag,
        method: method.toUpperCase(),
        pathKey,
        summary: op.summary ?? "",
        description: op.description ?? "",
        isQuery,
        isMutation: !isQuery,
        hasBody,
        bodyType,
        responseType,
        pathParams,
        queryParams,
        hasArgs,
        requiredArgs,
      });
    }
  }

  return {
    operations,
    info: {
      title: spec.info?.title ?? "API",
      version: spec.info?.version ?? "1.0.0",
      description: spec.info?.description,
    },
  };
}

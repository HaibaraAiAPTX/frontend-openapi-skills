# HTTP Request Parameter Passing Guide

This document describes all HTTP request parameter passing methods that plugins must handle when generating code from OpenAPI IR data. Each endpoint may use one or a combination of these methods.

## Table of Contents

- [Overview](#overview)
- [Path Parameters](#path-parameters)
- [Query Parameters](#query-parameters)
- [Request Body](#request-body)
- [Combinations](#combinations)
- [IR Field Mapping](#ir-field-mapping)
- [Code Generation Patterns](#code-generation-patterns)

## Overview

When generating HTTP client code from OpenAPI specs, every endpoint can receive input through three distinct channels:

| Channel | IR Field | HTTP Location | Typical Methods |
|---------|----------|---------------|-----------------|
| Path params | `path_fields` | URL path segments (`/users/{id}`) | GET, PUT, DELETE, PATCH |
| Query params | `query_fields` | URL query string (`?page=1&size=10`) | GET, DELETE |
| Request body | `request_body_field` | HTTP request body (JSON/form-data) | POST, PUT, PATCH |

A single endpoint may use **any combination** of these channels. Your plugin **must** handle all cases correctly.

## Path Parameters

Path parameters are embedded directly into the URL path. In OpenAPI, they are declared with `in: path`.

**OpenAPI Example:**
```yaml
/users/{userId}/posts/{postId}:
  get:
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
      - name: postId
        in: path
        required: true
        schema:
          type: integer
```

**Generated Code Pattern:**
```typescript
// Path params are interpolated into the URL string
const url = `/users/${params.userId}/posts/${params.postId}`;
```

**IR Access:**
```typescript
for (const ep of ir.endpoints) {
  // ep.path_fields is an array of path parameter names
  // e.g., ['userId', 'postId']
  if (ep.path_fields.length > 0) {
    // This endpoint has path parameters
    const pathTemplate = ep.path; // "/users/{userId}/posts/{postId}"
    // Replace {param} with actual values in generated code
  }
}
```

**Key Rules:**
- Path parameters are **always required** (HTTP spec requirement)
- The `ep.path` field contains the template with `{paramName}` placeholders
- Use `ep.path_fields` to know which parameters need interpolation

## Query Parameters

Query parameters are appended to the URL after `?`. In OpenAPI, they are declared with `in: query`.

**OpenAPI Example:**
```yaml
/users:
  get:
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: size
        in: query
        schema:
          type: integer
          default: 20
      - name: status
        in: query
        schema:
          type: string
          enum: [active, inactive]
```

**Generated Code Pattern:**
```typescript
// Query params are appended as URL search params
const params = new URLSearchParams();
if (input.page != null) params.append('page', String(input.page));
if (input.size != null) params.append('size', String(input.size));
if (input.status != null) params.append('status', input.status);
const url = `/users?${params.toString()}`;
```

**IR Access:**
```typescript
for (const ep of ir.endpoints) {
  // ep.query_fields is an array of query parameter names
  // e.g., ['page', 'size', 'status']
  if (ep.query_fields.length > 0) {
    // This endpoint has query parameters
  }
}
```

**Key Rules:**
- Query parameters may be optional or required
- Use `ep.query_fields` to identify all query parameter names
- Handle `null`/`undefined` values by omitting them from the query string
- For array-type query params, consider repeating the key (`?ids=1&ids=2`)

## Request Body

The request body carries the payload data, typically as JSON. In OpenAPI 3.x, it is declared via `requestBody`.

**OpenAPI Example:**
```yaml
/users:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              email:
                type: string
              role:
                type: string
                default: user
```

**Generated Code Pattern:**
```typescript
// Body is passed as the request payload
const response = await fetch('/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: input.name,
    email: input.email,
    role: input.role ?? 'user',
  }),
});
```

**IR Access:**
```typescript
for (const ep of ir.endpoints) {
  // ep.request_body_field is a string (field name) or undefined
  if (ep.request_body_field) {
    // This endpoint has a request body
    // The field name indicates which property of the input type holds the body data
    const bodyFieldName = ep.request_body_field;
  }
}
```

**Key Rules:**
- `request_body_field` is a **single string** (not an array) — it names the field in the input type that holds the body data
- If `request_body_field` is `undefined`, the endpoint has no request body
- Typical for POST, PUT, PATCH methods
- The body content type is usually `application/json` but could also be `multipart/form-data`, `application/x-www-form-urlencoded`, etc.

## Combinations

Most real-world APIs use **multiple parameter passing methods simultaneously**. Your plugin must detect and handle every combination.

### Combination 1: Path + Query

Common for filtered/detail views:

```yaml
# GET /users/{userId}/orders?page=1&status=active
/users/{userId}/orders:
  get:
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
      - name: page
        in: query
        schema:
          type: integer
      - name: status
        in: query
        schema:
          type: string
```

**Detection:**
```typescript
if (ep.path_fields.length > 0 && ep.query_fields.length > 0 && !ep.request_body_field) {
  // Path + Query combination
}
```

### Combination 2: Path + Body

Common for update operations:

```yaml
# PUT /users/{userId}
/users/{userId}:
  put:
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              email:
                type: string
```

**Detection:**
```typescript
if (ep.path_fields.length > 0 && ep.request_body_field && ep.query_fields.length === 0) {
  // Path + Body combination
}
```

### Combination 3: Query + Body

Less common but valid (e.g., POST with query-based routing):

```yaml
# POST /uploads?type=avatar
/uploads:
  post:
    parameters:
      - name: type
        in: query
        schema:
          type: string
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary
```

**Detection:**
```typescript
if (ep.query_fields.length > 0 && ep.request_body_field && ep.path_fields.length === 0) {
  // Query + Body combination
}
```

### Combination 4: Path + Query + Body

All three together:

```yaml
# PUT /users/{userId}/settings?notify=true
/users/{userId}/settings:
  put:
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
      - name: notify
        in: query
        schema:
          type: boolean
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              theme:
                type: string
              language:
                type: string
```

**Detection:**
```typescript
if (ep.path_fields.length > 0 && ep.query_fields.length > 0 && ep.request_body_field) {
  // Path + Query + Body — all three combined
}
```

### Combination 5: No Parameters

Endpoints with no input at all:

```yaml
# GET /health
/health:
  get:
    responses:
      '200':
        description: OK
```

**Detection:**
```typescript
if (ep.path_fields.length === 0 && ep.query_fields.length === 0 && !ep.request_body_field) {
  // No parameters — simple request
}
```

## IR Field Mapping

The following table summarizes how to map IR fields to parameter handling logic:

```typescript
interface EndpointItem {
  // ... other fields ...

  /** Request body — the field name in the input type that holds body data */
  request_body_field?: string;

  /** Query parameter names */
  query_fields: string[];

  /** Path parameter names */
  path_fields: string[];
}
```

| Scenario | `request_body_field` | `query_fields` | `path_fields` |
|----------|---------------------|----------------|---------------|
| GET /health | `undefined` | `[]` | `[]` |
| GET /users/{id} | `undefined` | `[]` | `['id']` |
| GET /users?page=1 | `undefined` | `['page']` | `[]` |
| POST /users (body) | `'body'` | `[]` | `[]` |
| GET /users/{id}/orders?page=1 | `undefined` | `['page']` | `['id']` |
| PUT /users/{id} (body) | `'body'` | `[]` | `['id']` |
| POST /upload?type=avatar (body) | `'file'` | `['type']` | `[]` |
| PUT /users/{id}/settings?notify=true (body) | `'settings'` | `['notify']` | `['id']` |

## Code Generation Patterns

The code below is a **code generation template** — it runs inside your plugin's handler to produce `.ts` source files. The generated code (the output) must correctly handle path, query, and body parameters at runtime.

When generating HTTP client code, handle parameters in this order:

### Step 1: Build the URL template with path params

```typescript
// Replace path template placeholders with runtime interpolation expressions.
// ep.path: "/users/{userId}" → generated code: `/users/${input.userId}`
function buildUrlTemplate(ep: EndpointItem): string {
  let url = ep.path;
  for (const field of ep.path_fields) {
    // Use replaceAll to handle edge cases where the same param name appears
    // multiple times in the path (e.g. /{id}/copy/{id})
    url = url.replaceAll(`{${field}}`, `\${input.${field}}`);
  }
  return url;
}
// Example: buildUrlTemplate(ep) returns "/users/${input.userId}"
```

### Step 2: Generate query param code

Generate source code that builds the query string at runtime, filtering out null/undefined values:

```typescript
function buildQueryCode(ep: EndpointItem): string | null {
  if (ep.query_fields.length === 0) return null;
  // Generate runtime condition expressions for each query field.
  // Each expression evaluates to "key=encodedValue" or null at runtime.
  const conditions = ep.query_fields.map(
    f => `input.${f} != null ? '${f}=' + encodeURIComponent(String(input.${f})) : null`
  );
  return `[${conditions.join(', ')}].filter(Boolean).join('&')`;
}
// Example output: "[input.page != null ? 'page=' + encodeURIComponent(String(input.page)) : null].filter(Boolean).join('&')"
```

### Step 3: Assemble the full URL code

Combine path and query parts into a single line of generated code. Use string concatenation instead of nested template literals to avoid JS evaluating `${}` expressions at code-generation time:

```typescript
function buildUrlLine(ep: EndpointItem): string[] {
  const urlTemplate = buildUrlTemplate(ep); // e.g. "/users/${input.userId}"
  const queryCode = buildQueryCode(ep);
  const lines: string[] = [];

  if (queryCode) {
    // Build: const url = `/users/${input.userId}?` + [conditions].filter(Boolean).join('&');
    // Use string concat (+) instead of nested template literals to avoid
    // premature evaluation of ${} expressions in urlTemplate at generation time.
    lines.push('  const url = `' + urlTemplate + '?` + ' + queryCode + ';');
  } else {
    lines.push('  const url = `' + urlTemplate + '`;');
  }
  return lines;
}
// Example output for path+query: "  const url = `/users/${input.userId}?` + [...].filter(Boolean).join('&');"
// Example output for path only:   "  const url = `/users/${input.userId}`;"
```

> **Important**: Never nest `urlTemplate` inside a template literal (backtick string) in your generator code.
> The `${input.field}` text must survive as literal text in the generated `.ts` file — it is not a variable
> in the generator's scope. Always use string concatenation (`+`) to build the generated code lines.

### Step 4: Generate request options with body

```typescript
function buildOptionsCode(ep: EndpointItem): string[] {
  const lines: string[] = [];
  lines.push(`  const options: RequestInit = { method: '${ep.method.toUpperCase()}' };`);
  if (ep.request_body_field) {
    lines.push(`  options.headers = { 'Content-Type': 'application/json' };`);
    lines.push(`  options.body = JSON.stringify(input.${ep.request_body_field});`);
  }
  return lines;
}
```

### Complete Handler Example

```typescript
handler: async (ctx, args) => {
  const ir = ctx.getIr(args.input);
  const fs = await import('fs');
  const path = await import('path');

  for (const ep of ir.endpoints) {
    const lines: string[] = [];

    // Determine parameter channels
    const hasPath = ep.path_fields.length > 0;
    const hasQuery = ep.query_fields.length > 0;
    const hasBody = !!ep.request_body_field;

    // Step 1+2+3: Build URL line (path interpolation + query string)
    // Replace {fieldName} with ${input.fieldName} for path params
    let urlTemplate = ep.path;
    if (hasPath) {
      for (const f of ep.path_fields) {
        urlTemplate = urlTemplate.replaceAll(`{${f}}`, `\${input.${f}}`);
      }
    }

    if (hasQuery) {
      // Generate runtime conditions that filter null/undefined at runtime
      const conditions = ep.query_fields.map(
        f => `input.${f} != null ? '${f}=' + encodeURIComponent(String(input.${f})) : null`
      );
      const queryExpr = `[${conditions.join(', ')}].filter(Boolean).join('&')`;
      // Use string concat to embed urlTemplate without evaluating its ${} at generation time
      lines.push('  const url = `' + urlTemplate + '?` + ' + queryExpr + ';');
    } else {
      lines.push('  const url = `' + urlTemplate + '`;');
    }

    // Step 4: Request options with body
    lines.push(`  const options: RequestInit = { method: '${ep.method.toUpperCase()}' };`);
    if (hasBody) {
      lines.push(`  options.headers = { 'Content-Type': 'application/json' };`);
      lines.push(`  options.body = JSON.stringify(input.${ep.request_body_field});`);
    }

    // Assemble the full function and write to file
    const code = `export async function ${ep.export_name}(input: ${ep.input_type_name}) {\n${lines.join('\n')}\n  return fetch(url, options);\n}\n`;

    fs.writeFileSync(path.join(args.output, `${ep.export_name}.ts`), code);
    ctx.log(`Generated ${ep.export_name}.ts (path=${hasPath}, query=${hasQuery}, body=${hasBody})`);
  }
},
```

#### Example Generated Output

For an endpoint `GET /users/{userId}/orders?page=1&status=active` (path + query), the above handler produces:

```typescript
export async function getUserOrders(input: GetUserOrdersInput) {
  const url = `/users/${input.userId}/orders?` + [input.page != null ? 'page=' + encodeURIComponent(String(input.page)) : null, input.status != null ? 'status=' + encodeURIComponent(String(input.status)) : null].filter(Boolean).join('&');
  const options: RequestInit = { method: 'GET' };
  return fetch(url, options);
}
```

For an endpoint `PUT /users/{userId}` with a request body (path + body):

```typescript
export async function updateUser(input: UpdateUserInput) {
  const url = `/users/${input.userId}`;
  const options: RequestInit = { method: 'PUT' };
  options.headers = { 'Content-Type': 'application/json' };
  options.body = JSON.stringify(input.body);
  return fetch(url, options);
}
```

This ensures your plugin-generated code correctly handles **every possible combination** of HTTP parameter passing.

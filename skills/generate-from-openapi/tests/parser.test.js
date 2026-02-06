/**
 * Unit tests for parser.js
 */

import { describe, it, expect } from "vitest";
import { parseOperations } from "../scripts/parser.js";

describe("parser.js", () => {
  describe("parseOperations", () => {
    it("should parse basic OpenAPI spec", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              summary: "Get users",
              responses: {
                "200": {
                  content: { "application/json": { schema: { $ref: "#/components/schemas/UserDTO" } } },
                },
              },
            },
          },
        },
      };

      const result = parseOperations(spec);

      expect(result.operations).toHaveLength(1);
      expect(result.info.title).toBe("Test API");
      expect(result.info.version).toBe("1.0.0");
      expect(result.operations[0].name).toBe("user_users_get");
      expect(result.operations[0].method).toBe("GET");
      expect(result.operations[0].tag).toBe("User");
    });

    it("should parse operations with path parameters", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users/{id}": {
            get: {
              tags: ["User"],
              parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
              ],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations[0].pathParams).toHaveLength(1);
      expect(operations[0].pathParams[0].name).toBe("id");
      expect(operations[0].pathParams[0].required).toBe(true);
      expect(operations[0].pathParams[0].type).toBe("number");
    });

    it("should parse operations with query parameters", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              parameters: [
                { name: "page", in: "query", required: false, schema: { type: "integer" } },
                { name: "size", in: "query", required: false, schema: { type: "integer" } },
              ],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations[0].queryParams).toHaveLength(2);
      expect(operations[0].queryParams[0].name).toBe("page");
      expect(operations[0].queryParams[0].required).toBe(false);
      expect(operations[0].hasArgs).toBe(true);
    });

    it("should parse operations with request body", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users": {
            post: {
              tags: ["User"],
              requestBody: {
                content: {
                  "application/json": { schema: { $ref: "#/components/schemas/CreateUserDTO" } },
                },
              },
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations[0].hasBody).toBe(true);
      expect(operations[0].bodyType).toBe("Domains.CreateUserDTO");
      expect(operations[0].isQuery).toBe(false);
      expect(operations[0].isMutation).toBe(true);
    });

    it("should classify GET requests as queries by default", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/data": {
            get: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[0].isMutation).toBe(false);
    });

    it("should classify POST/PUT/DELETE as mutations by default", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users": {
            post: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/users/{id}": {
            put: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/users/{id}": {
            delete: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations.every((op) => op.isMutation)).toBe(true);
      expect(operations.every((op) => !op.isQuery)).toBe(true);
    });

    it("should classify operations with /get, /list, /info as queries", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/data/get": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/users/list": {
            post: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/product/info": {
            post: {
              tags: ["Product"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations } = parseOperations(spec);

      expect(operations.every((op) => op.isQuery)).toBe(true);
    });

    it("should handle custom query detection rules", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/data": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        methods: ["get", "post"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
    });

    it("should handle forceQuery rules", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users/create": {
            post: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/users/create"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
    });

    it("should handle forceMutation rules", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users/list": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceMutation: ["/api/users/list"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isMutation).toBe(true);
      expect(operations[0].isQuery).toBe(false);
    });

    it("should handle wildcard patterns in force rules", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/batch/process": {
            post: {
              tags: ["Batch"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/batch/*"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
    });

    it("should handle empty paths", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {},
      };

      const { operations } = parseOperations(spec);

      expect(operations).toHaveLength(0);
    });

    it("should handle missing info", () => {
      const spec = {
        paths: {
          "/api/test": {
            get: {
              tags: ["Test"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { info, operations } = parseOperations(spec);

      expect(info.title).toBe("API");
      expect(info.version).toBe("1.0.0");
      expect(operations).toHaveLength(1);
    });

    it("should deduplicate operation names", () => {
      const spec = {
        info: { title: "Test API" },
        paths: {
          "/api/users": {
            get: { tags: ["User"], responses: { "200": { content: { "application/json": {} } } } },
            post: { tags: ["User"], responses: { "200": { content: { "application/json": {} } } } },
          },
        },
      };

      const { operations } = parseOperations(spec);

      const names = operations.map((op) => op.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });
  });
});

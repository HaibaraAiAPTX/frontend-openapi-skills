# Frontend OpenAPI Skills

![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue?style=flat-square)
![OpenAPI](https://img.shields.io/badge/OpenAPI-2.0%20%7C%203.x-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

A collection of Claude Code skills for generating TypeScript models and HTTP clients from OpenAPI/Swagger specifications.

Automatically generate type-safe API client code from your OpenAPI definitions — eliminating manual type definitions and reducing boilerplate.

## Features

- 🚀 **Automated TypeScript Generation** — Convert OpenAPI schemas to TypeScript interfaces and types
- 📁 **Folder Mode** — Generate one TypeScript file per model with automatic imports for better organization
- 📥 **Remote Spec Download** — Fetch OpenAPI specifications from any URL
- 🎯 **Type Safety** — Generate fully typed models and API clients
- ⚙️ **Configurable** — Customize type mappings, naming conventions, and output formats
- 📦 **Easy Integration** — Works seamlessly with Claude Code

## Available Skills

### [download-swagger-file](./skills/download-swagger-file)

Downloads OpenAPI/Swagger specification files from remote URLs. Supports both JSON and YAML formats.

### [generate-ts-models](./skills/generate-ts-models)

Generates TypeScript type declarations (interfaces, types, enums) from OpenAPI/Swagger specifications with two output modes:

- **Single File Mode** — All models in one TypeScript file (backward compatible)
- **Folder Mode** — One file per model with automatic type imports and index.ts for easy navigation

## Installation
```bash
# Add this repository as a marketplace
/plugin marketplace add https://github.com/HaibaraAiAPTX/frontend-openapi-skills

# Install the plugin
/plugin install frontend-openapi-skills@frontend-openapi-skills
```

## Usage

### Basic Usage

Download and convert OpenAPI spec to TypeScript models:

```
Download https://petstore.swagger.io/v2/swagger.json file and convert to TypeScript models
```

### Single File Mode (Default)

Generate all models in a single TypeScript file:

```
Download https://api.example.com/swagger.json file and convert to TypeScript models in single file mode
```

### Folder Mode

Generate one TypeScript file per model for better organization:

```
Download https://api.example.com/swagger.json file and convert to TypeScript models in folder mode
```

**Output Example (Folder Mode):**

```
src/types/
├── User.ts
├── UserStatus.ts
├── Order.ts
├── Product.ts
└── index.ts
```

Each file automatically imports its dependencies:

```typescript
// User.ts
import { UserStatus } from './UserStatus';

export interface User {
  id: number;
  email: string;
  status: UserStatus;
}
```

For detailed configuration options and advanced usage, see [skill documentation](./skills/generate-ts-models/SKILL.md).

### Output Mode Comparison

| Feature | Single File Mode | Folder Mode |
|---------|-----------------|-------------|
| File Structure | One `.ts` file | One `.ts` file per model |
| Imports | Not needed (all in one file) | Automatic type imports |
| Bundle Size | Larger (all code together) | Smaller (better tree-shaking) |
| Navigation | Search within file | One file per model (Ctrl+P friendly) |
| Best For | Small to medium APIs | Large APIs, better organization |
| Index File | Not applicable | Auto-generated `index.ts` with exports |

## Supported OpenAPI Features

| Feature | OpenAPI 2.0 | OpenAPI 3.x |
|----------|--------------|--------------|
| Basic Types | ✅ | ✅ |
| Enums | ✅ | ✅ |
| Arrays | ✅ | ✅ |
| Objects/Nested | ✅ | ✅ |
| Required/Optional Fields | ✅ | ✅ |
| Format Types | ✅ | ✅ |
| References ($ref) | ✅ | ✅ |
| Description Support | ✅ | ✅ |
| Type Imports (Folder Mode) | ✅ | ✅ |

## Contributing

We welcome contributions! To add a new skill:

1. Read the [AGENTS.md](./AGENTS.md) documentation for structure guidelines
2. Create a new skill directory in `skills/`
3. Add a `SKILL.md` file with proper frontmatter
4. Create executable scripts in the `scripts/` directory
5. Test thoroughly with various OpenAPI specifications
6. Submit a pull request

## Development

```bash
# Clone repository
git clone https://github.com/HaibaraaiAPTX/frontend-openapi-skills.git
cd frontend-openapi-skills

# Test a skill locally
bash skills/download-swagger-file/scripts/download.sh <url>

# Generate TypeScript models (single file mode)
bash skills/generate-ts-models/scripts/generate.sh <spec-file> ./api-models.ts

# Generate TypeScript models (folder mode)
bash skills/generate-ts-models/scripts/generate.sh <spec-file> ./src/types/

# Install skills to Claude Code for testing
cp -r skills/* ~/.claude/skills/
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

```
MIT License

Copyright (c) 2025 HaibaraaiAPTX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support

- 📖 [Documentation](./AGENTS.md)
- 🐛 [Issue Tracker](https://github.com/HaibaraaiAPTX/frontend-openapi-skills/issues)

## Acknowledgments

Built for the Claude Code ecosystem to make API integration faster and safer for frontend developers.

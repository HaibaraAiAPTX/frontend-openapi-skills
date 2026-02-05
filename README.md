# Frontend OpenAPI Skills

![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue?style=flat-square)
![OpenAPI](https://img.shields.io/badge/OpenAPI-2.0%20%7C%203.x-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

A collection of Claude Code skills for generating TypeScript models (interfaces/enums) from OpenAPI/Swagger specifications.

Automatically generate type-safe model code from your OpenAPI definitions — eliminating manual type definitions and reducing boilerplate.

## Features

- 🚀 **Automated TypeScript Generation** — Convert OpenAPI schemas to TypeScript interfaces and types
- 📥 **Remote Spec Download** — Fetch OpenAPI JSON specifications from any URL
- 🎯 **Type Safety** — Generate fully typed models
- ⚙️ **Configurable** — Customize type mappings, naming conventions, and output formats
- 📦 **Easy Integration** — Works seamlessly with Claude Code

## Available Skills

### [download-swagger-file](./skills/download-swagger-file)

Downloads OpenAPI/Swagger specification files from remote URLs.

### [generate-ts-models](./skills/generate-ts-models)

Generates TypeScript type declarations (interfaces, enums) from OpenAPI/Swagger specifications:

- One file per model with automatic type imports and an `index.ts` barrel file for easy navigation

### [materal-enum-adapter](./skills/materal-enum-adapter)

Detects Materal Framework enum endpoints, fetches real enum values from the API, and outputs JSON for AI-assisted enum translation.

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
| Type Imports | ✅ | ✅ |

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

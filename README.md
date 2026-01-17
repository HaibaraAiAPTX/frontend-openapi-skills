# Frontend OpenAPI Skills

A collection of Claude Code skills for generating TypeScript models and HTTP clients from OpenAPI/Swagger specifications.

Automatically generate type-safe API client code from your OpenAPI definitions — eliminating manual type definitions and reducing boilerplate.

## Features

- 🚀 **Automated TypeScript Generation** — Convert OpenAPI schemas to TypeScript interfaces and types
- 📥 **Remote Spec Download** — Fetch OpenAPI specifications from any URL
- 🎯 **Type Safety** — Generate fully typed models and API clients
- ⚙️ **Configurable** — Customize type mappings, naming conventions, and output formats
- 📦 **Easy Integration** — Works seamlessly with Claude Code

## Available Skills

### [download-swagger-file](./skills/download-swagger-file)

Downloads OpenAPI/Swagger specification files from remote URLs. Supports both JSON and YAML formats.

### [generate-ts-models](./skills/generate-ts-models)

Generates TypeScript type declarations (interfaces, types, enums) from OpenAPI/Swagger specifications.

## Installation
```bash
# Add this repository as a marketplace
/plugin marketplace add https://github.com/HaibaraAiAPTX/frontend-openapi-skills

# Install the plugin
/plugin install frontend-openapi-skills@frontend-openapi-skills
```

## Usage
```
Download https://petstore.swagger.io/v2/swagger.json file and convert to TypeScript models
```

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
bash skills/generate-ts-models/scripts/generate.sh <spec-file>

# Install skills to Claude Code for testing
cp -r skills/* ~/.claude/skills/
```

## License

[MIT License](./LICENSE) - See LICENSE file for details

## Support

- 📖 [Documentation](./AGENTS.md)
- 🐛 [Issue Tracker](https://github.com/HaibaraaiAPTX/frontend-openapi-skills/issues)

## Acknowledgments

Built for the Claude Code ecosystem to make API integration faster and safer for frontend developers.

# @tailoredtools/mcp-server

MCP server for [RapidTools](https://rapidtools.dev) — deterministic JSON Schema validation with signed attestations.

## What this does

Exposes three tools to any MCP-compatible client (Claude Code, Cursor, Cline, VS Code Copilot):

- **validate** — Validate a JSON payload against a JSON Schema. Returns a signed attestation.
- **verify** — Verify the cryptographic signature of a previous attestation.
- **get_attestation** — Retrieve a stored attestation by ID.

Every validation is deterministic (same inputs = same result), idempotent, and cryptographically signed.

## Setup

### Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "rapidtools": {
      "command": "npx",
      "args": ["-y", "@tailoredtools/mcp-server"],
      "env": {
        "RAPIDTOOLS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rapidtools": {
      "command": "npx",
      "args": ["-y", "@tailoredtools/mcp-server"],
      "env": {
        "RAPIDTOOLS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "rapidtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tailoredtools/mcp-server"],
      "env": {
        "RAPIDTOOLS_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Get an API key

Visit [billing.rapidtools.dev](https://billing.rapidtools.dev/billing/checkout) to subscribe and get an API key.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAPIDTOOLS_API_KEY` | Yes | Your RapidTools API key |
| `RAPIDTOOLS_API_URL` | No | Override API endpoint (default: `https://validate.rapidtools.dev`) |

## Tools

### validate

Validate data against a JSON Schema and get a signed attestation.

```
Input:
  schema      (object, required) — JSON Schema (Draft 2020-12 subset)
  payload     (any, required)    — Data to validate
  metadata    (object, optional) — Key-value pairs to attach
  idempotency_key (string, optional) — For deduplication

Output:
  attestation_id  — Unique attestation identifier
  valid           — true/false
  errors          — Array of validation errors (if any)
  schema_hash     — SHA-256 of the schema
  payload_hash    — SHA-256 of the payload
  signature       — HMAC-SHA256 cryptographic signature
  timestamp       — ISO 8601 timestamp
```

### verify

Verify that an attestation signature is valid and untampered.

```
Input (option A):
  attestation_id  — ID of a stored attestation

Input (option B):
  id, schema_hash, payload_hash, valid, created_at, signature — Full attestation record

Output:
  attestation_id    — The verified attestation ID
  signature_valid   — true/false
```

### get_attestation

Retrieve a stored attestation by ID.

```
Input:
  attestation_id  — The attestation ID to retrieve

Output:
  Full attestation record including signature and metadata
```

## Links

- [API Documentation](https://validate.rapidtools.dev/validate)
- [OpenAPI Spec](https://docs.rapidtools.dev/openapi.yaml)
- [Changelog](https://docs.rapidtools.dev/changelog)

## License

MIT

#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";

const API_BASE = process.env.RAPIDTOOLS_API_URL || "https://validate.rapidtools.dev";
const API_KEY = process.env.RAPIDTOOLS_API_KEY || "";

async function apiCall(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  const opts: RequestInit = {
    method,
    headers: {
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

const server = new McpServer({
  name: "rapidtools",
  version: "1.0.0",
});

// ─── Tool: validate ────────────────────────────────────────────
server.tool(
  "validate",
  "Validate a JSON payload against a JSON Schema. Returns a signed attestation proving validation occurred. Deterministic: same inputs always produce the same result.",
  {
    schema: z.record(z.unknown()).describe("JSON Schema object (Draft 2020-12 subset)"),
    payload: z.unknown().describe("The data to validate against the schema"),
    metadata: z
      .record(z.string())
      .optional()
      .describe("Optional key-value metadata to attach to the attestation"),
    idempotency_key: z
      .string()
      .optional()
      .describe("Optional idempotency key for deduplication"),
  },
  async ({ schema, payload, metadata, idempotency_key }) => {
    const headers: Record<string, string> = {};
    if (idempotency_key) headers["Idempotency-Key"] = idempotency_key;

    const { status, data } = await apiCall(
      "/v1/validate",
      "POST",
      { schema, payload, metadata },
      headers,
    );

    if (status >= 400) {
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ─── Tool: verify ──────────────────────────────────────────────
server.tool(
  "verify",
  "Verify the cryptographic signature of a validation attestation. Confirm that a previous validation result has not been tampered with.",
  {
    attestation_id: z
      .string()
      .optional()
      .describe("ID of a stored attestation to verify"),
    id: z.string().optional().describe("Attestation ID (for inline verification)"),
    schema_hash: z.string().optional().describe("Schema hash (for inline verification)"),
    payload_hash: z
      .string()
      .optional()
      .describe("Payload hash (for inline verification)"),
    valid: z.boolean().optional().describe("Validation result (for inline verification)"),
    errors: z
      .array(z.record(z.unknown()))
      .optional()
      .describe("Validation errors (for inline verification)"),
    created_at: z
      .string()
      .optional()
      .describe("Timestamp (for inline verification)"),
    signature: z
      .string()
      .optional()
      .describe("HMAC signature (for inline verification)"),
    service_version: z
      .string()
      .optional()
      .describe("Service version (for inline verification)"),
    metadata: z
      .record(z.string())
      .optional()
      .describe("Metadata (for inline verification)"),
  },
  async (args) => {
    const { status, data } = await apiCall("/v1/verify", "POST", args);

    if (status >= 400) {
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ─── Tool: get_attestation ─────────────────────────────────────
server.tool(
  "get_attestation",
  "Retrieve a stored validation attestation by its ID. Returns the full attestation record including schema hash, payload hash, validation result, and cryptographic signature.",
  {
    attestation_id: z.string().describe("The attestation ID to retrieve"),
  },
  async ({ attestation_id }) => {
    const { status, data } = await apiCall(
      `/v1/attestations/${encodeURIComponent(attestation_id)}`,
      "GET",
    );

    if (status >= 400) {
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ─── Smithery sandbox export ────────────────────────────────────
export function createSandboxServer() {
  return server;
}

// ─── Start ─────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/index.js") ||
    process.argv[1].endsWith("/index.cjs") ||
    process.argv[1].includes("rapidtools-mcp-server"));

if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}

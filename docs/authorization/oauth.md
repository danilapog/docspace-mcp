# OAuth

This document describes how the DocSpace MCP server implements OAuth
authorization with dynamic client registration proxying.

## Contents

- [Limitation](#limitation)
- [Authorization Flow](#authorization-flow)
- [References](#references)

## Limitation

The DocSpace authorization server does not support
[RFC 7591: Dynamic Client Registration Protocol]. To work around this
limitation, the DocSpace MCP server proxies dynamic client registration requests
and returns pre-configured OAuth client metadata instead of creating new
applications. As a result, all MCP clients are forced to use the same OAuth
application configured in the global configuration.

## Authorization Flow

The complete authorization flow with the proxying adaptation:

```mermaid
sequenceDiagram
	participant B as User-Agent (Browser)
	participant C as Client
	participant M as MCP Server (Resource Server)
	participant A as Authorization Server
	C->>M: MCP request without token
	M->>C: HTTP 401 Unauthorized with WWW-Authenticate header
	Note over C: Extract resource_metadata URL from the WWW-Authenticate header
	C->>M: Request protected resource metadata<br>GET /.well-known/oauth-protected-resource
	Note over M: Loads protected resource metadata from global configuration
	M->>C: Return protected resource metadata
	Note over C: Treats the resource server as an authorization server
	C->>M: Request authorization server metadata<br>GET /.well-known/oauth-authorization-server
	M->>A: Request authorization server metadata<br>GET /.well-known/oauth-authorization-server
	A->>M: Return authorization server metadata
	Note over M: Modifies the metadata by adding the register endpoint to itself
	M->>C: Return authorization server metadata
	C->>M: Request dynamic client registration<br>POST /register
	Note over M: Loads client  metadata from global configuration
	M->>C: Return client metadata
	Note over B,A: MCP authorization flow continues per protocol specification
```

## References

- [RFC 7591: Dynamic Client Registration Protocol]
- [MCP: Authorization]
- [DocSpace MCP: Global Configuration]
- [DocSpace MCP: Authentication Resolution]

<!-- Footnotes -->

[RFC 7591: Dynamic Client Registration Protocol]: https://www.rfc-editor.org/rfc/rfc7591
[MCP: Authorization]: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization/

[DocSpace MCP: Global Configuration]: ../configuration/global-configuration.md
[DocSpace MCP: Authentication Resolution]: ../configuration/authentication-resolution.md

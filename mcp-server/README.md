# Pennywise MCP Server — Phase 1

This is the first AI-layer component for Pennywise.

## Architecture

```text
MCP Client / Inspector
        |
        v
Pennywise MCP Server
        |
        | HTTP + user's JWT
        v
Pennywise Express API
        |
        v
MongoDB
```

The MCP server does **not** connect directly to MongoDB. It calls the existing Express API, so Pennywise's normal authentication and user-scoping remain in control.

## Current tools

- `get_transactions(from, to, category, type, limit)`
- `get_monthly_summary(month)`
- `get_spending_by_category(month)`
- `get_categories()`
- `get_budget_status(month)`

`month` uses `YYYY-MM` format.

`category` can be either a category ID or a category name.

## Setup

1. Make sure the Pennywise backend is running on port 5000.
2. Copy `.env.example` to `.env`.
3. Put a valid Pennywise JWT in `PENNYWISE_JWT` for the user you want to test.
4. Install dependencies:

```powershell
cd Q:\Pennywise\mcp-server
npm install
```

5. Start the MCP Inspector:

```powershell
npm run inspect
```

The official MCP TypeScript SDK documents the Inspector flow for local stdio servers.

## Important

For Phase 1, `PENNYWISE_JWT` is intentionally a local testing mechanism. In the later `/api/assistant` phase, the backend will create/use the MCP connection with the authenticated user's token rather than putting a JWT in the frontend.

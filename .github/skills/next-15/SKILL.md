---
name: next15-built-in-api
description: "Scaffold or upgrade Next.js 15 App Router features with built-in APIs and shadcn/ui best practices (Route Handlers, Server Actions, caching, middleware, accessible UI composition). Use when building full-stack flows without external backend frameworks."
argument-hint: "Describe the feature: domain, data model, auth rules, runtime (edge/node), response contract, and required UI components/screens."
user-invocable: true
---

# Next.js 15 + Built-in API Best Practices

## What This Skill Produces

- A Next.js 15 implementation plan and code shape for a feature using App Router + built-in APIs.
- Architecture decisions focused on Route Handlers and Server Actions.
- A shadcn/ui component plan for accessible and consistent UI implementation.
- Production-ready defaults for validation, caching, security headers, errors, and observability.

## Default Assumptions

- Runtime: Node.js runtime unless an endpoint explicitly requires Edge.
- Auth baseline: session cookie authentication for protected operations.
- Output style: full multi-step workflow (not a condensed checklist).

## When To Use

- Building or refactoring a feature in Next.js 15 App Router.
- Replacing ad-hoc backend code with built-in Route Handlers in `app/api/**/route.ts`.
- Adding Server Actions for mutations in forms and optimistic UI flows.
- Implementing product UI with shadcn/ui primitives and reusable feature wrappers.
- Standardizing cache/revalidation behavior and API error contracts.

## Inputs To Collect

1. Feature goal and user flow.
2. Data entities and read/write operations.
3. Auth requirements (public, session, role-gated).
4. Runtime constraints (Node.js runtime or Edge runtime).
5. Performance targets (TTFB, cache TTL, invalidation rules).
6. UI requirements (screens, required components, visual direction, form behaviors).

## Decision Framework

1. Choose transport:

- Use Server Actions for form-driven mutations from UI.
- Use Route Handlers for external clients, webhooks, integrations, or non-UI consumers.

2. Choose runtime:

- Node.js runtime for full library compatibility and DB drivers.
- Edge runtime for low-latency global reads and lightweight logic.

3. Choose caching:

- Static or ISR for stable content.
- `fetch(..., { cache: 'no-store' })` for per-request dynamic data.
- Tag-based invalidation with `revalidateTag` for write-after-read consistency.

4. Choose validation and contract:

- Validate all input on the server.
- Return explicit JSON shapes with stable `code` values for client handling.

## Implementation Procedure

1. Model the contract first.

- Define request/response types and error envelope.
- Decide success status codes (`200`, `201`, `204`) and failure codes (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`).

2. Create data access at server boundary.

- Keep DB and secrets server-only.
- Isolate data logic in reusable server modules.

3. Implement Route Handler if needed.

- Place handlers in `app/api/<resource>/route.ts`.
- Export method functions (`GET`, `POST`, `PATCH`, `DELETE`).
- Parse and validate input, enforce auth, execute domain logic, return typed JSON.

4. Implement Server Action for UI mutations.

- Use `'use server'` and validate server-side.
- Trigger revalidation (`revalidatePath` or `revalidateTag`) after successful writes.

5. Wire reads through Route Handlers and client-side data fetching.

- Keep response contracts stable so UI state handling stays predictable.
- Use consistent loading, empty, and error states in client UI.

6. Add security and resilience.

- Enforce auth and authorization in handlers/actions.
- Apply rate limiting for public endpoints.
- Avoid leaking stack traces; log internal errors with correlation IDs.

7. Add observability and tests.

- Log request ID, actor ID, latency, and status.
- Cover success/failure/auth/validation branches with tests.

## Built-in API Patterns

- Route Handlers:
  - Use `Request`/`Response` (or `NextRequest`/`NextResponse` only when needed).
  - Keep handlers thin: parse, validate, authorize, call service, map output.
- Caching:
  - Prefer explicit cache behavior over defaults.
  - Use cache tags for precise invalidation.
- Middleware:
  - Keep lightweight; avoid heavy DB queries and large dependencies.

## UI Patterns with shadcn/ui

- Setup and structure:
  - Initialize shadcn/ui once and keep generated primitives in `components/ui`.
  - Create feature-level wrappers near routes (for example, `app/(dashboard)/_components`).
- Component strategy:
  - Add only needed components to keep bundles and maintenance lean.
  - Prefer composition of primitives over one-off custom controls.
- Accessibility:
  - Preserve keyboard navigation and focus visibility.
  - Pair each form control with labels, helper text, and explicit error messages.
- Styling:
  - Prefer token-based styling and consistent variant patterns.
  - Keep class composition centralized for reusable variants.
- Performance:
  - Use Client Components for interactivity.
  - Lazy-load heavy interactive sections where it helps initial render.

## Quality Gates (Definition of Done)

- Every mutation path validates input server-side.
- AuthZ checks exist for non-public data.
- API response contract is consistent and documented.
- Cache and invalidation strategy is explicitly defined.
- Error responses use stable machine-readable `code` values.
- At least one test per critical branch (happy path + validation/auth failure).
- shadcn/ui components are responsive, keyboard accessible, and consistently themed.
- No secrets exposed to client bundles.

## Output Format

When invoked, return:

1. Architecture choice summary (Server Action vs Route Handler).
2. File-by-file implementation plan.
3. API contract table (method, path, input, output, errors).
4. Cache/invalidation plan.
5. UI component and styling plan (shadcn/ui).
6. Test checklist.

## Example Prompts

- `/next15-built-in-api Build a product review flow with create/update/delete, session auth, and tag-based revalidation.`
- `/next15-built-in-api Design webhook ingestion endpoint with signature verification and idempotency handling.`
- `/next15-built-in-api Refactor legacy pages/api endpoints to App Router route handlers with consistent error contracts.`
- `/next15-built-in-api Build an account settings flow with shadcn/ui forms, dialog confirmations, and Server Action mutations.`

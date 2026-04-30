---
description: "Use when writing or suggesting git commit messages. Enforces Conventional Commits format with correct type, optional scope, and imperative subject line."
---

# Conventional Commits

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Types

| Type       | Use for                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `chore`    | Maintenance, dependencies, tooling       |
| `refactor` | Code change that is not a fix or feature |
| `style`    | Formatting, whitespace — no logic change |
| `test`     | Adding or updating tests                 |
| `docs`     | Documentation only                       |
| `perf`     | Performance improvement                  |
| `ci`       | CI/CD configuration changes              |
| `revert`   | Reverts a previous commit                |

## Rules

- Subject line must be **lowercase** and **imperative mood** (e.g. `add`, `fix`, `remove` — not `added`, `fixes`, `removed`).
- Subject must **not** end with a period.
- Keep subject under **72 characters**.
- Use body to explain _why_, not _what_, when the change needs context.
- Breaking changes must include `!` after type/scope and/or a `BREAKING CHANGE:` footer.

## Examples

```
feat(auth): add session cookie refresh on expiry

fix(api): return 422 instead of 500 for invalid input

chore: upgrade next to 15.3.1

refactor(ui): extract dialog trigger into reusable component

feat!: replace REST endpoints with Server Actions

BREAKING CHANGE: /api/submit endpoint removed; use submitAction() instead
```

## Anti-patterns to Avoid

- `updated stuff` — no type, vague subject
- `Fix bug` — capitalised, no scope, past tense
- `feat: Added new button.` — past tense, ends with period
- `WIP` — not a valid commit message for a real commit

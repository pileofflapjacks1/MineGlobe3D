# Security & privacy notes

## What is (and is not) in this repository

This project is intended for **public** use. The git history should not contain:

- API keys (xAI, OpenAI, or others)
- Passwords or tokens
- Personal contact information beyond the public GitHub repo URL
- Machine-specific home directory paths

## Secrets handling in the app

| Secret | Storage | Never committed? |
|--------|---------|------------------|
| LLM API key (Grok / OpenAI / custom) | Browser `localStorage` only (`mineglobe-llm-settings`) | Yes |
| Stock / EDGAR data | Public APIs via local server | N/A (no secrets) |
| Server `.venv` | Local only | Yes (gitignored) |
| `.env` files | Not used by default | Yes (gitignored) |

LLM keys are sent from the browser **only** to the local MineGlobe proxy (`/api/llm/chat`), which forwards them to the provider you configure. Keys are **not** stored on the server disk.

## If you fork or deploy

1. Do **not** put API keys in source, README, or commit messages.
2. For production, prefer server-side env vars (e.g. `XAI_API_KEY`) instead of browser `localStorage`.
3. Rotate any key that was ever pasted into a public issue, screenshot, or commit.

## Reporting issues

Open a GitHub issue on this repository. Do not include live API keys in reports.

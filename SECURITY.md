# Security Policy 🔐

## Reporting a Vulnerability
Please report security issues privately to: **bulwarkx@proton.me**

Include:
- affected component/path
- steps to reproduce
- impact assessment
- any suggested fix

## Public Repo Safety
- This repository must **not** contain secrets (private keys, mnemonics, API tokens).
- Use example env templates (e.g., `env.example`) for configuration scaffolding.
- Real environment values must live in secret managers / CI secrets / local untracked `.env`.

## Scope Notes
BulwarkX is currently a **testnet-first MVP**. Contracts and services are not production hardened yet.

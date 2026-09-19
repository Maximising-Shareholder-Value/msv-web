# Project Governance

Everything about *why* $MSV is built the way it is, *where it's headed*,
and *what happened to get here* — separate from the code-level `CLAUDE.md`
at the repo root, which documents *how the code works*. Start here if
you're new to the project.

| Doc | What's in it |
|---|---|
| [ROADMAP.md](ROADMAP.md) | The long-term vision, an architecture diagram (current + planned), and the prioritized order of what gets built next and why. |
| [TODO.md](TODO.md) | The concrete, checkable task list — what to actually do, derived from the roadmap. |
| [HISTORY.md](HISTORY.md) | A chronological record of the project from its first commit onward, including the phase before it was even called $MSV-web (the original combined repo). |
| [API_RESEARCH.md](API_RESEARCH.md) | Researched finance/macro data APIs — free tiers, rate limits, CORS support — for extending the app to new asset classes and countries. |
| [`workflows/ci.yml`](workflows/ci.yml) | The CI checks that run on every PR (syntax check + smoke test). |

For the repo root's `CLAUDE.md` (technical reference: data source
quirks, per-feature implementation notes, config/secrets setup), see
[../CLAUDE.md](../CLAUDE.md). For the backend, see
[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api) and
its own `CLAUDE.md`.

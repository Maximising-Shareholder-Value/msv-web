# Project Governance

This folder is the "office filing cabinet" for the $MSV project — separate
from the actual app code. If you want to understand *why* $MSV looks and
works the way it does, *where it's headed next*, or *what's already
happened*, this is where to look, instead of having to dig through old
chat logs or ask someone who was there.

Think of it as four different questions, each with its own file:

| Question | File | In plain terms |
|---|---|---|
| **"Where is this project going, long-term?"** | [ROADMAP.md](ROADMAP.md) | The big-picture vision for $MSV, a diagram of how the pieces fit together, and the order features are planned to get built in — and why that order, not a different one. |
| **"What should I (or a contributor) actually work on next?"** | [TODO.md](TODO.md) | A checklist, broken into small, doable steps pulled straight out of the roadmap. Things get checked off here as they're finished. |
| **"What's already happened on this project?"** | [HISTORY.md](HISTORY.md) | A dated, chronological story of the project from its very first commit — every major decision, redesign, and feature, in the order it actually happened. Good for catching up if you've been away, or for a new person joining. |
| **"What free data sources exist for feature X?"** | [API_RESEARCH.md](API_RESEARCH.md) | Notes from researching outside APIs (stock data, macro data, etc.) — what's free, what the limits are, and whether it's actually confirmed to work (not just guessed). |
| **"What changed recently, in the app itself?"** | [`../changelog.js`](../changelog.js) and the in-app "What's New" popup (🔔 in the header) | A short, plain-English list of recent additions/fixes, written for people *using* $MSV rather than developers — the same list shown inside the app itself, which pops up automatically the first time you visit after something new ships. |
| **"What runs automatically when code changes?"** | [`workflows/ci.yml`](workflows/ci.yml) | The automated checks (syntax check + a smoke test) that run on every proposed change before it's allowed to merge. |

For the nitty-gritty technical details — exactly how a specific piece of
code works, which quirks a data source has, how to set up config/secrets
— see the repo root's [`../CLAUDE.md`](../CLAUDE.md) instead. That file
is the technical reference; this folder is the "why and what" reference.
The backend has its own equivalent set of docs in the
[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api) repo.

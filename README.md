# AI Developer Onboarding Copilot

An MVP web app for helping new engineers, technical PMs, and QA understand a repository with AI-style repository summaries, codebase Q&A, impact analysis, an agentic impact workflow, onboarding plans, citations, feedback, and evaluation metrics.

## Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

## LLM Setup (Optional but recommended)

Set the following environment variables to enable AI-powered answers:

```bash
# Using DeepSeek (recommended — cheap, OpenAI-compatible, great Chinese support)
export OPENAI_API_KEY=sk-your-deepseek-key
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_MODEL=deepseek-chat

# Or any other OpenAI-compatible provider:
# export OPENAI_API_KEY=sk-your-openai-key
# export OPENAI_BASE_URL=https://api.openai.com
# export OPENAI_MODEL=gpt-4o-mini
```

Verify the connection:

```bash
curl http://localhost:3000/api/health
```

The response shows whether the LLM is configured and which provider/model is active.

Without an API key, the app falls back to a deterministic retrieval-based answer generator — the demo still works, but answers will be template-based rather than AI-generated. The UI shows "AI-enhanced mode" or "Offline retrieval mode" so it's always clear which mode is active.

## Notes

- No install step is required; the MVP uses only Node.js standard library APIs.
- GitHub imports use public repository ZIP downloads.
- ZIP uploads are parsed locally by the server.
- Runtime data is stored in `data/store.json`.

## Current MVP Features

- Repository import from public GitHub URL, ZIP upload, or built-in sample repository.
- Project overview with inferred stack, directory tree, core modules, README summary, and recommended first reads.
- Repository Q&A with related files, uncertainty, suggested next questions, and feedback buttons.
- Impact analysis with impacted modules, risk level, testing suggestions, and open questions.
- Agent Workflow tab that demonstrates a single-agent tool loop: classify change, retrieve evidence, expand dependency context, estimate risk, validate citations, and compose structured output.
- Evaluation dashboard with total questions, agent runs, helpful rate, citation coverage, uncertainty rate, negative feedback, high-risk questions, and recent feedback.

See [docs/PRD.md](docs/PRD.md) for the product requirements and roadmap.

# MOD.md — Agent-facing behavioral contract

## What this mod does

Registers the Umans Code gateway as a local Letta Code provider using its OpenAI-compatible API endpoint. The provider appears in `/connect` and `/model` for local agents.

## Provider details

- **Provider ID:** `umans`
- **API:** `openai-completions` (OpenAI-compatible)
- **Base URL:** `https://api.code.umans.ai/v1`
- **Auth:** `UMANS_API_KEY` env var, or `/connect umans` to save a key locally
- **Pricing:** Subscription-based (no per-token cost; all model costs set to 0)
- **Model discovery:** Dynamic from `/models/info` (public endpoint), with a static fallback catalog

## Why OpenAI-compatible instead of Anthropic

Using the OpenAI-compatible endpoint so the same `/connect` API key works for both the provider and the `@letta-ai/image-understanding` mod (which speaks OpenAI-compatible). This simplifies setup: connect once, then just set `IMAGE_UNDERSTANDING_MODEL=umans-kimi-k2.7` for vision handoff.

## Models

Models are fetched live from the Umans gateway. The static fallback catalog includes:

- `umans-coder` — 262K context, native vision, reasoning always on
- `umans-kimi-k2.6` — 262K context, native vision, reasoning (can disable)
- `umans-kimi-k2.7` — 262K context, native vision, reasoning always on
- `umans-glm-5.1` — 202K context, vision via handoff, reasoning (can disable)
- `umans-glm-5.2` — 405K context, vision via handoff, reasoning (can disable)
- `umans-flash` — 262K context, native vision, reasoning (can disable)
- `umans-qwen3.6-35b-a3b` — 262K context, native vision, reasoning (can disable)

Model handles are `umans/<model-id>`, e.g. `umans/umans-glm-5.2`.

## Vision

GLM 5.1 and GLM 5.2 declare `input: ["text"]` because they require a vision handoff. Native-vision models (Kimi, Coder, Flash, Qwen) declare `input: ["text", "image"]`.

For GLM vision support, install the `@letta-ai/image-understanding` mod and configure it to use a native-vision Umans model as the vision backend. See README.md for setup instructions.

## Constraints

- Provider mod is local-agent only. Does not work with Constellation/cloud agents.
- The gateway rejects `max_tokens >= max_completion_tokens` with a 400. The mod calculates `maxTokens` as `min(recommended, cap - 1)` to avoid this.
- `listModels` fetches from `/models/info` with a 5-second timeout. On any error, the static fallback catalog is used.
- The model info endpoint is public (no auth needed), so dynamic discovery works even before the user connects.

## Adaptation notes

- If Umans adds new models, they appear automatically after `/reload` via dynamic discovery — no mod update needed.
- If new models have vision support `"via-handoff"`, they will be declared as text-only (`input: ["text"]`). The user needs the image-understanding mod for vision.
- The static catalog should be updated when new models are confirmed stable, but dynamic discovery handles the gap.

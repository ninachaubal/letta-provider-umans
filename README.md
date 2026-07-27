# letta-provider-umans

[![npm version](https://img.shields.io/npm/v/letta-provider-umans)](https://www.npmjs.com/package/letta-provider-umans)
[![npm downloads](https://img.shields.io/npm/dw/letta-provider-umans)](https://www.npmjs.com/package/letta-provider-umans)
[![GitHub stars](https://img.shields.io/github/stars/ninachaubal/letta-provider-umans)](https://github.com/ninachaubal/letta-provider-umans)
[![License](https://img.shields.io/npm/l/letta-provider-umans)](https://github.com/ninachaubal/letta-provider-umans/blob/main/LICENSE)

[Umans.ai](https://umans.ai) provider for [Letta Code](https://docs.letta.com/letta-code). Adds subscription-based access to coding-optimized models including Kimi K2.7, GLM 5.2, and more.

## Install

Ask your Letta Code agent to install this mod:

> Install the Umans provider mod from `npm:letta-provider-umans`

If you plan to use GLM 5.1 or GLM 5.2, ask your agent to also install the image-understanding mod for vision handoff:

> Install the Umans provider mod from `npm:letta-provider-umans` and also install the `npm:@letta-ai/image-understanding` mod for vision handoff

Or install manually:

```bash
letta install npm:letta-provider-umans
```

Then reload:

```
/reload
```

## Connect

Get an API key from [app.umans.ai/billing](https://app.umans.ai/billing) → Dashboard → API Keys, then either:

```
/connect umans
```

Or set an environment variable:

```bash
export UMANS_API_KEY="uk-your-key-here"
```

## Models

Discovered live from the Umans gateway. New models appear automatically after `/reload` — no mod update needed.

| Model | Context | Vision | Reasoning |
| --- | --- | --- | --- |
| `umans-coder` | 262K | native | yes (always on) |
| `umans-kimi-k2.6` | 262K | native | yes (can disable) |
| `umans-kimi-k2.7` | 262K | native | yes (always on) |
| `umans-glm-5.1` | 202K | via handoff | yes (can disable) |
| `umans-glm-5.2` | 405K | via handoff | yes (can disable) |
| `umans-flash` | 262K | native | yes (can disable) |
| `umans-qwen3.6-35b-a3b` | 262K | native | yes (can disable) |

Select with `/model umans/umans-glm-5.2`.

## Vision handoff for GLM models

GLM 5.1 and GLM 5.2 don't have native vision. Install the image-understanding mod to bridge images to text:

```bash
letta install npm:@letta-ai/image-understanding
```

The provider uses the OpenAI-compatible endpoint, so the same API key from `/connect umans` works. Point the image-understanding mod at Umans and pick a native-vision model:

```bash
export IMAGE_UNDERSTANDING_PROVIDER=openai-compatible
export IMAGE_UNDERSTANDING_API_KEY="$UMANS_API_KEY"
export IMAGE_UNDERSTANDING_BASE_URL=https://api.code.umans.ai/v1
export IMAGE_UNDERSTANDING_MODEL=umans-kimi-k2.7
```

To use a different vision model, e.g. `umans-flash`:

```bash
export IMAGE_UNDERSTANDING_MODEL=umans-flash
```

Enable auto-captioning so images are described before the GLM model sees them:

```bash
export IMAGE_UNDERSTANDING_AUTO_CAPTION=1
export IMAGE_UNDERSTANDING_AUTO_MODE=describe
```

Reload and verify:

```
/reload
/image-understanding-status
```

## Changelog

### v0.2.0

- **Fix:** Use `recommended_max_tokens` as the output budget instead of `max_completion_tokens - 1`. The previous approach requested nearly the entire context window as output (e.g., 262,143 for Kimi models), so any non-trivial prompt made prompt + maxTokens exceed the context window — causing `max_tokens_exceeded` errors. Now uses `min(recommended_max_tokens, max_completion_tokens - 1)`, matching the official `umans-ai/pi-provider-umans` integration. For Kimi models this yields 32,768 output tokens.
- **Test:** Added regression tests for `safeMaxTokens` covering recommended, cap, fallback, and edge cases.

### v0.1.5

- **Fix:** Enable `supportsUsageInStreaming` so Letta receives token counts from streaming responses. Without usage data, Letta fell back to a char/4 heuristic that underestimates context size for non-GPT tokenizers (Kimi, GLM), preventing proactive compaction from triggering. Long conversations would hit the context window limit with no recovery.

### v0.1.4

- **Fix:** Add required MOD.md frontmatter (name, description) for mod package format.

### v0.1.3

- **Fix:** Use `max_completion_tokens - 1` for `maxTokens` instead of `recommended_max_tokens`, which wasn't always available from the gateway. *(Reverted in v0.2.0 — caused `max_tokens_exceeded` errors when prompt + output budget exceeded context window.)*

### v0.1.2

- **Fix:** Add `UMANS_COMPAT` settings to prevent unsupported OpenAI parameters (`store`, `developer` role, `strict` mode) from being sent to the Umans gateway, which caused 400 errors.

### v0.1.1

- Version bump only (no code changes).

### v0.1.0

- Initial release. Registers the Umans Code gateway as a Letta Code provider using the OpenAI-compatible API endpoint. Dynamic model discovery from the gateway with static fallback catalog. `/connect umans` support with local API key storage.

## License

MIT

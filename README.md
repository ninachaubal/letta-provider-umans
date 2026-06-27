# letta-provider-umans

[Umans.ai](https://umans.ai) provider for [Letta Code](https://docs.letta.com/letta-code) — subscription-based access to coding-optimized models including Kimi K2.7, GLM 5.2, and more.

## Install

Ask your Letta Code agent to install this mod:

> Install the Umans provider mod from `https://github.com/ninachaubal/letta-provider-umans`

If you plan to use GLM 5.1 or GLM 5.2, ask your agent to also install the image-understanding mod for vision handoff:

> Install the Umans provider mod from `https://github.com/ninachaubal/letta-provider-umans` and also install the `@letta-ai/image-understanding` mod for vision handoff

Or install manually:

```bash
cp mods/index.ts ~/.letta/mods/umans-provider.ts
```

Then reload:

```
/reload
```

## Setup

### Option 1: `/connect` (recommended)

Run `/connect umans` in Letta Code, paste your API key when prompted. The key is stored locally — no env vars needed.

### Option 2: Environment variable

```bash
export UMANS_API_KEY="uk-your-key-here"
```

### Getting an API key

1. Log in to [app.umans.ai/billing](https://app.umans.ai/billing)
2. Go to Dashboard → API Keys
3. Generate a new key (shown only once — copy it immediately)

## Available models

Models are discovered live from the Umans gateway at load time. New models appear automatically — no mod update needed. If the gateway is unreachable, a static fallback catalog is used.

| Model | Context | Vision | Reasoning |
| --- | --- | --- | --- |
| `umans-coder` | 262K | native | yes (always on) |
| `umans-kimi-k2.6` | 262K | native | yes (can disable) |
| `umans-kimi-k2.7` | 262K | native | yes (always on) |
| `umans-glm-5.1` | 202K | via handoff | yes (can disable) |
| `umans-glm-5.2` | 405K | via handoff | yes (can disable) |
| `umans-flash` | 262K | native | yes (can disable) |
| `umans-qwen3.6-35b-a3b` | 262K | native | yes (can disable) |

Select a model with `/model umans/umans-glm-5.2`.

## Vision handoff for GLM 5.1 / GLM 5.2

GLM 5.1 and GLM 5.2 are the most popular models on Umans, but they don't have native vision — they need a vision handoff. Install the official image-understanding mod:

```bash
letta install npm:@letta-ai/image-understanding
```

Since the provider uses the OpenAI-compatible endpoint, the same API key from `/connect umans` works. You just need to point the image-understanding mod at Umans and pick a native-vision model for the handoff:

```bash
export IMAGE_UNDERSTANDING_PROVIDER=openai-compatible
export IMAGE_UNDERSTANDING_API_KEY="$UMANS_API_KEY"
export IMAGE_UNDERSTANDING_MODEL=umans-kimi-k2.7
export IMAGE_UNDERSTANDING_BASE_URL=https://api.code.umans.ai/v1
```

For example, to use `umans-flash` as the vision model instead:

```bash
export IMAGE_UNDERSTANDING_MODEL=umans-flash
```

Enable auto-captioning so images are automatically described before the GLM model sees them:

```bash
export IMAGE_UNDERSTANDING_AUTO_CAPTION=1
export IMAGE_UNDERSTANDING_AUTO_MODE=describe
```

Reload and verify:

```
/reload
/image-understanding-status
```

Now when you send an image to a GLM model, the image-understanding mod will analyze it with the configured vision model (e.g. `umans-kimi-k2.7`) and replace it with a text description the GLM model can reason over.

## API endpoint

This mod uses the OpenAI-compatible endpoint at `https://api.code.umans.ai/v1`. Umans also provides an Anthropic Messages API at `https://api.code.umans.ai` — both work with the same API key.

## Safety

Mods are trusted local code. If a mod breaks startup or command handling, recover with:

```bash
letta --no-mods
# or
LETTA_DISABLE_MODS=1 letta
```

## License

MIT

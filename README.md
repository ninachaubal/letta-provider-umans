# letta-provider-umans

[Umans.ai](https://umans.ai) provider for [Letta Code](https://docs.letta.com/letta-code). Adds subscription-based access to coding-optimized models including Kimi K2.7, GLM 5.2, and more.

## Install

Ask your Letta Code agent to install this mod:

> Install the Umans provider mod from `https://github.com/ninachaubal/letta-provider-umans`

If you plan to use GLM 5.1 or GLM 5.2, ask your agent to also install the image-understanding mod for vision handoff:

> Install the Umans provider mod from `https://github.com/ninachaubal/letta-provider-umans` and also install the `npm:@letta-ai/image-understanding` mod for vision handoff

Or install manually:

```bash
letta install https://github.com/ninachaubal/letta-provider-umans
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

## License

MIT

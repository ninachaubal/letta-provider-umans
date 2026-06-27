// Umans provider mod for Letta Code
//
// Registers the Umans Code gateway (https://api.code.umans.ai/v1) as a local
// provider using its OpenAI-compatible API endpoint. Subscription-based —
// no per-token cost.
//
// Auth: UMANS_API_KEY env var, or /connect umans to save a key locally.
// Models: discovered live from /models/info (public, no auth needed),
// with a static fallback catalog.
//
// Using the OpenAI-compatible endpoint so the same /connect API key works
// for both the provider and the @letta-ai/image-understanding mod (which
// speaks OpenAI-compatible). This simplifies setup: connect once, then just
// set IMAGE_UNDERSTANDING_MODEL=umans-kimi-k2.7 for vision handoff.

const DEFAULT_BASE_URL = "https://api.code.umans.ai/v1";
const API_KEY_ENV = "UMANS_API_KEY";

type ReasoningInfo = {
  supported: boolean;
  can_disable: boolean;
  levels: string[];
  default_level: string;
};

type ModelCapabilities = {
  max_completion_tokens?: number;
  recommended_max_tokens?: number;
  context_window?: number;
  supports_vision?: boolean | "via-handoff";
  supports_tools?: boolean;
  reasoning?: ReasoningInfo;
};

type UmansModelInfo = {
  name: string;
  display_name?: string;
  description?: string;
  deprecation?: unknown;
  capabilities: ModelCapabilities;
};

// Static fallback when /models/info cannot be reached.
// Keep in sync with https://api.code.umans.ai/v1/models
const STATIC_CATALOG: Record<string, UmansModelInfo> = {
  "umans-kimi-k2.6": {
    name: "umans-kimi-k2.6",
    display_name: "Umans Kimi K2.6",
    capabilities: {
      max_completion_tokens: 262144,
      recommended_max_tokens: 32768,
      context_window: 262144,
      supports_vision: true,
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: true,
        levels: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-kimi-k2.7": {
    name: "umans-kimi-k2.7",
    display_name: "Umans Kimi K2.7 Code",
    capabilities: {
      max_completion_tokens: 262144,
      recommended_max_tokens: 32768,
      context_window: 262144,
      supports_vision: true,
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: false,
        levels: ["minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-glm-5.1": {
    name: "umans-glm-5.1",
    display_name: "Umans GLM 5.1",
    capabilities: {
      max_completion_tokens: 131072,
      recommended_max_tokens: 131071,
      context_window: 202752,
      supports_vision: "via-handoff",
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: true,
        levels: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-glm-5.2": {
    name: "umans-glm-5.2",
    display_name: "Umans GLM 5.2",
    capabilities: {
      max_completion_tokens: 131072,
      recommended_max_tokens: 131071,
      context_window: 405504,
      supports_vision: "via-handoff",
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: true,
        levels: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-coder": {
    name: "umans-coder",
    display_name: "Umans Coder",
    capabilities: {
      max_completion_tokens: 262144,
      recommended_max_tokens: 32768,
      context_window: 262144,
      supports_vision: true,
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: false,
        levels: ["minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-flash": {
    name: "umans-flash",
    display_name: "Umans Flash",
    capabilities: {
      max_completion_tokens: 262144,
      recommended_max_tokens: 32768,
      context_window: 262144,
      supports_vision: true,
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: true,
        levels: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
  "umans-qwen3.6-35b-a3b": {
    name: "umans-qwen3.6-35b-a3b",
    display_name: "Umans Qwen3.6 35B A3B",
    capabilities: {
      max_completion_tokens: 262144,
      recommended_max_tokens: 32768,
      context_window: 262144,
      supports_vision: true,
      supports_tools: true,
      reasoning: {
        supported: true,
        can_disable: true,
        levels: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
        default_level: "medium",
      },
    },
  },
};

/**
 * Resolve an output budget that never hits the gateway's hard cap.
 * The gateway rejects max_tokens >= max_completion_tokens with a 400.
 */
function safeMaxTokens(recommended?: number, cap?: number): number {
  const fallback = 32768;
  let value =
    typeof recommended === "number" && recommended > 0 ? recommended : fallback;
  if (typeof cap === "number" && cap > 0) {
    value = Math.min(value, cap - 1);
  }
  return Math.max(value, 1);
}

function toInputModalities(info: UmansModelInfo): ("text" | "image")[] {
  const v = info.capabilities?.supports_vision;
  return v === true ? ["text", "image"] : ["text"];
}

/**
 * Fetch live model catalog from /models/info (public, no auth needed).
 * Falls back to undefined on any error so the caller can use STATIC_CATALOG.
 */
async function fetchModelCatalog(
  baseUrl: string,
): Promise<Record<string, UmansModelInfo> | undefined> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${baseUrl}/models/info`, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    // Expect a flat object keyed by model id.
    if (
      !data ||
      Array.isArray(data) ||
      !Object.values(data).every(
        (m: unknown) =>
          !!m &&
          typeof m === "object" &&
          typeof (m as UmansModelInfo).capabilities === "object",
      )
    ) {
      return undefined;
    }
    return Object.keys(data).length > 0
      ? (data as Record<string, UmansModelInfo>)
      : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** Map Umans model info to Letta model format. */
function toLettaModel(id: string, info: UmansModelInfo) {
  const capabilities = info.capabilities ?? {};
  return {
    id,
    name: info.display_name || info.name || id,
    reasoning: capabilities.reasoning?.supported ?? false,
    input: toInputModalities(info),
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: capabilities.context_window || 262144,
    maxTokens: safeMaxTokens(
      capabilities.recommended_max_tokens,
      capabilities.max_completion_tokens,
    ),
  };
}

/** Build the static model list from STATIC_CATALOG. */
function buildStaticModels() {
  return Object.entries(STATIC_CATALOG)
    .filter(([, info]) => !info.deprecation)
    .map(([id, info]) => toLettaModel(id, info));
}

export default function activate(letta: any) {
  if (!letta.capabilities.providers) {
    letta.diagnostics?.report?.({
      severity: "warning",
      message:
        "umans provider mod requires providers capability, but this host does not expose it.",
    });
    return;
  }

  const staticModels = buildStaticModels();

  return letta.providers.register("umans", {
    name: "Umans",
    description: "Connect a Umans API key",
    api: "openai-completions",
    baseUrl: DEFAULT_BASE_URL,
    apiKey: API_KEY_ENV,
    authHeader: true,
    models: staticModels,
    async listModels(connection: {
      id: string;
      providerName: string;
      baseUrl?: string;
      apiKey?: string;
      headers?: Record<string, string>;
    }) {
      const base = connection.baseUrl?.replace(/\/$/, "") || DEFAULT_BASE_URL;
      const catalog = await fetchModelCatalog(base);
      if (!catalog) return staticModels;
      return Object.entries(catalog)
        .filter(([, info]) => !info.deprecation)
        .map(([id, info]) => toLettaModel(id, info));
    },
    connect: {
      fields: [{ key: "apiKey", label: "Umans API Key", secret: true }],
    },
  });
}

/**
 * Multi-provider LLM & ElevenLabs / OpenAI TTS voice engine helper for 3D VTuber Studio.
 */

export interface VtuberLlmConfig {
  provider: "openai" | "openrouter" | "groq" | "anthropic" | "deepseek";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface VtuberTtsConfig {
  provider: "webspeech" | "elevenlabs" | "openai";
  apiKey?: string;
  voiceId?: string;
}

export async function generateVtuberLlmReply(
  userMessage: string,
  config: VtuberLlmConfig
): Promise<string> {
  const { provider, apiKey, model, baseUrl, temperature, systemPrompt } = config;

  const defaultPrompt =
    systemPrompt || "You are an energetic, fun 3D AI VTuber streaming live on Solana and pump.fun! Keep replies under 25 words.";

  if (!apiKey) {
    return "No LLM key in the studio panel. Paste an OpenAI, OpenRouter, or Groq key, then send again.";
  }

  try {
    const roots: Record<string, string> = {
      openai: "https://api.openai.com/v1",
      openrouter: "https://openrouter.ai/api/v1",
      groq: "https://api.groq.com/openai/v1",
      deepseek: "https://api.deepseek.com/v1",
      anthropic: "https://api.anthropic.com/v1",
    };
    const root = (baseUrl || roots[provider] || roots.openai).replace(/\/$/, "");
    const endpoint = root.endsWith("/chat/completions") ? root : `${root}/chat/completions`;
    const targetModel = model || "gpt-4o-mini";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: "system", content: defaultPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 100,
        temperature: typeof temperature === "number" ? temperature : 1,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content.trim();
    }
  } catch (err) {
    console.warn("[vtuber-llm] API call error, falling back:", err);
  }

  return "The LLM call failed. Check the provider, model, and key.";
}

export async function generateElevenLabsTtsAudio(
  text: string,
  apiKey: string,
  voiceId = "21m00Tcm4TlvDq8ikWAM" // Default Rachel voice
): Promise<ArrayBuffer | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch (err) {
    console.warn("[elevenlabs-tts] TTS fetch failed:", err);
  }
  return null;
}

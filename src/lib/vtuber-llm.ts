/**
 * Multi-provider LLM & ElevenLabs / OpenAI TTS voice engine helper for 3D VTuber Studio.
 */

export interface VtuberLlmConfig {
  provider: "openai" | "openrouter" | "groq" | "anthropic" | "deepseek";
  apiKey?: string;
  model?: string;
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
  const { provider, apiKey, model, systemPrompt } = config;

  const defaultPrompt =
    systemPrompt || "You are an energetic, fun 3D AI VTuber streaming live on Solana and pump.fun! Keep replies under 25 words.";

  if (!apiKey) {
    return `[VTuber Agent]: ${userMessage} — We are live on Solana & pump.fun!`;
  }

  try {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let targetModel = model || "gpt-4o-mini";

    if (provider === "openrouter") {
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      targetModel = model || "openai/gpt-4o-mini";
    } else if (provider === "groq") {
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      targetModel = model || "llama-3.3-70b-versatile";
    } else if (provider === "deepseek") {
      endpoint = "https://api.deepseek.com/v1/chat/completions";
      targetModel = model || "deepseek-chat";
    }

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
        temperature: 0.7,
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

  return `[${config.provider.toUpperCase()} Agent]: Welcome to our live Solana stream! ${userMessage}`;
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import { VrmStudio } from "@/components/vrm/VrmStudio";
import { AppShell } from "@/components/hud/AppShell";
import {
  Video,
  Eye,
  EyeOff,
  Smile,
  Palette,
  Globe,
  Radio,
  Send,
  MessageSquare,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Bot,
  Key,
  Cpu,
  Save,
  CheckCircle2,
} from "lucide-react";
import { getToken } from "@/lib/client-auth";
import { generateVtuberLlmReply, generateElevenLabsTtsAudio } from "@/lib/vtuber-llm";

type StudioAgent = {
  id: string;
  name: string;
  persona?: string | null;
  avatarGlbUrl?: string | null;
  avatarUrl?: string | null;
  tokenMint?: string | null;
};

function modelUrl(agent: StudioAgent): string | null {
  const url = (agent.avatarGlbUrl || agent.avatarUrl || "").trim();
  if (/\.(vrm|glb|gltf)(\?|#|$)/i.test(url)) return url;
  return null;
}

export default function VrmStudioPage() {
  const [vrmUrl, setVrmUrl] = useState("/vrm/seed-san.vrm");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [chromaBg, setChromaBg] = useState(false);
  const [hideDock, setHideDock] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expression, setExpression] = useState("neutral");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [agentName, setAgentName] = useState("Studio");

  // Registered agents
  const [registeredAgents, setRegisteredAgents] = useState<StudioAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // LLM & Voice Credentials Configuration
  const [llmProvider, setLlmProvider] = useState<
    "openai" | "openrouter" | "groq" | "anthropic" | "deepseek"
  >("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an energetic, fun 3D AI VTuber streaming live on Solana & pump.fun!"
  );

  const [ttsProvider, setTtsProvider] = useState<"webspeech" | "elevenlabs">("webspeech");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [savingLiveConfig, setSavingLiveConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ingest stream state
  const [ytUrl, setYtUrl] = useState("");
  const [ytKey, setYtKey] = useState("");
  const [ytConnected, setYtConnected] = useState(false);
  const ytOn = useRef(false);
  const ytPoll = useRef<number | null>(null);
  const ytSeen = useRef<Set<string>>(new Set());
  const ytChatId = useRef("");
  const ytPage = useRef("");
  const [pumpToken, setPumpToken] = useState("");
  const [ingestNote, setIngestNote] = useState("");
  const [fetchingPump, setFetchingPump] = useState(false);
  const [pumpData, setPumpData] = useState<{
    name?: string;
    symbol?: string;
    image?: string;
    usdMarketCap?: number | string;
    replyCount?: number;
    source?: string;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<
    { user: string; text: string; time: string }[]
  >([]);
  const [userChatInput, setUserChatInput] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("windwrtest.youtubeApiKey");
    if (saved) setYtKey(saved);
  }, []);

  // Save live config to agent endpoint /api/agents/[id]/live
  const handleSaveLiveConfig = async () => {
    if (!selectedAgentId) return;
    const token = getToken();
    if (!token) return;
    setSavingLiveConfig(true);
    setSaveSuccess(false);

    try {
      const configPayload = {
        pumpMint: pumpToken,
        youtubeLiveUrl: ytUrl,
        llmProvider,
        llmModel,
        ttsProvider,
        elevenLabsVoiceId,
        expression,
        chromaBg,
        vrmUrl,
      };

      const res = await fetch(`/api/agents/${selectedAgentId}/live`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(configPayload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save agent live config:", err);
    } finally {
      setSavingLiveConfig(false);
    }
  };

  // Speak text using Web Speech API or ElevenLabs TTS
  const speakText = async (text: string) => {
    if (!ttsEnabled || typeof window === "undefined") return;

    if (ttsProvider === "elevenlabs" && elevenLabsKey) {
      const audioBuffer = await generateElevenLabsTtsAudio(
        text,
        elevenLabsKey,
        elevenLabsVoiceId
      );
      if (audioBuffer) {
        try {
          const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          setSpeaking(true);
          audio.onended = () => setSpeaking(false);
          audio.onerror = () => setSpeaking(false);
          await audio.play();
          return;
        } catch (err) {
          console.warn("ElevenLabs audio play failed, falling back to Web Speech:", err);
        }
      }
    }

    // Fallback: Web Speech API
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const formatMcap = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "unavailable";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return typeof val === "string" ? val : "Live";
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const handleFetchPumpToken = async (mint?: string) => {
    const value = (mint ?? pumpToken).trim();
    if (!value) return;
    setFetchingPump(true);
    try {
      const res = await fetch(`/api/live/pumpfun?mint=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.ok) {
        setPumpData(data);
        if (data.name) setAgentName(data.name);
        const cap = formatMcap(data.usdMarketCap);
        const announce = `${data.name} (${data.symbol}) loaded from ${data.source}. Market cap ${cap}.`;
        setIngestNote(announce);
        setChatMessages((prev) => [
          ...prev,
          {
            user: "TOKEN",
            text: announce,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        speakText(announce);
      } else {
        const note = data.message || data.error || "Token lookup failed.";
        setIngestNote(note);
        setPumpData(null);
      }
    } catch (err) {
      console.error("Failed to fetch pump token:", err);
      setIngestNote("Token lookup failed.");
    } finally {
      setFetchingPump(false);
    }
  };

  const stopYoutube = () => {
    ytOn.current = false;
    setYtConnected(false);
    if (ytPoll.current) window.clearTimeout(ytPoll.current);
    ytPoll.current = null;
  };

  const pullYoutube = async (reset: boolean) => {
    if (!ytKey.trim() || !ytUrl.trim()) {
      setIngestNote("Paste your YouTube Data API key and a live URL. Vercel does not store this key.");
      return;
    }
    const res = await fetch("/api/live/chat/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: ytUrl.trim(),
        apiKey: ytKey.trim(),
        liveChatId: reset ? "" : ytChatId.current,
        pageToken: reset ? "" : ytPage.current,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      setIngestNote(data.message || data.error || "YouTube resolve failed.");
      stopYoutube();
      return;
    }
    if (!data.isLive || !data.activeLiveChatId) {
      setIngestNote(data.message || `Not live${data.title ? `: ${data.title}` : ""}.`);
      stopYoutube();
      return;
    }
    ytChatId.current = data.activeLiveChatId;
    ytPage.current = data.nextPageToken || "";
    const fresh = (data.messages || []).filter((m: { id: string }) => !ytSeen.current.has(m.id));
    fresh.forEach((m: { id: string }) => ytSeen.current.add(m.id));
    if (fresh.length) {
      const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChatMessages((prev) => [
        ...prev,
        ...fresh.map((m: { author: string; text: string }) => ({
          user: m.author,
          text: m.text,
          time: stamp,
        })),
      ]);
    }
    setIngestNote(`Live chat: ${data.title || "YouTube"} · ${ytSeen.current.size} lines`);
    if (!ytOn.current) return;
    const wait = Math.max(5000, Number(data.pollingIntervalMillis) || 8000);
    ytPoll.current = window.setTimeout(() => {
      void pullYoutube(false);
    }, wait);
  };

  const handleYoutube = async () => {
    if (ytConnected) {
      stopYoutube();
      setIngestNote("YouTube chat stopped.");
      return;
    }
    ytOn.current = true;
    window.localStorage.setItem("windwrtest.youtubeApiKey", ytKey.trim());
    ytSeen.current = new Set();
    ytChatId.current = "";
    ytPage.current = "";
    setYtConnected(true);
    setIngestNote("Connecting YouTube live chat…");
    try {
      await pullYoutube(true);
    } catch {
      setIngestNote("YouTube resolve failed.");
      stopYoutube();
    }
  };

  const applyAgent = async (agent: StudioAgent) => {
    setSelectedAgentId(agent.id);
    setAgentName(agent.name);
    if (agent.persona) setSystemPrompt(agent.persona);
    const body = modelUrl(agent);
    if (body) {
      setVrmUrl(body);
      setIngestNote(`Loaded ${agent.name} body.`);
    } else {
      setIngestNote(`${agent.name} has no .vrm or .glb. Pick a sample or paste a model URL.`);
    }
    if (agent.tokenMint) {
      setPumpToken(agent.tokenMint);
      void handleFetchPumpToken(agent.tokenMint);
    }
    const token = getToken();
    try {
      const res = await fetch(`/api/agents/${agent.id}/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      const live = data.live || {};
      if (typeof live.youtubeLiveUrl === "string") setYtUrl(live.youtubeLiveUrl);
      if (!body && typeof live.vrmUrl === "string" && live.vrmUrl) setVrmUrl(live.vrmUrl);
      if (!agent.tokenMint && typeof live.pumpMint === "string" && live.pumpMint) {
        setPumpToken(live.pumpMint);
      }
      if (live.llmProvider) setLlmProvider(live.llmProvider);
      if (live.ttsProvider) setTtsProvider(live.ttsProvider);
    } catch {
      /* agent name and body already applied */
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch("/api/agents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents) && data.agents.length > 0) {
          setRegisteredAgents(data.agents);
          await applyAgent(data.agents[0]);
        }
      } catch (err) {
        console.warn("Failed to fetch registered agents:", err);
      }
    };
    void fetchAgents();
    return () => {
      if (ytPoll.current) window.clearTimeout(ytPoll.current);
    };
    // load once when the studio opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async () => {
    if (!userChatInput.trim()) return;
    const text = userChatInput.trim();
    const newMsg = {
      user: "You (Streamer)",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserChatInput("");

    // Generate LLM reply
    const reply = await generateVtuberLlmReply(text, {
      provider: llmProvider,
      apiKey: llmApiKey,
      model: llmModel,
      systemPrompt,
    });

    setChatMessages((prev) => [
      ...prev,
      {
        user: agentName,
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    speakText(reply);
  };

  return (
    <AppShell>
      <div className="relative w-full h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden bg-black/90">
        {/* Main 3D Stage / Studio viewport */}
        <div className="relative flex-1 h-full min-h-[450px] flex items-center justify-center border-r border-cyan-500/20">
          <VrmStudio
            vrmUrl={vrmUrl}
            chromaBg={chromaBg}
            speaking={speaking}
            expression={expression}
          />

          {/* Nameplate Overlay */}
          {!hideDock && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-black/70 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg">
              <div className="relative flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute"></div>
                <div className="w-3 h-3 rounded-full bg-red-500 z-10"></div>
              </div>
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  <Radio className="w-3 h-3" /> {pumpData ? "Token loaded" : "Studio"}
                </div>
                <div className="text-sm font-bold text-white tracking-wide">{agentName}</div>
              </div>
            </div>
          )}

          {/* Live Token Info Floating Card */}
          {!hideDock && pumpData && (
            <div className="absolute top-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-amber-500/40 px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-3">
              {pumpData.image && (
                <img
                  src={pumpData.image}
                  alt="Token"
                  className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                />
              )}
              <div>
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  {pumpData.name} (${pumpData.symbol})
                </div>
                <div className="text-slate-300 text-[10px]">
                  MCap: {formatMcap(pumpData.usdMarketCap)}
                </div>
              </div>
            </div>
          )}

          {/* Stream Overlay Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setChromaBg(!chromaBg)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition border ${
                chromaBg
                  ? "bg-green-600/80 border-green-400 text-white"
                  : "bg-black/60 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              {chromaBg ? "Chroma (OBS)" : "Studio Void"}
            </button>

            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-black/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 transition"
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              {ttsEnabled ? "TTS Voice On" : "Mute TTS"}
            </button>

            <button
              onClick={() => setHideDock(!hideDock)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-black/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 transition"
            >
              {hideDock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hideDock ? "Show HUD" : "Clean Screen (Capture)"}
            </button>
          </div>
        </div>

        {/* Right Side Control Dock / Ingest Panel */}
        {!hideDock && (
          <div className="w-full lg:w-96 h-full border-l border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl flex flex-col p-4 overflow-y-auto space-y-4 text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4" /> AI VTuber Studio Control
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Stream 3D VRM/GLB agents live to YouTube & pump.fun.
                </p>
              </div>

              {selectedAgentId && (
                <button
                  onClick={handleSaveLiveConfig}
                  disabled={savingLiveConfig}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 shrink-0"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-950" /> Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Agent Identity Selector */}
            {registeredAgents.length > 0 && (
              <div className="space-y-1.5 border-t border-cyan-500/20 pt-3">
                <label className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Select Registered Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => {
                    const agent = registeredAgents.find((a) => a.id === e.target.value);
                    if (agent) void applyAgent(agent);
                  }}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  {registeredAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LLM Engine & Voice Settings Panel */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3 bg-slate-900/60 p-2.5 rounded-lg">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Brain & Voice Settings
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">LLM Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white mt-0.5"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="groq">Groq</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">TTS Engine</label>
                  <select
                    value={ttsProvider}
                    onChange={(e) => setTtsProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white mt-0.5"
                  >
                    <option value="webspeech">Web Speech (Free)</option>
                    <option value="elevenlabs">ElevenLabs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">LLM API Key</label>
                <input
                  type="password"
                  placeholder="sk-... / gsk_..."
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white mt-0.5"
                />
              </div>

              {ttsProvider === "elevenlabs" && (
                <div>
                  <label className="text-[10px] text-slate-400">ElevenLabs Key & Voice ID</label>
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <input
                      type="password"
                      placeholder="xi-..."
                      value={elevenLabsKey}
                      onChange={(e) => setElevenLabsKey(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Voice ID"
                      value={elevenLabsVoiceId}
                      onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Model Avatar Gallery Picker */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 3D Avatar Model Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["/vrm/seed-san.vrm", "Seed-san"],
                  ["/vrm/twist.vrm", "Twist"],
                  ["/vrm/avatar-a.vrm", "Avatar A"],
                  ["/vrm/avatar-b.vrm", "Avatar B"],
                ].map(([url, label]) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setVrmUrl(url)}
                    className={`p-2 rounded text-xs font-mono border ${
                      vrmUrl === url
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                        : "bg-slate-900 border-cyan-500/20 text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Paste custom .vrm or .glb URL..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white placeholder-slate-500"
                />
                <button
                  onClick={() => {
                    if (customUrlInput.trim()) setVrmUrl(customUrlInput.trim());
                  }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-black px-3 rounded text-xs font-bold uppercase tracking-wider"
                >
                  Load
                </button>
              </div>
            </div>

            {/* Expression Controls */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" /> Expression Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["neutral", "happy", "angry", "sad", "relaxed"].map((exp) => (
                  <button
                    key={exp}
                    onClick={() => setExpression(exp)}
                    className={`p-1.5 rounded text-xs font-mono uppercase tracking-wider border ${
                      expression === exp
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-900 border-cyan-500/20 text-slate-400 hover:text-white"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingest Links: YouTube / Pump.fun */}
            <div className="space-y-3 border-t border-cyan-500/20 pt-3">
              <label className="text-xs font-mono text-amber-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Stream Ingest Integrations
              </label>

              <div>
                <label className="text-[10px] text-slate-400">pump.fun Contract / Mint Address</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Mint ending in pump"
                    value={pumpToken}
                    onChange={(e) => setPumpToken(e.target.value)}
                    className="flex-1 bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white"
                  />
                  <button
                    onClick={() => void handleFetchPumpToken()}
                    disabled={fetchingPump}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    {fetchingPump ? (
                      "Loading..."
                    ) : (
                      <>
                        <Search className="w-3 h-3" /> Fetch
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Your YouTube Data API key</label>
                <input
                  type="password"
                  placeholder="AIza... from your Google Cloud project"
                  value={ytKey}
                  onChange={(e) => setYtKey(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white mt-1"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stays in this browser. Vercel does not need a shared key.
                </p>
              </div>
              <div>
                <label className="text-[10px] text-slate-400">YouTube Live URL</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={handleYoutube}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 rounded text-xs font-bold uppercase"
                  >
                    {ytConnected ? "Stop" : "Connect"}
                  </button>
                </div>
              </div>
              {ingestNote && (
                <p className="text-[11px] font-mono text-slate-300 leading-snug">{ingestNote}</p>
              )}
            </div>

            {/* Live Chat & Voice Testing Panel */}
            <div className="flex-1 border-t border-cyan-500/20 pt-3 flex flex-col justify-between">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1 mb-2">
                <MessageSquare className="w-3.5 h-3.5" /> Stream Chat Feed
              </label>
              <div className="h-36 bg-slate-900/80 border border-cyan-500/20 rounded p-2 overflow-y-auto space-y-2 font-mono text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-slate-300">
                    <span className="text-slate-500 text-[10px] mr-1.5">[{msg.time}]</span>
                    <span className="text-cyan-400 font-bold mr-1">{msg.user}:</span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Type message to test TTS..."
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-slate-900 border border-cyan-500/30 rounded p-2 text-xs font-mono text-white"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 rounded flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

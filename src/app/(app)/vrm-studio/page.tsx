"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getToken } from "@/lib/client-auth";

export default function VrmStudioPage() {
  const [vrmUrl, setVrmUrl] = useState("/vrm/sample1.glb");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [chromaBg, setChromaBg] = useState(false);
  const [hideDock, setHideDock] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expression, setExpression] = useState("neutral");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [agentName, setAgentName] = useState("AeroVTuber Agent");

  const [registeredAgents, setRegisteredAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");

  const [ytUrl, setYtUrl] = useState("");
  const [pumpToken, setPumpToken] = useState("2PENPmfgJfq6CG3k4byj4oWwHf8SerqakmYHMkUupump");
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
  >([
    { user: "crypto_fan", text: "LFG VTuber agent on pump.fun!", time: "12:00" },
    { user: "sol_whale", text: "Is bonding curve close to graduation?", time: "12:01" },
  ]);
  const [userChatInput, setUserChatInput] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch("/api/agents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents)) {
          setRegisteredAgents(data.agents);
          if (data.agents.length > 0) {
            setSelectedAgentId(data.agents[0].id);
            setAgentName(data.agents[0].name);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch registered agents:", err);
      }
    };
    fetchAgents();
  }, []);

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const formatMcap = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "Live";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return typeof val === "string" ? val : "Live";
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const handleFetchPumpToken = async () => {
    if (!pumpToken.trim()) return;
    setFetchingPump(true);
    try {
      const res = await fetch(`/api/live/pumpfun?mint=${encodeURIComponent(pumpToken.trim())}`);
      const data = await res.json();
      if (data.ok) {
        setPumpData(data);
        if (data.name) setAgentName(`${data.name} VTuber`);
        const announce = `Loaded token ${data.name || "Pump Token"} ($${data.symbol || "PUMP"}). We are live!`;
        setChatMessages((prev) => [
          ...prev,
          {
            user: "SYSTEM",
            text: announce,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        speakText(announce);
      }
    } catch (err) {
      console.error("Failed to fetch pump token:", err);
    } finally {
      setFetchingPump(false);
    }
  };

  useEffect(() => {
    handleFetchPumpToken();
  }, []);

  const handleSendMessage = () => {
    if (!userChatInput.trim()) return;
    const text = userChatInput.trim();
    const newMsg = {
      user: "You (Streamer)",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserChatInput("");

    const reply = `Aero reply to "${text}": Welcome to our live Solana stream!`;
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          user: agentName,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakText(reply);
    }, 600);
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
                  <Radio className="w-3 h-3" /> Live Studio Engine
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
            <div>
              <h2 className="text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4" /> AI VTuber Studio Control
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Stream 3D VRM agents directly to YouTube Live or pump.fun.
              </p>
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
                    if (agent) {
                      setSelectedAgentId(agent.id);
                      setAgentName(agent.name);
                    }
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

            {/* Always Visible Stream Credentials / Keys Settings Panel */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3 bg-slate-900/60 p-2.5 rounded-lg">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Stream Keys & Credentials
              </div>
              <div>
                <label className="text-[10px] text-slate-400">ElevenLabs Voice Key (Optional)</label>
                <input
                  type="password"
                  placeholder="xi-..."
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">OpenAI / OpenRouter Key (Optional)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white mt-0.5"
                />
              </div>
            </div>

            {/* Model Avatar Gallery Picker */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 3D Avatar Model Presets
              </label>
              <select
                value={vrmUrl}
                onChange={(e) => setVrmUrl(e.target.value)}
                className="w-full bg-slate-900 border border-cyan-500/30 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="/vrm/sample1.glb">Avatar 1 (Avocado 3D Core)</option>
                <option value="/vrm/sample2.glb">Avatar 2 (Duck 3D Mascot)</option>
                <option value="/vrm/sample3.glb">Avatar 3 (Fox 3D Animated)</option>
              </select>
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
                    placeholder="Paste ...pump token address"
                    value={pumpToken}
                    onChange={(e) => setPumpToken(e.target.value)}
                    className="flex-1 bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white"
                  />
                  <button
                    onClick={handleFetchPumpToken}
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
                <label className="text-[10px] text-slate-400">YouTube Live URL</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white mt-1"
                />
              </div>
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

"use client";

import React, { useState } from "react";
import { VrmStudio } from "@/components/vrm/VrmStudio";
import { AppShell } from "@/components/hud/AppShell";
import {
  Video,
  Eye,
  EyeOff,
  Mic,
  Smile,
  Palette,
  Globe,
  Radio,
  Sliders,
  Send,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function VrmStudioPage() {
  const [vrmUrl, setVrmUrl] = useState(
    "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Sample.vrm"
  );
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [chromaBg, setChromaBg] = useState(false);
  const [hideDock, setHideDock] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expression, setExpression] = useState("neutral");
  const [agentName, setAgentName] = useState("AeroVTuber Agent");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an energetic 3D AI VTuber streaming live on Solana and pump.fun!"
  );

  // Ingest stream URL
  const [ytUrl, setYtUrl] = useState("");
  const [pumpToken, setPumpToken] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { user: string; text: string; time: string }[]
  >([
    { user: "crypto_fan", text: "LFG VTuber agent!", time: "12:00" },
    { user: "sol_whale", text: "What token are we launching today?", time: "12:01" },
  ]);
  const [userChatInput, setUserChatInput] = useState("");

  const handleSendMessage = () => {
    if (!userChatInput.trim()) return;
    const newMsg = {
      user: "You (Streamer)",
      text: userChatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserChatInput("");

    // Simulate VTuber reaction and speaking lip-sync
    setSpeaking(true);
    setTimeout(() => {
      setSpeaking(false);
      setChatMessages((prev) => [
        ...prev,
        {
          user: agentName,
          text: `Aero reply to: "${newMsg.text}" — We are live on Solana!`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2500);
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

          {/* Nameplate Overlay (Streaming Studio style) */}
          {!hideDock && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg">
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

          {/* Stream Overlay Controls (OBS Dock Hide / Green Screen Toggle) */}
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
          <div className="w-full lg:w-96 h-full border-l border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl flex flex-col p-4 overflow-y-auto space-y-5 text-slate-200">
            <div>
              <h2 className="text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4" /> AI VTuber Studio Control
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Stream 3D VRM agents directly to YouTube Live or pump.fun.
              </p>
            </div>

            {/* Model Avatar Picker */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> VRM Avatar Model
              </label>
              <select
                value={vrmUrl}
                onChange={(e) => setVrmUrl(e.target.value)}
                className="w-full bg-slate-900 border border-cyan-500/30 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Sample.vrm">
                  Sample VRM 1.0 Avatar
                </option>
              </select>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Paste custom .vrm URL..."
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

            {/* Expression & Voice Controls */}
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
                <label className="text-[10px] text-slate-400">YouTube Live URL or Video ID</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400">pump.fun Contract / Mint Address</label>
                <input
                  type="text"
                  placeholder="Paste ...pump token address"
                  value={pumpToken}
                  onChange={(e) => setPumpToken(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded p-1.5 text-xs font-mono text-white mt-1"
                />
              </div>
            </div>

            {/* Live Chat & Voice Testing Panel */}
            <div className="flex-1 border-t border-cyan-500/20 pt-3 flex flex-col justify-between">
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1 mb-2">
                <MessageSquare className="w-3.5 h-3.5" /> Stream Chat Feed
              </label>
              <div className="h-40 bg-slate-900/80 border border-cyan-500/20 rounded p-2 overflow-y-auto space-y-2 font-mono text-xs">
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
                  placeholder="Test chat reaction..."
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

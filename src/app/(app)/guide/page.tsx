"use client";

import React from "react";
import { AppShell } from "@/components/hud/AppShell";
import {
  Video,
  Bot,
  Radio,
  EyeOff,
  Palette,
  CheckCircle2,
  Tv,
  ArrowRight,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function StreamGuidePage() {
  const steps = [
    {
      step: 1,
      title: "Create Your AI Agent Identity",
      desc: "Register your human account or Ed25519 agent using skill.md or the WindAgents Forge. Configure your avatar and persona in the Agents desk.",
      link: "/agents",
      linkText: "Go to Agents Desk",
    },
    {
      step: 2,
      title: "Configure Live Settings & Token CA",
      desc: "Paste your pump.fun contract address (ending in 'pump') or YouTube Live URL in your Agent's live configuration or directly in the VRM Studio control dock.",
      link: "/vrm-studio",
      linkText: "Open VRM Studio",
    },
    {
      step: 3,
      title: "Launch VRM Studio Engine",
      desc: "Navigate to the Studio desk (/vrm-studio). Load your .vrm avatar or use the default sample avatar. Test lip-sync visemes and expression presets.",
      link: "/vrm-studio",
      linkText: "Launch Studio",
    },
    {
      step: 4,
      title: "Enable OBS Chroma Keying (Green Screen)",
      desc: "Click 'Chroma (OBS)' in the studio bottom overlay to switch background to solid green (#00FF00). Add a Window Capture / Browser Source in OBS with Chroma Key filter.",
      icon: Palette,
    },
    {
      step: 5,
      title: "Clean Screen Mode for Screen Share",
      desc: "Click 'Clean Screen (Capture)' to hide control panels, leaving only your 3D VTuber avatar and live token nameplate for stream broadcast.",
      icon: EyeOff,
    },
    {
      step: 6,
      title: "Broadcast to pump.fun & YouTube Live",
      desc: "Share your clean studio browser tab directly on pump.fun Livestream or broadcast via OBS to YouTube / Twitch.",
      icon: Radio,
    },
    {
      step: 7,
      title: "Live Chat Ingest & TTS Speech Loop",
      desc: "Your agent automatically polls live chat messages, replies using its configured LLM brain, and speaks using Web Speech TTS with natural mouth visemes.",
      icon: Sparkles,
    },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-slate-200">
        {/* Header */}
        <div className="border-b border-cyan-500/20 pb-6 space-y-2">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Tv className="w-4 h-4" /> Official WindAgents Streaming Guide
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            How to Stream 3D AI VTuber Agents Live on pump.fun & YouTube
          </h1>
          <p className="text-sm text-slate-400">
            Step-by-step instructions to stream autonomous 3D avatars directly to live audiences.
          </p>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/vrm-studio"
            className="p-5 bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 rounded-xl transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase">Interactive Stage</div>
              <div className="text-base font-bold text-white mt-1">Open 3D VRM Studio</div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/agents"
            className="p-5 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 rounded-xl transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase">Manage Identities</div>
              <div className="text-base font-bold text-white mt-1">Configure Agent Personas</div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" /> 7-Step Stream Setup Loop
          </h2>

          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    0{s.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                {s.link && (
                  <Link
                    href={s.link}
                    className="px-3 py-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white rounded text-xs font-mono flex items-center gap-1.5 shrink-0 self-start md:self-auto"
                  >
                    {s.linkText} <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting / FAQ */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
          </h3>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-mono">
            <p>
              <strong className="text-white">Q: Do I need a GPU server?</strong>
              <br />
              No! The 3D VRM rendering, visemes, and TTS run in your browser tab using WebGL and Web Speech API.
            </p>
            <p>
              <strong className="text-white">Q: Can I use custom .vrm avatars from VRoid Hub?</strong>
              <br />
              Yes! Export any .vrm file from VRoid Studio or VRoid Hub and paste the direct file URL into the Studio control dock.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

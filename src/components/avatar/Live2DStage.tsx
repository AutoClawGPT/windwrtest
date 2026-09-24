"use client";

import { useEffect, useRef } from "react";

const CUBISM_CORE =
  "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const found = document.querySelector(`script[src="${src}"]`);
    if (found && "Live2DCubismCore" in window) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Live2D Cubism core failed to load"));
    document.head.appendChild(script);
  });
}

type LiveModel = {
  width: number;
  height: number;
  scale: { set: (n: number) => void };
  anchor: { set: (x: number, y: number) => void };
  x: number;
  y: number;
  motion: (group: string, index?: number) => unknown;
  internalModel?: {
    coreModel?: { setParameterValueById: (id: string, value: number) => void };
  };
};

/** Cubism Live2D stage. Same path shape as the Open-LLM-VTuber web guide: /live2d-models/.../model3.json */
export function Live2DStage({
  modelUrl = "/live2d-models/haru/haru_greeter_t05.model3.json",
  speaking = false,
}: {
  modelUrl?: string;
  speaking?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<LiveModel | null>(null);
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let stopped = false;
    let destroy: (() => void) | null = null;

    (async () => {
      await loadScript(CUBISM_CORE);
      const PIXI = await import("pixi.js");
      const { Live2DModel } = await import("pixi-live2d-display/cubism4");
      if (stopped) return;
      Live2DModel.registerTicker(PIXI.Ticker);
      const view = document.createElement("canvas");
      view.style.width = "100%";
      view.style.height = "100%";
      host.replaceChildren(view);
      const app = new PIXI.Application({
        view,
        backgroundAlpha: 0,
        resizeTo: host,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      destroy = () => app.destroy(true);
      const model = (await Live2DModel.from(modelUrl)) as unknown as LiveModel;
      if (stopped) return;
      modelRef.current = model;
      const place = () => {
        const w = host.clientWidth || 640;
        const h = host.clientHeight || 800;
        const base = Math.min(w / model.width, h / model.height);
        model.scale.set(base * 1.6);
        model.anchor.set(0.5, 0.5);
        model.x = w / 2;
        model.y = h / 2 + h * 0.12;
      };
      place();
      app.stage.addChild(model as never);
      void model.motion("Idle");
      window.addEventListener("resize", place);
    })().catch((err) => {
      console.warn(err);
    });

    return () => {
      stopped = true;
      modelRef.current = null;
      destroy?.();
    };
  }, [modelUrl]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const core = modelRef.current?.internalModel?.coreModel;
      if (core) {
        const open = speakingRef.current ? (Math.sin(performance.now() / 80) + 1) / 2 : 0;
        core.setParameterValueById("ParamMouthOpenY", open);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

interface VrmStudioProps {
  vrmUrl?: string;
  chromaBg?: boolean;
  speaking?: boolean;
  expression?: string;
  autoLookAt?: boolean;
  onLoaded?: () => void;
}

export function VrmStudio({
  vrmUrl = "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Sample.vrm",
  chromaBg = false,
  speaking = false,
  expression = "neutral",
  autoLookAt = true,
  onLoaded,
}: VrmStudioProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const currentVrmRef = useRef<VRM | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mutable refs for state properties inside animation loop without re-init
  const stateRef = useRef({ speaking, expression, autoLookAt, chromaBg });
  useEffect(() => {
    stateRef.current = { speaking, expression, autoLookAt, chromaBg };
    if (sceneRef.current) {
      sceneRef.current.background = chromaBg ? new THREE.Color(0x00ff00) : null;
    }
  }, [speaking, expression, autoLookAt, chromaBg]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Scene & Camera setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = chromaBg ? new THREE.Color(0x00ff00) : null;

    const camera = new THREE.PerspectiveCamera(
      30,
      container.clientWidth / container.clientHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.4, 1.3);
    camera.lookAt(0, 1.3, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 2, 1).normalize();
    scene.add(dirLight);

    // Single Look-at target
    const lookAtTarget = new THREE.Object3D();
    scene.add(lookAtTarget);

    // VRM Loader
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    setLoading(true);
    setError(null);

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          setError("Failed to parse VRM metadata.");
          setLoading(false);
          return;
        }

        VRMUtils.rotateVRM0(vrm);
        scene.add(vrm.scene);
        currentVrmRef.current = vrm;
        setLoading(false);
        if (onLoaded) onLoaded();
      },
      undefined,
      (err) => {
        console.warn("VRM Load Error:", err);
        setError("Could not load .vrm file. Check CORS or URL.");
        setLoading(false);
      }
    );

    // Mouse tracker
    const mouse = new THREE.Vector2();
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const clock = new THREE.Clock();
    let blinkTimer = 0;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const vrm = currentVrmRef.current;
      const currentState = stateRef.current;

      if (vrm) {
        vrm.update(delta);

        // Head sway
        if (vrm.humanoid) {
          const head = vrm.humanoid.getNormalizedBoneNode("head");
          if (head) {
            head.rotation.y = Math.sin(time * 1.5) * 0.05;
            head.rotation.x = Math.cos(time * 1.2) * 0.03;
          }
        }

        // Look at mouse
        if (currentState.autoLookAt && vrm.lookAt) {
          lookAtTarget.position.set(mouse.x * 2, mouse.y * 2 + 1.3, 1.0);
          vrm.lookAt.target = lookAtTarget;
        }

        // Natural Blink loop
        blinkTimer += delta;
        if (vrm.expressionManager) {
          if (blinkTimer > 3) {
            const blinkVal = Math.sin((blinkTimer - 3) * Math.PI * 4);
            vrm.expressionManager.setValue("blink", Math.max(0, blinkVal));
            if (blinkTimer > 3.25) {
              vrm.expressionManager.setValue("blink", 0);
              blinkTimer = 0;
            }
          }

          // Dynamic Lip-Sync Viseme simulation when speaking
          if (currentState.speaking) {
            const mouthOpen = (Math.sin(time * 18) + 1) / 2;
            vrm.expressionManager.setValue("aa", mouthOpen * 0.8);
          } else {
            vrm.expressionManager.setValue("aa", 0);
          }

          // Expression preset (happy, angry, sad, relaxed, neutral)
          if (currentState.expression !== "neutral") {
            vrm.expressionManager.setValue(currentState.expression, 0.7);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [vrmUrl, onLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]" ref={mountRef}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="font-mono text-xs uppercase tracking-widest">Loading VRM Avatar...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-x-4 top-4 bg-red-950/80 border border-red-500/50 p-3 rounded text-red-200 text-xs font-mono z-10">
          {error}
        </div>
      )}
    </div>
  );
}

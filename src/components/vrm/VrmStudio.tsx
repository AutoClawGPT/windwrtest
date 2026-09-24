"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
} from "@pixiv/three-vrm-animation";

interface VrmStudioProps {
  vrmUrl?: string;
  vrmaUrl?: string;
  chromaBg?: boolean;
  speaking?: boolean;
  expression?: string;
  autoLookAt?: boolean;
  onLoaded?: () => void;
}

export function VrmStudio({
  vrmUrl = "/vrm/rose.vrm",
  vrmaUrl = "",
  chromaBg = false,
  speaking = false,
  expression = "neutral",
  autoLookAt = true,
  onLoaded,
}: VrmStudioProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const currentVrmRef = useRef<VRM | null>(null);
  const currentModelSceneRef = useRef<THREE.Object3D | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
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
    camera.position.set(0, 1.4, 2.5);
    camera.lookAt(0, 1.0, 0);

    const fit = () => {
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 480);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const frameObject = (object: THREE.Object3D) => {
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z, 0.2);
      camera.position.set(center.x, center.y, center.z + span * 1.6);
      camera.near = span / 100;
      camera.far = span * 40;
      camera.lookAt(center);
      camera.updateProjectionMatrix();
    };

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    dirLight.position.set(1, 2, 1).normalize();
    scene.add(dirLight);

    // Single Look-at target
    const lookAtTarget = new THREE.Object3D();
    scene.add(lookAtTarget);

    // Loader setup
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    setLoading(true);
    setError(null);

    loader.load(
      vrmUrl,
      (gltf) => {
        // Clean up previous model if any
        if (currentModelSceneRef.current) {
          scene.remove(currentModelSceneRef.current);
          currentModelSceneRef.current = null;
        }

        const vrm = gltf.userData.vrm as VRM | undefined;
        if (vrm) {
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.combineSkeletons(gltf.scene);
          VRMUtils.combineMorphs(vrm);
          VRMUtils.rotateVRM0(vrm);
          vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });
          if (vrm.lookAt) {
            const lookAtQuatProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
            lookAtQuatProxy.name = "lookAtQuaternionProxy";
            vrm.scene.add(lookAtQuatProxy);
          }
          scene.add(vrm.scene);
          currentVrmRef.current = vrm;
          currentModelSceneRef.current = vrm.scene;
          frameObject(vrm.scene);
          if (vrmaUrl) {
            const animLoader = new GLTFLoader();
            animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
            animLoader.load(vrmaUrl, (animGltf) => {
              const clipSource = animGltf.userData.vrmAnimations?.[0];
              if (!clipSource || !currentVrmRef.current) return;
              const clip = createVRMAnimationClip(clipSource, currentVrmRef.current);
              const mixer = new THREE.AnimationMixer(currentVrmRef.current.scene);
              mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
              mixerRef.current = mixer;
            });
          }
        } else {
          // Fallback: Standard GLB 3D model
          const modelScene = gltf.scene;
          const box = new THREE.Box3().setFromObject(modelScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.2 / maxDim;

          modelScene.scale.set(scale, scale, scale);
          modelScene.position.sub(center.multiplyScalar(scale));
          modelScene.updateMatrixWorld(true);

          scene.add(modelScene);
          currentModelSceneRef.current = modelScene;
          currentVrmRef.current = null;
          frameObject(modelScene);
        }

        fit();

        setLoading(false);
        if (onLoaded) onLoaded();
      },
      undefined,
      (err) => {
        console.warn("3D Avatar Load Error:", err);
        setError("Could not load 3D model file. Check URL or CORS.");
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
      const model = currentModelSceneRef.current;
      const currentState = stateRef.current;

      if (vrm) {
        mixerRef.current?.update(delta);
        vrm.update(delta);

        if (vrm.humanoid) {
          const head = vrm.humanoid.getNormalizedBoneNode("head");
          if (head) {
            head.rotation.y = Math.sin(time * 1.5) * 0.05;
            head.rotation.x = Math.cos(time * 1.2) * 0.03;
          }
        }

        if (currentState.autoLookAt && vrm.lookAt) {
          lookAtTarget.position.set(mouse.x * 2, mouse.y * 2 + 1.3, 1.0);
          vrm.lookAt.target = lookAtTarget;
        }

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

          if (currentState.speaking) {
            const mouthOpen = (Math.sin(time * 18) + 1) / 2;
            vrm.expressionManager.setValue("aa", mouthOpen * 0.8);
          } else {
            vrm.expressionManager.setValue("aa", 0);
          }

          if (currentState.expression !== "neutral") {
            vrm.expressionManager.setValue(currentState.expression, 0.7);
          }
        }
      } else if (model) {
        model.rotation.y = Math.sin(time * 0.8) * 0.15;
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
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    fit();

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [vrmUrl, vrmaUrl, onLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]" ref={mountRef}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="font-mono text-xs uppercase tracking-widest">Loading 3D Avatar...</span>
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

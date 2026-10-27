"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { color } from "@/design-system/tokens";
import { useMotion } from "@/lib/motion/MotionProvider";
import type { KnotHandle } from "@/lib/motion/engine";
import { rimShader } from "./rimShader";
import styles from "./three.module.css";

/**
 * Copper-rimmed torus knot. Its pose (`orient`) and lean are driven by the
 * motion engine as the capability blocks scroll past.
 */
export function KnotObject({ rim = color.accent }: { rim?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handle = useRef<KnotHandle | null>(null);
  const { engine } = useMotion();

  useEffect(() => {
    if (!engine || !handle.current) return;
    return engine.registerKnot(handle.current);
  }, [engine]);

  useEffect(() => {
    const host = ref.current!;
    const h: KnotHandle = (handle.current = { el: host, orient: [0, 0, 0], lean: [0, 0] });
    let raf = 0;
    let disposed = false;
    let teardown = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      const w = () => host.clientWidth || 1;
      const hh = () => host.clientHeight || 1;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
      renderer.setSize(w(), hh());
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = styles.canvas;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, w() / hh(), 0.1, 100);
      camera.position.set(0, 0, 11);
      const copper = new THREE.Color(rim);
      scene.add(new THREE.AmbientLight(0xffffff, 0.08));
      const key = new THREE.DirectionalLight(0xe8e8e6, 0.55);
      key.position.set(-3, 4, 5);
      scene.add(key);
      const rimA = new THREE.DirectionalLight(copper, 4.2);
      rimA.position.set(4, 1.5, -4);
      scene.add(rimA);
      const rimB = new THREE.DirectionalLight(copper, 2.4);
      rimB.position.set(-4, -2, -3);
      scene.add(rimB);

      const mat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, metalness: 0.35, roughness: 0.38 });
      mat.onBeforeCompile = rimShader(copper, "normalize(vNormal)", 3.0, 0.9);

      const group = new THREE.Group();
      group.scale.setScalar(0.68);
      scene.add(group);
      const pose = new THREE.Group();
      group.add(pose);
      const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.28, 240, 40, 2, 3), mat);
      pose.add(mesh);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.004, 8, 200), new THREE.MeshBasicMaterial({ color: 0x3a3a39 }));
      ring.rotation.x = Math.PI / 2.3;
      pose.add(ring);

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let mx = 0;
      let my = 0;
      let visible = true;
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
      };
      addEventListener("pointermove", onMove);
      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
      });
      io.observe(host);
      const ro = new ResizeObserver(() => {
        renderer.setSize(w(), hh());
        camera.aspect = w() / hh();
        camera.updateProjectionMatrix();
      });
      ro.observe(host);

      const clock = new THREE.Clock();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const sp = reduce ? 0 : 1;
        mesh.rotation.y = t * 0.18 * sp;
        mesh.rotation.x = 0.4 + Math.sin(t * 0.25) * 0.12 * sp;
        const ln = h.lean;
        group.rotation.y += (mx * 0.5 + ln[0] - group.rotation.y) * 0.035;
        group.rotation.x += (my * 0.3 + ln[1] - group.rotation.x) * 0.035;
        group.position.y = Math.sin(t * 0.6) * 0.06 * sp;
        const o = h.orient;
        pose.rotation.x += (o[0] - pose.rotation.x) * 0.05;
        pose.rotation.y += (o[1] - pose.rotation.y) * 0.05;
        pose.rotation.z += (o[2] - pose.rotation.z) * 0.05;
        renderer.render(scene, camera);
      };
      loop();

      teardown = () => {
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", onMove);
        io.disconnect();
        ro.disconnect();
        disposeScene(scene);
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      teardown();
    };
  }, [rim]);

  return <div ref={ref} className={styles.host} />;
}

export function disposeScene(scene: THREE_NS.Scene) {
  scene.traverse((o) => {
    const m = o as THREE_NS.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
  });
}

"use client";

import { useEffect, useRef } from "react";
import { color } from "@/design-system/tokens";
import { disposeScene } from "./KnotObject";
import { rimShader } from "./rimShader";
import styles from "./three.module.css";

type Props = {
  /** One flag per orbit: name, email, message are valid. */
  filled: boolean[];
  /** Collapses the orbits and pulses the core. */
  sent: boolean;
  rim?: string;
};

/** Faceted core with three orbits that light up as the contact form fills in. */
export function SignalObject({ filled, sent, rim = color.accent }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ filled, sent });

  useEffect(() => {
    live.current = { filled, sent };
  }, [filled, sent]);

  useEffect(() => {
    const host = ref.current!;
    let raf = 0;
    let disposed = false;
    let teardown = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      const w = () => host.clientWidth || 1;
      const h = () => host.clientHeight || 1;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
      renderer.setSize(w(), h());
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = styles.canvas;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, w() / h(), 0.1, 100);
      camera.position.set(0, 0.6, 9);
      camera.lookAt(0, 0, 0);
      const copper = new THREE.Color(rim);
      scene.add(new THREE.AmbientLight(0xffffff, 0.08));
      const key = new THREE.DirectionalLight(0xe8e8e6, 0.5);
      key.position.set(-3, 4, 5);
      scene.add(key);
      const rimA = new THREE.DirectionalLight(copper, 3.6);
      rimA.position.set(4, 1.5, -4);
      scene.add(rimA);
      const rimB = new THREE.DirectionalLight(copper, 2);
      rimB.position.set(-4, -2, -3);
      scene.add(rimB);

      const glow = { value: 0.8 };
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.35, roughness: 0.4, flatShading: true });
      coreMat.onBeforeCompile = rimShader(copper, "normal", 2.8, glow);
      const root = new THREE.Group();
      scene.add(root);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), coreMat);
      root.add(core);

      const grey = new THREE.Color(0x3a3a39);
      const orbits = (
        [
          { r: 1.55, tilt: [1.25, 0, 0.25], speed: 0.55 },
          { r: 1.95, tilt: [1.05, 0.6, -0.35], speed: -0.4 },
          { r: 2.35, tilt: [1.4, -0.5, 0.6], speed: 0.3 },
        ] as { r: number; tilt: [number, number, number]; speed: number }[]
      ).map((o, i) => {
        const g = new THREE.Group();
        g.rotation.set(...o.tilt);
        root.add(g);
        const ringMat = new THREE.MeshBasicMaterial({ color: grey.clone(), transparent: true, opacity: 0.55 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(o.r, 0.006, 6, 220), ringMat);
        g.add(ring);
        const dotMat = new THREE.MeshBasicMaterial({ color: copper.clone(), transparent: true, opacity: 0 });
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), dotMat);
        g.add(dot);
        return { ...o, ring, ringMat, dot, dotMat, a: i * 2.1, lit: 0, collapse: 0 };
      });

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let visible = true;
      let pulse = 0;
      let wasSent = false;
      let mx = 0;
      let my = 0;
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
        renderer.setSize(w(), h());
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
      });
      ro.observe(host);

      const clock = new THREE.Clock();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const sp = reduce ? 0 : 1;
        const { filled: f, sent: s } = live.current;
        if (s && !wasSent) pulse = 1;
        wasSent = s;
        const nLit = f.filter(Boolean).length;
        orbits.forEach((o, i) => {
          const on = !!f[i] || s;
          o.lit += ((on ? 1 : 0) - o.lit) * 0.06;
          o.collapse += ((s ? 1 : 0) - o.collapse) * 0.035;
          o.ringMat.color.copy(grey).lerp(copper, o.lit * 0.85);
          o.ringMat.opacity = (0.45 + o.lit * 0.4) * (1 - o.collapse * 0.85);
          o.dotMat.opacity = o.lit * (1 - o.collapse);
          o.a += dt * o.speed * (1 + o.lit * 1.4 + nLit * 0.15) * sp;
          const rr = o.r * (1 - o.collapse * 0.55);
          o.ring.scale.setScalar(1 - o.collapse * 0.55);
          o.dot.position.set(Math.cos(o.a) * rr, Math.sin(o.a) * rr, 0);
        });
        pulse *= 0.965;
        glow.value = 0.7 + nLit * 0.18 + pulse * 2.2;
        core.scale.setScalar(1 + pulse * 0.12);
        core.rotation.y += dt * 0.15 * sp;
        core.rotation.x = 0.3 + Math.sin(t * 0.3) * 0.1 * sp;
        root.rotation.y += (mx * 0.45 - root.rotation.y) * 0.04;
        root.rotation.x += (my * 0.25 - root.rotation.x) * 0.04;
        root.position.y = Math.sin(t * 0.6) * 0.05 * sp;
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

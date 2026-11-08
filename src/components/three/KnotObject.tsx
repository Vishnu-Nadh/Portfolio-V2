"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { color } from "@/design-system/tokens";
import { disposeScene } from "./dispose";
import { rimShader } from "./rimShader";
import styles from "./three.module.css";

/** Imperative reactions the contact form triggers on the knot. */
export type KnotApi = {
  /** Small swell, e.g. while typing. */
  pulse(): void;
  /** Turn to a pose per field: 0 name, 1 email, 2 message, 3 topic; -1 returns to rest. */
  focus(i: number): void;
  /** Small kick, e.g. on a button press. */
  tap(): void;
  /** Shake, e.g. on an invalid submit. */
  reject(): void;
};

type Props = {
  rim?: string;
  /** One flag per field (name, email, message): warms the rim and speeds the spin. */
  filled?: boolean[];
  /** Triggers a single spin burst. */
  sent?: boolean;
  ref?: Ref<KnotApi>;
};

/** Per-field focus poses (x, y, z radians). */
const FOCUS: [number, number, number][] = [
  [0.35, -0.55, 0],
  [-0.3, 0.6, 0.15],
  [0.55, 0.2, -0.3],
  [0, 0, 0.6],
];

/** Copper-rimmed torus knot that reacts to the contact form. */
export function KnotObject({ rim = color.accent, filled = [false, false, false], sent = false, ref }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ filled, sent });
  // Reaction state shared between the imperative API and the render loop.
  const fx = useRef({ pulse: 0, focusT: [0, 0, 0] as number[], kick: 0, shake: 0 });

  useEffect(() => {
    live.current = { filled, sent };
  }, [filled, sent]);

  useImperativeHandle(
    ref,
    () => ({
      pulse() {
        fx.current.pulse = Math.min(1, fx.current.pulse + 0.35);
      },
      focus(i) {
        fx.current.focusT = FOCUS[i] || [0, 0, 0];
        if (i >= 0) fx.current.pulse = Math.min(1, fx.current.pulse + 0.5);
      },
      tap() {
        fx.current.kick = 1;
        fx.current.pulse = Math.min(1, fx.current.pulse + 0.6);
      },
      reject() {
        fx.current.shake = 1;
      },
    }),
    [],
  );

  useEffect(() => {
    const el = host.current!;
    let raf = 0;
    let disposed = false;
    let teardown = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      const w = () => el.clientWidth || 1;
      const h = () => el.clientHeight || 1;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
      renderer.setSize(w(), h());
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = styles.canvas;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, w() / h(), 0.1, 100);
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

      // Fresnel rim at 0.9 × a live gain the form reactions drive.
      const rimGain = { value: 0.9 };
      const mat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, metalness: 0.35, roughness: 0.38 });
      mat.onBeforeCompile = rimShader(copper, "normalize(vNormal)", 3.0, rimGain);

      const group = new THREE.Group();
      group.scale.setScalar(0.68);
      scene.add(group);
      const focus = new THREE.Group();
      group.add(focus);
      const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.28, 240, 40, 2, 3), mat);
      focus.add(mesh);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.004, 8, 200), new THREE.MeshBasicMaterial({ color: 0x3a3a39 }));
      ring.rotation.x = Math.PI / 2.3;
      focus.add(ring);

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let mx = 0;
      let my = 0;
      let visible = true;
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
      };
      addEventListener("pointermove", onMove);
      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
      });
      io.observe(el);
      const ro = new ResizeObserver(() => {
        renderer.setSize(w(), h());
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
      });
      ro.observe(el);

      let energy = 0;
      let burst = 0;
      let spin = 0;
      let wasSent = false;
      let last = 0;
      const clock = new THREE.Clock();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const sp = reduce ? 0 : 1;
        const dt = Math.min(t - last, 0.1);
        last = t;
        const { filled: f, sent: s } = live.current;
        const F = fx.current;
        energy += (f.filter(Boolean).length / 3 - energy) * 0.04;
        F.pulse *= 0.92;
        if (s && !wasSent) burst = 1;
        wasSent = s;
        burst *= 0.975;
        spin += dt * (0.18 + energy * 0.22 + burst * 3.2) * sp;
        let gain = 1 + energy * 0.6 + F.pulse * 0.35 + burst * 0.8;
        rimA.intensity = 4.2 * (1 + energy * 0.35 + burst * 0.5);
        F.kick *= 0.9;
        F.shake *= 0.94;
        spin += F.kick * dt * 2.4 * sp;
        focus.rotation.x += (F.focusT[0] - focus.rotation.x) * 0.06;
        focus.rotation.y += (F.focusT[1] - focus.rotation.y) * 0.06;
        focus.rotation.z += (F.focusT[2] - focus.rotation.z) * 0.06;
        group.position.x = Math.sin(t * 38) * 0.09 * F.shake * sp;
        gain *= 1 - F.shake * 0.45;
        rimGain.value = 0.9 * gain;
        group.scale.setScalar(0.68 * (1 + F.pulse * 0.025 * sp + F.kick * 0.04 * sp - burst * 0.06 * sp));
        mesh.rotation.y = spin;
        mesh.rotation.x = 0.4 + Math.sin(t * 0.25) * 0.12 * sp;
        group.rotation.y += (mx * 0.5 - group.rotation.y) * 0.035;
        group.rotation.x += (my * 0.3 - group.rotation.x) * 0.035;
        group.position.y = Math.sin(t * 0.6) * 0.06 * sp;
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

  return <div ref={host} className={styles.host} />;
}

"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "@/lib/motion/MotionProvider";
import type { StageHandle } from "@/lib/motion/engine";
import styles from "./three.module.css";

/**
 * Procedural Rubik's cube for "What I do": copper monochrome stickers that
 * vary by tone and surface finish, solving and re-scrambling itself. Its pose
 * (`orient`) and lean are driven by the motion engine as capability blocks
 * scroll past. No model or texture downloads: finishes are canvas-generated
 * normal + roughness maps.
 */

const BRAND = {
  body: "#140c07", // cubie body (dark copper-black)
  tones: ["#2a170c", "#3d2212", "#5a3119", "#7a4322"], // sticker copper tones, dark → mid
  accent: "#C8875A", // bright copper, ~2 stickers
  accentRatio: 0.08,
  keyLight: "#FFE9D6",
  rimLight: "#C8875A",
  rimIntensity: 0.6,
};
type Finish = { r: number; m: number; ns?: number };
const FINISH: Record<string, Finish> = {
  weave: { r: 0.45, m: 0.5, ns: 1.1 },
  hex: { r: 0.35, m: 0.8, ns: 1.4 },
  brushed: { r: 0.3, m: 0.9, ns: 0.55 },
  speckle: { r: 0.55, m: 0.6, ns: 0.8 },
  lines: { r: 0.4, m: 0.7, ns: 0.9 },
  satin: { r: 0.25, m: 0.4 },
  matte: { r: 0.8, m: 0.3 },
};
const PATTERNED = ["weave", "hex", "brushed", "speckle", "lines"] as const;
/** Seconds between face turns, and the duration of one turn. */
const MOVE_INTERVAL = 0.9;
const TURN = 0.55;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Greyscale height pattern for a sticker finish. */
function pattern(kind: (typeof PATTERNED)[number], rand: () => number) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgb(128,128,128)";
  x.fillRect(0, 0, S, S);
  if (kind === "weave") {
    const k = 32;
    for (let i = 0; i < S / k; i++)
      for (let j = 0; j < S / k; j++) {
        const hz = (i + j) % 2 === 0;
        for (let s = 0; s < 2; s++) {
          const g = hz ? x.createLinearGradient(0, j * k + s * 16, 0, j * k + s * 16 + 16) : x.createLinearGradient(i * k + s * 16, 0, i * k + s * 16 + 16, 0);
          g.addColorStop(0, "#404040");
          g.addColorStop(0.5, "#e0e0e0");
          g.addColorStop(1, "#404040");
          x.fillStyle = g;
          if (hz) x.fillRect(i * k, j * k + s * 16, k, 16);
          else x.fillRect(i * k + s * 16, j * k, 16, k);
        }
      }
  } else if (kind === "hex") {
    x.fillStyle = "#d0d0d0";
    x.fillRect(0, 0, S, S);
    x.fillStyle = "#303030";
    const d = 16;
    const h = d * 0.866;
    for (let r = -1, row = 0; r * h < S + h; r++, row++)
      for (let q = -1; q * d < S + d; q++) {
        x.beginPath();
        x.arc(q * d + ((row % 2) * d) / 2, r * h, 5.2, 0, 7);
        x.fill();
      }
  } else if (kind === "brushed") {
    for (let i = 0; i < 1600; i++) {
      const g = (90 + rand() * 90) | 0;
      x.strokeStyle = `rgba(${g},${g},${g},.55)`;
      x.lineWidth = 1;
      const y = rand() * S;
      const x0 = rand() * S;
      x.beginPath();
      x.moveTo(x0, y);
      x.lineTo(x0 + 40 + rand() * 140, y);
      x.stroke();
    }
  } else if (kind === "speckle") {
    for (let i = 0; i < 2600; i++) {
      const g = (60 + rand() * 170) | 0;
      x.fillStyle = `rgb(${g},${g},${g})`;
      x.beginPath();
      x.arc(rand() * S, rand() * S, 0.6 + rand(), 0, 7);
      x.fill();
    }
  } else if (kind === "lines") {
    x.fillStyle = "#5a5a5a";
    x.fillRect(0, 0, S, S);
    x.strokeStyle = "#d0d0d0";
    x.lineWidth = 3;
    for (let i = -S; i < S * 2; i += 10) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i + S, S);
      x.stroke();
    }
  }
  return c;
}

/** Height pattern → [normal map, roughness map]. */
function toMaps(hc: HTMLCanvasElement, strength: number) {
  const S = hc.width;
  const src = hc.getContext("2d")!.getImageData(0, 0, S, S).data;
  const nc = document.createElement("canvas");
  nc.width = nc.height = S;
  const nx = nc.getContext("2d")!;
  const out = nx.createImageData(S, S);
  const rc = document.createElement("canvas");
  rc.width = rc.height = S;
  const rx = rc.getContext("2d")!;
  const rout = rx.createImageData(S, S);
  const H = (i: number, j: number) => src[(((j + S) % S) * S + ((i + S) % S)) * 4] / 255;
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) * strength * 4;
      const dy = (H(i, j + 1) - H(i, j - 1)) * strength * 4;
      const l = Math.hypot(dx, dy, 1);
      const p = (j * S + i) * 4;
      out.data[p] = ((-dx / l) * 0.5 + 0.5) * 255;
      out.data[p + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      out.data[p + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      out.data[p + 3] = 255;
      const r = 150 + H(i, j) * 105;
      rout.data[p] = rout.data[p + 1] = rout.data[p + 2] = r;
      rout.data[p + 3] = 255;
    }
  nx.putImageData(out, 0, 0);
  rx.putImageData(rout, 0, 0);
  return [nc, rc] as const;
}

export function CubeObject() {
  const ref = useRef<HTMLDivElement>(null);
  const handle = useRef<StageHandle | null>(null);
  const { engine } = useMotion();

  useEffect(() => {
    if (!engine || !handle.current) return;
    return engine.registerStage(handle.current);
  }, [engine]);

  useEffect(() => {
    const host = ref.current!;
    const h: StageHandle = (handle.current = { el: host, orient: [0, 0, 0], lean: [0, 0] });
    let disposed = false;
    let teardown = () => {};

    void Promise.all([
      import("three"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
    ]).then(([THREE, { RoundedBoxGeometry }, { RoomEnvironment }]) => {
      if (disposed) return;
      const w = () => host.clientWidth || 1;
      const hh = () => host.clientHeight || 1;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      renderer.setSize(w(), hh());
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = styles.canvas;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, w() / hh(), 0.1, 100);
      camera.position.set(0, 0, 11);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();

      const key = new THREE.SpotLight(BRAND.keyLight, 340, 0, 0.42, 0.65, 2);
      key.position.set(5, 6.5, 6.5);
      scene.add(key, key.target);
      const rim = new THREE.DirectionalLight(BRAND.rimLight, BRAND.rimIntensity * 3);
      rim.position.set(-5, 2, -5);
      scene.add(rim);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.15));

      const disposables: { dispose(): void }[] = [envRT];
      const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o);
      const rand = rng(7);
      const maps: Record<string, [InstanceType<typeof THREE.CanvasTexture>, InstanceType<typeof THREE.CanvasTexture>]> = {};
      for (const k of PATTERNED) {
        const [n, r] = toMaps(pattern(k, rand), FINISH[k].ns!);
        const tex = (cv: HTMLCanvasElement) => {
          const t = track(new THREE.CanvasTexture(cv));
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = 4;
          return t;
        };
        maps[k] = [tex(n), tex(r)];
      }
      const mats: Record<string, InstanceType<typeof THREE.MeshPhysicalMaterial>> = {};
      const stickerMat = (fin: string, tone: number, accent: boolean) => {
        const id = fin + tone + accent;
        if (mats[id]) return mats[id];
        const F = FINISH[fin];
        const m = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(accent ? BRAND.accent : BRAND.tones[tone]),
          roughness: accent ? 0.22 : F.r,
          metalness: accent ? 0.85 : F.m,
          envMapIntensity: 0.35,
          emissive: accent ? new THREE.Color(BRAND.accent) : 0x000000,
          emissiveIntensity: accent ? 0.05 : 0,
        });
        if (maps[fin]) {
          m.normalMap = maps[fin][0];
          m.roughnessMap = maps[fin][1];
          m.normalScale = new THREE.Vector2(0.6, 0.6);
        }
        return (mats[id] = track(m));
      };
      const bodyMat = track(new THREE.MeshPhysicalMaterial({ color: BRAND.body, roughness: 0.45, metalness: 0.6, clearcoat: 0.3, envMapIntensity: 0.35 }));
      const bodyGeo = track(new RoundedBoxGeometry(0.94, 0.94, 0.94, 4, 0.08));
      const sh = new THREE.Shape();
      const a = 0.41;
      const rr = 0.07;
      sh.moveTo(-a + rr, -a);
      sh.lineTo(a - rr, -a);
      sh.quadraticCurveTo(a, -a, a, -a + rr);
      sh.lineTo(a, a - rr);
      sh.quadraticCurveTo(a, a, a - rr, a);
      sh.lineTo(-a + rr, a);
      sh.quadraticCurveTo(-a, a, -a, a - rr);
      sh.lineTo(-a, -a + rr);
      sh.quadraticCurveTo(-a, -a, -a + rr, -a);
      const stGeo = track(new THREE.ShapeGeometry(sh, 6));
      const uv = stGeo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (2 * a) + 0.5, uv.getY(i) / (2 * a) + 0.5);
      const coreGeo = track(new THREE.SphereGeometry(1.42, 32, 16));
      const coreMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));

      const root = new THREE.Group();
      const pose = new THREE.Group();
      const tumble = new THREE.Group();
      const cube = new THREE.Group();
      root.scale.setScalar(0.56);
      scene.add(root);
      root.add(pose);
      pose.add(tumble);
      tumble.add(cube);
      tumble.rotation.set(0.46, -0.62, 0);
      cube.add(new THREE.Mesh(coreGeo, coreMat));
      const FN = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ];
      const FR: [number, number, number][] = [
        [0, Math.PI / 2, 0],
        [0, -Math.PI / 2, 0],
        [-Math.PI / 2, 0, 0],
        [Math.PI / 2, 0, 0],
        [0, 0, 0],
        [0, Math.PI, 0],
      ];
      const fins = Object.keys(FINISH);
      const accentAt = new Set<number>();
      const accentN = Math.max(1, Math.round(BRAND.accentRatio * 27));
      while (accentAt.size < accentN) accentAt.add((rand() * 54) | 0);
      type Cubie = InstanceType<typeof THREE.Group>;
      const cubies: Cubie[] = [];
      let si = 0;
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          for (let z = -1; z <= 1; z++) {
            if (!x && !y && !z) continue;
            const g = new THREE.Group();
            g.position.set(x, y, z);
            g.add(new THREE.Mesh(bodyGeo, bodyMat));
            FN.forEach((n, f) => {
              if (n[0] !== x * Math.abs(n[0]) || n[1] !== y * Math.abs(n[1]) || n[2] !== z * Math.abs(n[2])) return;
              if ((n[0] && !x) || (n[1] && !y) || (n[2] && !z)) return;
              const m = new THREE.Mesh(stGeo, stickerMat(fins[(rand() * fins.length) | 0], (rand() * BRAND.tones.length) | 0, accentAt.has(si++)));
              m.position.set(n[0] * 0.471, n[1] * 0.471, n[2] * 0.471);
              m.rotation.set(...FR[f]);
              g.add(m);
            });
            cube.add(g);
            cubies.push(g);
          }

      /* ---- face turns: random moves, then replay them backwards to solve ---- */
      type Move = { axis: number; layer: number; dir: number; replay?: boolean; set?: Cubie[]; t?: number };
      const AX = ["x", "y", "z"] as const;
      const pivot = new THREE.Object3D();
      cube.add(pivot);
      const m4 = new THREE.Matrix4();
      let move: Move | null = null;
      let wait = 0.6;
      let last: Move | null = null;
      let history: Move[] = [];
      let queue: Move[] = [];
      const nextMove = (): Move => {
        if (queue.length) return queue.shift()!;
        if (history.length >= 12) {
          queue = history.reverse().map((m) => ({ ...m, dir: -m.dir, replay: true }));
          history = [];
          return queue.shift()!;
        }
        let m: Move;
        do m = { axis: (rand() * 3) | 0, layer: ((rand() * 3) | 0) - 1, dir: rand() < 0.5 ? 1 : -1 };
        while (last && m.axis === last.axis && m.layer === last.layer && m.dir === -last.dir);
        return m;
      };
      const startMove = () => {
        const m = nextMove();
        last = m;
        if (!m.replay) history.push(m);
        pivot.rotation.set(0, 0, 0);
        pivot.updateMatrixWorld();
        const k = AX[m.axis];
        m.set = cubies.filter((c) => Math.round(c.position[k]) === m.layer);
        m.set.forEach((c) => pivot.attach(c));
        m.t = 0;
        move = m;
      };
      const endMove = () => {
        const mv = move!;
        pivot.rotation[AX[mv.axis]] = (mv.dir * Math.PI) / 2;
        pivot.updateMatrixWorld();
        mv.set!.forEach((c) => {
          cube.attach(c);
          c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
          m4.makeRotationFromQuaternion(c.quaternion);
          const e = m4.elements;
          for (let i = 0; i < 16; i++) e[i] = Math.round(e[i]);
          c.quaternion.setFromRotationMatrix(m4);
        });
        pivot.rotation.set(0, 0, 0);
        move = null;
        wait = Math.max(0.05, MOVE_INTERVAL - TURN);
      };

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let mx = 0;
      let my = 0;
      let px = 0;
      let py = 0;
      let visible = true;
      let running = false;
      let raf = 0;
      const onMove = (e: PointerEvent) => {
        mx = e.clientX / innerWidth - 0.5;
        my = e.clientY / innerHeight - 0.5;
      };
      addEventListener("pointermove", onMove, { passive: true });
      const clock = new THREE.Clock();
      let t = 0;
      const render = () => renderer.render(scene, camera);
      const step = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt;
        if (move) {
          move.t! += dt / TURN;
          const p = Math.min(move.t!, 1);
          pivot.rotation[AX[move.axis]] = ((move.dir * Math.PI) / 2) * easeInOutCubic(p);
          if (p >= 1) endMove();
        } else if ((wait -= dt) <= 0) startMove();
        tumble.rotation.y += 0.12 * dt;
        tumble.rotation.x = 0.46 + Math.sin(t * 0.4) * 0.08;
        const ln = h.lean;
        px += (mx * 0.5 + ln[0] - px) * 0.06;
        py += (my * 0.5 + ln[1] - py) * 0.06;
        root.rotation.y = Math.max(-0.25, Math.min(0.25, px));
        root.rotation.x = Math.max(-0.25, Math.min(0.25, py));
        const o = h.orient;
        pose.rotation.x += (o[0] - pose.rotation.x) * 0.05;
        pose.rotation.y += (o[1] - pose.rotation.y) * 0.05;
        pose.rotation.z += (o[2] - pose.rotation.z) * 0.05;
        render();
      };
      const loop = () => {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        step();
      };
      const sync = () => {
        const go = visible && !document.hidden && !reduce;
        if (go && !running) {
          running = true;
          clock.getDelta();
          raf = requestAnimationFrame(loop);
        } else if (!go && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      };
      document.addEventListener("visibilitychange", sync);
      const io = new IntersectionObserver(
        ([en]) => {
          visible = en.isIntersecting;
          sync();
        },
        { rootMargin: "100px" },
      );
      io.observe(host);
      const ro = new ResizeObserver(() => {
        renderer.setSize(w(), hh());
        camera.aspect = w() / hh();
        camera.updateProjectionMatrix();
        if (!running) render();
      });
      ro.observe(host);
      render();
      // Fade/scale in once the first frame is drawn.
      requestAnimationFrame(() => host.classList.add(styles.cubeIn));

      teardown = () => {
        running = false;
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", sync);
        io.disconnect();
        ro.disconnect();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      teardown();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className={`${styles.host} ${styles.cube}`} />;
}

import { aurora as PALETTE } from "@/design-system/tokens";

/**
 * Ambient copper aurora: a domain-warped fbm field drawn in a full-screen
 * quad behind the whole page. Shared with the hero fluid (fluid.ts), which
 * redraws the same field inside the hero so the two line up exactly.
 */

export { PALETTE };

/** Time multiplier on real dt. */
export const SPEED = 1.62;
const DRIFT = 0.028; // t = uTime * DRIFT
const EDGE1 = [0.02, 0.3]; // primary field edge hardness
const EDGE2 = [0.05, 0.34]; // veil edge hardness
const VEIL_MIX = 0.4; // highlight mix (kept low for white-text contrast)
const GRAIN = 0.34; // mid-tone grain amplitude
const FADE = [0.02, 0.42]; // bottom fade (uv.y range)

/** Page-wide variant: lighter, larger, sparser patches; low-res and 30fps since it sits behind text. */
export const AMBIENT = { intensity: 0.7, scale: 1.8, sparse: 0.03, dpr: 0.6, fps: 30 };

/** Shared clock so the hero fluid samples the same moment of the field. */
export const auroraClock = { time: 0 };

const f = (n: number) => n.toFixed(4);

export const VERT = `attribute vec2 position; varying vec2 vUv;
void main(){ vUv = position*0.5+0.5; gl_Position = vec4(position,0.0,1.0); }`;

export const FRAG = `precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect, uDark, uI, uScale, uFade, uSparse;
uniform vec2 uMouse, uUvS, uUvO;
uniform vec3 uA, uB, uC;
vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dot(h2(i+vec2(0,0)), f-vec2(0,0)), dot(h2(i+vec2(1,0)), f-vec2(1,0)), u.x),
             mix(dot(h2(i+vec2(0,1)), f-vec2(0,1)), dot(h2(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; } return v; }
void main(){
  vec2 uv = vUv * uUvS + uUvO;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * uScale;
  float t = uTime * ${f(DRIFT)};
  vec2 warp = vec2(fbm(p*0.8 + vec2(t, -t*0.5)), fbm(p*0.8 + vec2(-t*0.6, t*0.75)));
  float f = fbm(p*1.05 + warp*1.15 + uMouse*0.18);
  float g = fbm(p*0.62 - warp*0.75 + vec2(t*0.4, t*0.22));
  // second, independent layer: rotated + offset domain (no mirroring) so patches fall randomly but evenly
  vec2 q = mat2(0.80, -0.60, 0.60, 0.80) * p + vec2(7.31, -3.17);
  vec2 warpQ = vec2(fbm(q*0.8 + vec2(-t*0.7, t*0.45)), fbm(q*0.8 + vec2(t*0.55, -t*0.8)));
  float f2 = fbm(q*1.12 + warpQ*1.15 + vec2(2.9, 5.4) - uMouse*0.18);
  float g2 = fbm(q*0.66 - warpQ*0.75 + vec2(-4.2 - t*0.36, 1.7 + t*0.26));
  float m1 = max(smoothstep(${f(EDGE1[0])}+uSparse, ${f(EDGE1[1])}+uSparse, f), smoothstep(${f(EDGE1[0])}+uSparse, ${f(EDGE1[1])}+uSparse, f2));
  float m2 = max(smoothstep(${f(EDGE2[0])}+uSparse, ${f(EDGE2[1])}+uSparse, g), smoothstep(${f(EDGE2[0])}+uSparse, ${f(EDGE2[1])}+uSparse, g2));
  vec3 col = mix(uB, uA, m1);
  col = mix(col, uC, m2 * ${f(VEIL_MIX)});
  col *= max(m1, m2 * 0.8);
  float n = fract(sin(dot(floor(uv*vec2(1600.0, 900.0)), vec2(12.9898,78.233)))*43758.5453);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += (n - 0.5) * (${f(GRAIN)} * (1.0 - abs(lum*2.0 - 1.0)));
  float body = mix(1.0, smoothstep(${f(FADE[0])}, ${f(FADE[1])}, uv.y), uFade) * uI;
  float a = clamp(max(m1, m2) * body * (0.55 + 0.45*uDark) + (n - 0.5) * 0.06 * body, 0.0, 1.0);
  gl_FragColor = vec4(max(col, vec3(0.0)) * a, a);
}`;

export const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

/**
 * Mounts the fixed page-wide aurora into `host`. Draws once and stops under
 * reduced motion; pauses off-screen; falls back to a static gradient without
 * WebGL. Returns a teardown.
 */
export function mountAmbientAurora(host: HTMLElement) {
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", pointerEvents: "none" });
  host.appendChild(cv);

  let gl: WebGLRenderingContext | null = null;
  let prog: WebGLProgram | null = null;
  let buf: WebGLBuffer | null = null;
  let u: Record<"time" | "aspect" | "mouse", WebGLUniformLocation | null> | null = null;
  let raf = 0;
  let running = false;
  let ro: ResizeObserver | null = null;
  let io: IntersectionObserver | null = null;
  let rt: ReturnType<typeof setTimeout> | undefined;

  const fallback = () => {
    host.style.background = "radial-gradient(70% 60% at 50% 20%, rgba(140,74,34,.35), rgba(11,10,10,0) 70%)";
  };
  const draw = () => {
    if (!gl || !u) return;
    gl.uniform2f(u.mouse, 0, 0);
    gl.uniform1f(u.time, auroraClock.time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const start = () => {
    if (running) return;
    running = true;
    let last = 0;
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (last && now - last < 1000 / AMBIENT.fps - 2) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      auroraClock.time += dt * SPEED;
      draw();
    };
    raf = requestAnimationFrame(frame);
  };

  const setup = () => {
    gl = cv.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) return fallback();
    const g = gl;
    try {
      const sh = (type: number, src: string) => {
        const s = g.createShader(type)!;
        g.shaderSource(s, src);
        g.compileShader(s);
        if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || "shader");
        return s;
      };
      prog = g.createProgram()!;
      g.attachShader(prog, sh(g.VERTEX_SHADER, VERT));
      g.attachShader(prog, sh(g.FRAGMENT_SHADER, FRAG));
      g.linkProgram(prog);
      g.useProgram(prog);
      buf = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(prog, "position");
      g.enableVertexAttribArray(loc);
      g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      const U = (n: string) => g.getUniformLocation(prog!, n);
      u = { time: U("uTime"), aspect: U("uAspect"), mouse: U("uMouse") };
      g.uniform2f(U("uUvS"), 1, 1);
      g.uniform2f(U("uUvO"), 0, 0);
      g.uniform1f(U("uI"), AMBIENT.intensity);
      g.uniform1f(U("uScale"), AMBIENT.scale);
      g.uniform1f(U("uFade"), 0);
      g.uniform1f(U("uSparse"), AMBIENT.sparse);
      g.uniform3fv(U("uA"), hex(PALETTE.primary));
      g.uniform3fv(U("uB"), hex(PALETTE.base));
      g.uniform3fv(U("uC"), hex(PALETTE.highlight));
      g.uniform1f(U("uDark"), 1);
    } catch (err) {
      console.warn("aurora", err);
      return fallback();
    }

    const resize = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height || !gl || !u) return;
      cv.width = Math.round(r.width * AMBIENT.dpr);
      cv.height = Math.round(r.height * AMBIENT.dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform1f(u.aspect, r.width / r.height);
      if (!running) draw();
    };
    resize();
    ro?.disconnect();
    ro = new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(resize, 120);
    });
    ro.observe(host);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return draw();
    io?.disconnect();
    io = new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { rootMargin: "200px" });
    io.observe(host);
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
  };
  cv.addEventListener("webglcontextlost", onLost);
  cv.addEventListener("webglcontextrestored", setup);
  setup();

  return () => {
    stop();
    clearTimeout(rt);
    io?.disconnect();
    ro?.disconnect();
    cv.removeEventListener("webglcontextlost", onLost);
    cv.removeEventListener("webglcontextrestored", setup);
    if (gl) {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    cv.remove();
    host.style.background = "";
  };
}

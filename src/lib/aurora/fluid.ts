import { AMBIENT, FRAG, PALETTE, VERT, auroraClock, hex } from "./aurora";

/**
 * Cursor-reactive stable-fluids distortion for the hero (WebGL2).
 * One canvas renders the aurora field (into an RGBA8 target) plus the hero
 * name (drawn into a 2D canvas texture), both displaced by the velocity
 * field, with an RGB split for aberration and copper dye added as smoke.
 * Pipeline: splat → curl → vorticity → divergence → Jacobi pressure →
 * gradient subtract → advect velocity → advect dye.
 *
 * The real DOM text stays in place (colour: transparent) for selection,
 * SEO and screen readers. Lazy-loaded after first paint by <HeroFluid>.
 *
 * Budget: < 2 ms GPU/frame at 1080p on a mid-range laptop. Paused off-screen
 * and in hidden tabs; skipped on ≤ 4 cores, without WebGL2, or with reduced
 * motion.
 */

export const FLUID_DEFAULTS = {
  simRes: 256,
  dyeRes: 512,
  pressureIters: 20,
  curl: 30,
  splatRadius: 12,
  splatForce: 30,
  velocityDissipation: 2.8,
  dyeDissipation: 7.0,
  distortion: 0.75,
  aberration: 0.35,
  smoke: 0.12,
  touchForce: 0.4,
  sceneScale: 0.8,
};
export type FluidConfig = typeof FLUID_DEFAULTS;

const DYE: [number, number, number] = [0.784, 0.529, 0.353]; // copper
const BG = hex(PALETTE.base);
const TEXT_SEL = "[data-hname]";
const TEXT_SKIP = "[data-hcopy]";
const STRETCH: Record<number, string> = {
  50: "ultra-condensed",
  62.5: "extra-condensed",
  75: "condensed",
  87.5: "semi-condensed",
  100: "normal",
  112.5: "semi-expanded",
  125: "expanded",
  150: "extra-expanded",
  200: "ultra-expanded",
};

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number; texel: [number, number] };
type DoubleTarget = { read: Target; write: Target; swap(): void };

/** Mounts the fluid into `host`. Returns a teardown, or null when the device or browser can't run it. */
export function mountFluid(host: HTMLElement, overrides: Partial<FluidConfig> = {}): (() => void) | null {
  if ((navigator.hardwareConcurrency || 8) <= 4) return null;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const CFG: FluidConfig = { ...FLUID_DEFAULTS, ...overrides };

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", pointerEvents: "none" });
  const maybeGl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  if (!maybeGl) return null;
  const gl: WebGL2RenderingContext = maybeGl;
  const hasFloatRT = !!gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("OES_texture_float_linear");

  const VS = `#version 300 es
in vec2 aPos; uniform vec2 uTexel; out vec2 vUv, vL, vR, vT, vB;
void main(){ vUv=aPos*.5+.5; vL=vUv-vec2(uTexel.x,0.); vR=vUv+vec2(uTexel.x,0.);
  vT=vUv+vec2(0.,uTexel.y); vB=vUv-vec2(0.,uTexel.y); gl_Position=vec4(aPos,0.,1.); }`;
  const H = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 o;\n`;
  const FS = {
    splat:
      H +
      `uniform sampler2D uTarget; uniform float uAspect, uRadius; uniform vec3 uColor; uniform vec2 uPoint;
      void main(){ vec2 p=vUv-uPoint; p.x*=uAspect; o=vec4(texture(uTarget,vUv).rgb+exp(-dot(p,p)/uRadius)*uColor,1.); }`,
    advect:
      H +
      `uniform sampler2D uVelocity, uSource; uniform vec2 uSimTexel; uniform float uDt, uDecay;
      void main(){ vec2 c=vUv-uDt*texture(uVelocity,vUv).xy*uSimTexel; o=texture(uSource,c)/(1.+uDecay*uDt); }`,
    divergence:
      H +
      `uniform sampler2D uVelocity;
      void main(){ vec2 C=texture(uVelocity,vUv).xy; float L=texture(uVelocity,vL).x, R=texture(uVelocity,vR).x;
        float T=texture(uVelocity,vT).y, B=texture(uVelocity,vB).y;
        if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
        o=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
    curl:
      H +
      `uniform sampler2D uVelocity;
      void main(){ float L=texture(uVelocity,vL).y, R=texture(uVelocity,vR).y, T=texture(uVelocity,vT).x, B=texture(uVelocity,vB).x;
        o=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
    vorticity:
      H +
      `uniform sampler2D uVelocity, uCurl; uniform float uCurlAmt, uDt;
      void main(){ float L=texture(uCurl,vL).x, R=texture(uCurl,vR).x, T=texture(uCurl,vT).x, B=texture(uCurl,vB).x, C=texture(uCurl,vUv).x;
        vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+1e-4; f*=uCurlAmt*C; f.y*=-1.;
        o=vec4(clamp(texture(uVelocity,vUv).xy+f*uDt,-1000.,1000.),0.,1.); }`,
    pressure:
      H +
      `uniform sampler2D uPressure, uDivergence;
      void main(){ float L=texture(uPressure,vL).x, R=texture(uPressure,vR).x, T=texture(uPressure,vT).x, B=texture(uPressure,vB).x;
        o=vec4((L+R+B+T-texture(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
    gradient:
      H +
      `uniform sampler2D uPressure, uVelocity;
      void main(){ float L=texture(uPressure,vL).x, R=texture(uPressure,vR).x, T=texture(uPressure,vT).x, B=texture(uPressure,vB).x;
        o=vec4(texture(uVelocity,vUv).xy-vec2(R-L,T-B),0.,1.); }`,
    scale: H + `uniform sampler2D uTex; uniform float uValue; void main(){ o=texture(uTex,vUv)*uValue; }`,
    display:
      H +
      `uniform sampler2D uScene, uText, uVelocity, uDye;
      uniform float uDistort, uAberr, uSmoke, uTA, uInvS; uniform vec2 uSimTexel, uCss, uRestC, uCurC; uniform vec3 uBg;
      vec2 tmap(vec2 uv){ vec2 pc=vec2(uv.x,1.-uv.y)*uCss; vec2 l=uRestC+(pc-uCurC)*uInvS; return vec2(l.x/uCss.x,1.-l.y/uCss.y); }
      void main(){
        vec2 off=texture(uVelocity,vUv).xy*uSimTexel*.035*uDistort;
        vec2 uR=vUv-off*(1.+uAberr), uG=vUv-off, uB=vUv-off*(1.-uAberr);
        vec4 sR=texture(uScene,uR), sG=texture(uScene,uG), sB=texture(uScene,uB);
        vec3 col=uBg*(1.-sG.a)+vec3(sR.r,sG.g,sB.b);
        vec4 tR=texture(uText,tmap(uR)), tG=texture(uText,tmap(uG)), tB=texture(uText,tmap(uB));
        col=col*(1.-tG.a*uTA)+vec3(tR.r,tG.g,tB.b)*uTA;
        vec3 dye=texture(uDye,vUv).rgb; col+=dye*uSmoke; col=col/(1.+max(dye.r,0.)*.15*uSmoke);
        o=vec4(col,1.); }`,
  };

  const shaders: WebGLShader[] = [];
  const progs: WebGLProgram[] = [];
  const texes: WebGLTexture[] = [];
  const fbs: WebGLFramebuffer[] = [];
  function compile(type: number, src: string) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    shaders.push(s);
    return s;
  }
  function program(vs: string | WebGLShader, fsSrc: string, attr: string): Prog {
    const p = gl.createProgram()!;
    gl.attachShader(p, typeof vs === "string" ? compile(gl.VERTEX_SHADER, vs) : vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, attr);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    const u: Prog["u"] = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
    }
    progs.push(p);
    return { p, u };
  }
  let P: Record<keyof typeof FS, Prog>;
  let AP: Prog;
  try {
    const vs = compile(gl.VERTEX_SHADER, VS);
    P = Object.fromEntries(Object.entries(FS).map(([k, v]) => [k, program(vs, v, "aPos")])) as Record<keyof typeof FS, Prog>;
    AP = program(VERT, FRAG, "position");
  } catch (e) {
    console.warn("fluid", e);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const FMT = hasFloatRT ? { i: gl.RGBA16F, t: gl.HALF_FLOAT } : { i: gl.RGBA8, t: gl.UNSIGNED_BYTE };
  function fbo(w: number, h: number, filter: number = gl.LINEAR, fmt = FMT): Target {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.i, w, h, 0, gl.RGBA, fmt.t, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, fmt === FMT ? 1 : 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    texes.push(tex);
    fbs.push(fb);
    return { tex, fb, w, h, texel: [1 / w, 1 / h] };
  }
  const double = (w: number, h: number, filter?: number): DoubleTarget => {
    let a = fbo(w, h, filter);
    let b = fbo(w, h, filter);
    return {
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        [a, b] = [b, a];
      },
    };
  };
  function res(r: number): [number, number] {
    const ar = canvas.width / canvas.height;
    const lo = Math.round(r);
    const hi = Math.round(r * Math.max(ar, 1 / ar));
    return ar > 1 ? [hi, lo] : [lo, hi];
  }
  function freeTargets() {
    texes.splice(0).forEach((t) => gl.deleteTexture(t));
    fbs.splice(0).forEach((f) => gl.deleteFramebuffer(f));
  }

  let velocity: DoubleTarget, dye: DoubleTarget, divergence: Target, curlT: Target, pressure: DoubleTarget, scene: Target;
  let sim: [number, number] = [1, 1];
  function initTargets() {
    freeTargets();
    sim = res(CFG.simRes);
    const d = res(CFG.dyeRes);
    velocity = double(...sim);
    dye = double(...d);
    divergence = fbo(...sim, gl.NEAREST);
    curlT = fbo(...sim, gl.NEAREST);
    pressure = double(...sim, gl.NEAREST);
    const s = (CFG.sceneScale * Math.min(devicePixelRatio || 1, 1.25)) / Math.min(devicePixelRatio || 1, 2);
    scene = fbo(Math.max(1, Math.round(canvas.width * s)), Math.max(1, Math.round(canvas.height * s)), gl.LINEAR, { i: gl.RGBA8, t: gl.UNSIGNED_BYTE });
    textTex = makeTextTex();
  }

  /* ---- hero text → texture ---- */
  const tc = document.createElement("canvas");
  const tctx = tc.getContext("2d")!;
  let textTex: WebGLTexture | null = null;
  let textReady = false;
  let rest: { cx: number; cy: number; w: number } | null = null;
  let hidden: HTMLElement[] = [];
  function makeTextTex() {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    texes.push(t);
    return t;
  }
  /** Paints every glyph of the hero name into the text texture at its resting position, then hides the DOM glyphs. */
  function snapshot() {
    const el = document.querySelector<HTMLElement>(TEXT_SEL);
    if (!el || !textReady) return;
    const cr = canvas.getBoundingClientRect();
    if (!cr.width) return;
    const prevT = el.style.transform;
    el.style.transform = "none";
    const r = el.getBoundingClientRect();
    rest = { cx: r.left + r.width / 2 - cr.left, cy: r.top + r.height / 2 - cr.top, w: r.width };
    tc.width = canvas.width;
    tc.height = canvas.height;
    tctx.setTransform(canvas.width / cr.width, 0, 0, canvas.height / cr.height, 0, 0);
    tctx.clearRect(0, 0, cr.width, cr.height);
    tctx.textBaseline = "alphabetic";
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const parents = new Set<HTMLElement>();
    for (let n: Node | null; (n = walk.nextNode()); ) {
      const par = n.parentElement;
      if (!par || par.closest(TEXT_SKIP) || !n.nodeValue?.trim()) continue;
      const cs = getComputedStyle(par);
      if (!par.dataset.fc) par.dataset.fc = cs.color;
      tctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const c2 = tctx as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
      if ("fontStretch" in c2) c2.fontStretch = (STRETCH[parseFloat(cs.fontStretch)] || "normal") as CanvasFontStretch;
      if ("letterSpacing" in c2) c2.letterSpacing = "0px";
      tctx.fillStyle = par.dataset.fc;
      const tt = cs.textTransform;
      const txt = n.nodeValue;
      for (let i = 0; i < txt.length; i++) {
        if (!txt[i].trim()) continue;
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const b = range.getBoundingClientRect();
        if (!b.width) continue;
        const ch = tt === "uppercase" ? txt[i].toUpperCase() : tt === "lowercase" ? txt[i].toLowerCase() : txt[i];
        const m = tctx.measureText(ch);
        const asc = m.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.8;
        tctx.fillText(ch, b.left - cr.left, b.top - cr.top + asc);
      }
      parents.add(par);
    }
    el.style.transform = prevT;
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    parents.forEach((p) => (p.style.color = "transparent"));
    hidden = [...parents];
  }
  function restoreText() {
    hidden.forEach((p) => (p.style.color = ""));
    hidden = [];
  }

  /* ---- passes ---- */
  let unit = 0;
  const bind = (prog: Prog) => {
    gl.useProgram(prog.p);
    unit = 0;
    return prog;
  };
  const tex = (prog: Prog, name: string, t: WebGLTexture | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(prog.u[name], unit++);
  };
  function blit(target: Target | null, texel: [number, number] | null, prog?: Prog) {
    const loc = prog && prog.u.uTexel;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
      if (loc) gl.uniform2fv(loc, texel || target.texel);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (loc) gl.uniform2fv(loc, texel || [1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function splat(x: number, y: number, dx: number, dy: number, color: number[]) {
    const aspect = canvas.width / canvas.height;
    const r = Math.pow(CFG.splatRadius / sim[1], 2);
    let p = bind(P.splat);
    tex(p, "uTarget", velocity.read.tex);
    gl.uniform1f(p.u.uAspect, aspect);
    gl.uniform1f(p.u.uRadius, r);
    gl.uniform2f(p.u.uPoint, x, y);
    gl.uniform3f(p.u.uColor, dx, dy, 0);
    blit(velocity.write, null, p);
    velocity.swap();
    p = bind(P.splat);
    tex(p, "uTarget", dye.read.tex);
    gl.uniform1f(p.u.uAspect, aspect);
    gl.uniform1f(p.u.uRadius, r * 1.4);
    gl.uniform2f(p.u.uPoint, x, y);
    gl.uniform3f(p.u.uColor, color[0], color[1], color[2]);
    blit(dye.write, null, p);
    dye.swap();
  }
  function step(dt: number) {
    let p = bind(P.curl);
    tex(p, "uVelocity", velocity.read.tex);
    blit(curlT, null, p);
    p = bind(P.vorticity);
    tex(p, "uVelocity", velocity.read.tex);
    tex(p, "uCurl", curlT.tex);
    gl.uniform1f(p.u.uCurlAmt, CFG.curl);
    gl.uniform1f(p.u.uDt, dt);
    blit(velocity.write, null, p);
    velocity.swap();
    p = bind(P.divergence);
    tex(p, "uVelocity", velocity.read.tex);
    blit(divergence, null, p);
    p = bind(P.scale);
    tex(p, "uTex", pressure.read.tex);
    gl.uniform1f(p.u.uValue, 0.8);
    blit(pressure.write, null, p);
    pressure.swap();
    p = bind(P.pressure);
    tex(p, "uDivergence", divergence.tex);
    for (let i = 0; i < CFG.pressureIters; i++) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      gl.uniform1i(p.u.uPressure, unit);
      blit(pressure.write, null, p);
      pressure.swap();
    }
    p = bind(P.gradient);
    tex(p, "uPressure", pressure.read.tex);
    tex(p, "uVelocity", velocity.read.tex);
    blit(velocity.write, null, p);
    velocity.swap();
    p = bind(P.advect);
    tex(p, "uVelocity", velocity.read.tex);
    tex(p, "uSource", velocity.read.tex);
    gl.uniform2fv(p.u.uSimTexel, velocity.read.texel);
    gl.uniform1f(p.u.uDt, dt);
    gl.uniform1f(p.u.uDecay, CFG.velocityDissipation);
    blit(velocity.write, null, p);
    velocity.swap();
    p = bind(P.advect);
    tex(p, "uVelocity", velocity.read.tex);
    tex(p, "uSource", dye.read.tex);
    gl.uniform2fv(p.u.uSimTexel, velocity.read.texel);
    gl.uniform1f(p.u.uDt, dt);
    gl.uniform1f(p.u.uDecay, CFG.dyeDissipation);
    blit(dye.write, dye.read.texel, p);
    dye.swap();
  }
  /** Redraws the page-wide aurora for just the hero's rectangle, in viewport space, at the shared clock. */
  function renderScene() {
    const p = bind(AP);
    const vw = innerWidth;
    const vh = innerHeight;
    const cr = rect;
    gl.uniform2f(p.u.uUvS, cr.width / vw, cr.height / vh);
    gl.uniform2f(p.u.uUvO, cr.left / vw, (vh - cr.bottom) / vh);
    gl.uniform1f(p.u.uTime, auroraClock.time);
    gl.uniform1f(p.u.uAspect, vw / vh);
    gl.uniform1f(p.u.uDark, 1);
    gl.uniform2f(p.u.uMouse, 0, 0);
    gl.uniform1f(p.u.uI, AMBIENT.intensity);
    gl.uniform1f(p.u.uScale, AMBIENT.scale);
    gl.uniform1f(p.u.uFade, 0);
    gl.uniform1f(p.u.uSparse, AMBIENT.sparse);
    gl.uniform3fv(p.u.uA, hex(PALETTE.primary));
    gl.uniform3fv(p.u.uB, hex(PALETTE.base));
    gl.uniform3fv(p.u.uC, hex(PALETTE.highlight));
    blit(scene, null, p);
  }
  const nameEl = () => document.querySelector<HTMLElement>(TEXT_SEL);
  function render(cr: DOMRect) {
    const p = bind(P.display);
    tex(p, "uScene", scene.tex);
    tex(p, "uText", textTex);
    tex(p, "uVelocity", velocity.read.tex);
    tex(p, "uDye", dye.read.tex);
    gl.uniform1f(p.u.uDistort, CFG.distortion);
    gl.uniform1f(p.u.uAberr, CFG.aberration);
    gl.uniform1f(p.u.uSmoke, CFG.smoke);
    gl.uniform2fv(p.u.uSimTexel, velocity.read.texel);
    gl.uniform3fv(p.u.uBg, BG);
    gl.uniform2f(p.u.uCss, cr.width, cr.height);
    let ta = 0;
    const e = rest && nameEl();
    if (e && rest) {
      // Follow the name's scroll parallax (transform/opacity set by the motion engine).
      const r = e.getBoundingClientRect();
      ta = parseFloat(e.style.opacity || "1");
      gl.uniform2f(p.u.uRestC, rest.cx, rest.cy);
      gl.uniform2f(p.u.uCurC, r.left + r.width / 2 - cr.left, r.top + r.height / 2 - cr.top);
      gl.uniform1f(p.u.uInvS, rest.w / Math.max(1, r.width));
    }
    gl.uniform1f(p.u.uTA, ta);
    blit(null, null, p);
  }

  /* ---- pointer ---- */
  const ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, init: false, touch: false };
  let rect = canvas.getBoundingClientRect();
  const onMove = (e: PointerEvent) => {
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      ptr.init = false;
      return;
    }
    if (!ptr.init) {
      ptr.px = x;
      ptr.py = y;
      ptr.init = true;
    }
    ptr.x = x;
    ptr.y = y;
    ptr.moved = true;
    ptr.touch = e.pointerType === "touch";
  };
  const onLeave = () => {
    ptr.init = false;
  };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  /* ---- size ---- */
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width * dpr));
    const h = Math.max(1, Math.floor(r.height * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    initTargets();
    snapshot();
  }
  let rt: ReturnType<typeof setTimeout> | undefined;
  const ro = new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });

  /* ---- loop ---- */
  let raf = 0;
  let last = 0;
  let running = false;
  let visible = true;
  let dead = false;
  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    rect = canvas.getBoundingClientRect();
    if (ptr.moved) {
      const dx = ptr.x - ptr.px;
      const dy = ptr.y - ptr.py;
      if (dx || dy) {
        const k = CFG.splatForce * sim[1] * 2 * (ptr.touch ? CFG.touchForce : 1);
        const spd = Math.min(Math.hypot(dx, dy) * 40, 1);
        splat(ptr.x, ptr.y, dx * k, dy * k, DYE.map((c) => c * spd * 0.6));
      }
      ptr.px = ptr.x;
      ptr.py = ptr.y;
      ptr.moved = false;
    }
    step(dt);
    renderScene();
    render(rect);
  }
  const sync = () => {
    const go = visible && !document.hidden && !dead;
    if (go && !running) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };
  const io = new IntersectionObserver(
    (e) => {
      visible = e[0].isIntersecting;
      sync();
    },
    { rootMargin: "200px" },
  );
  const onVis = () => sync();
  document.addEventListener("visibilitychange", onVis);

  /* ---- hand-off: wait for the preloader and intro, then move the name into the canvas ---- */
  let calm = 0;
  let handoffT: ReturnType<typeof setTimeout> | undefined;
  function tryHandoff() {
    if (dead) return;
    const e = nameEl();
    const pre = document.querySelector<HTMLElement>("[data-pre]");
    const preOn = !!pre && getComputedStyle(pre).display !== "none" && pre.offsetParent !== null;
    const busy = e && e.getAnimations ? e.getAnimations({ subtree: true }).length : 0;
    calm = !e || preOn || busy ? 0 : calm + 1;
    if (calm < 2) {
      handoffT = setTimeout(tryHandoff, 300);
      return;
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      if (dead) return;
      textReady = true;
      snapshot();
    });
  }

  function dispose() {
    if (dead) return;
    dead = true;
    sync();
    ro.disconnect();
    io.disconnect();
    clearTimeout(rt);
    clearTimeout(handoffT);
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onMove);
    document.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVis);
    restoreText();
    if (!gl.isContextLost()) {
      freeTargets();
      progs.forEach((p) => gl.deleteProgram(p));
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteBuffer(vbo);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    canvas.remove();
  }
  // On context loss, give the hero back to the page-wide aurora behind it.
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dispose();
  });

  /* ---- start ---- */
  host.appendChild(canvas);
  resize();
  rect = canvas.getBoundingClientRect();
  renderScene();
  step(1 / 60);
  render(canvas.getBoundingClientRect());
  ro.observe(host);
  io.observe(host);
  tryHandoff();
  return dispose;
}

import type { Color, IUniform, WebGLProgramParametersWithUniforms } from "three";

/**
 * onBeforeCompile hook that adds a fresnel rim of `rimColor` on top of a
 * MeshStandardMaterial. `normalExpr` is the GLSL normal to use, `power` the
 * falloff, and `strength` either a constant or a shared uniform.
 */
export function rimShader(rimColor: Color, normalExpr: string, power: number, strength: number | IUniform<number>) {
  const uniform = typeof strength !== "number";
  return (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.rimColor = { value: rimColor };
    if (uniform) s.uniforms.glow = strength;
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 rimColor;" + (uniform ? "\nuniform float glow;" : ""))
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
            float fr = pow(1.0 - clamp(dot(${normalExpr}, normalize(vViewPosition)), 0.0, 1.0), ${power.toFixed(1)});
            gl_FragColor.rgb += rimColor * fr * ${uniform ? "glow" : strength.toFixed(1)};`,
      );
  };
}

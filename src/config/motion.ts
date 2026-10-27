/** Feature switches for the motion layer (mirrors the design's "Motion" props). */
export const motionSettings = {
  /** Soft smoke trail following the pointer. */
  cometTail: true,
  /** Copper grain particles shed by the hero lens. */
  goldGrain: true,
  /** Liquid lens distortion over the hero name. */
  lensHover: true,
  /** Preloader count-up and hero entrance. */
  intro: true,
  /** Scroll reveals, counters, parallax. Also gated by prefers-reduced-motion. */
  reveal: true,
  /** Rotating seal cursor. When off, a static seal is shown in the hero. */
  sealCursor: true,
  /** Spin the seal badges. */
  spinBadge: true,
};

export type MotionSettings = typeof motionSettings;

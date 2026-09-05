/**
 * Liquid glass refraction following kube.io:
 * convex squircle bezel → Snell's law → R/G displacement map + specular rim.
 * @see https://kube.io/blog/liquid-glass-css-svg/
 */

const N_AIR = 1;
const N_GLASS = 1.5;

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

/** Convex squircle height — Apple-favored soft bezel profile. x ∈ [0, 1]. */
function squircleHeight(x) {
  const t = clamp(x, 0, 1);
  return (1 - (1 - t) ** 4) ** 0.25;
}

/**
 * Background-plane displacement for a ray at normalized bezel coordinate
 * (0 = outer rim, 1 = start of flat interior).
 */
function refractionDisplacement(x, glassThickness) {
  const delta = 0.001;
  const derivative =
    (squircleHeight(x + delta) - squircleHeight(x - delta)) / (2 * delta);
  const incidence = Math.atan(derivative);
  const sinT = clamp((N_AIR / N_GLASS) * Math.sin(incidence), -1, 1);
  const refracted = Math.asin(sinT);
  return Math.tan(incidence - refracted) * glassThickness;
}

/**
 * Inside distance to the capsule border + inward unit normal.
 * Positive d = pixels inside the rounded rect from the outer edge.
 */
function capsuleField(px, py, width, height, radius) {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const cx = px - hw;
  const cy = py - hh;
  const r = Math.min(radius, hw - 0.5, hh - 0.5);

  const ax = Math.abs(cx);
  const ay = Math.abs(cy);
  const ix = hw - r;
  const iy = hh - r;

  if (ax > ix && ay > iy) {
    // Corner quarter-circle
    const dx = ax - ix;
    const dy = ay - iy;
    const len = Math.hypot(dx, dy) || 1;
    return {
      d: r - len,
      nx: (-Math.sign(cx) * dx) / len,
      ny: (-Math.sign(cy) * dy) / len,
    };
  }

  if (ax - ix > ay - iy) {
    return { d: hw - ax, nx: cx >= 0 ? -1 : 1, ny: 0 };
  }

  return { d: hh - ay, nx: 0, ny: cy >= 0 ? -1 : 1 };
}

function precomputeBezel(bezelWidth, glassThickness, samples = 127) {
  const magnitudes = new Float32Array(samples);
  let maximumDisplacement = 0;
  for (let i = 0; i < samples; i += 1) {
    const x = i / (samples - 1);
    // Scale optical path by bezel so thicker bezels bend more
    const m = refractionDisplacement(x, glassThickness) * (bezelWidth / 12);
    magnitudes[i] = m;
    if (m > maximumDisplacement) maximumDisplacement = m;
  }
  return { magnitudes, maximumDisplacement, samples };
}

function specularAlpha(nx, ny, t, lightAngleDeg, opacity) {
  const light = (lightAngleDeg * Math.PI) / 180;
  const ndotl = Math.max(0, nx * Math.cos(light) + ny * Math.sin(light));
  const rim = (1 - t) ** 1.25;
  return clamp(ndotl ** 3.2 * rim * opacity, 0, 1);
}

/**
 * @param {{
 *   width: number,
 *   height: number,
 *   borderRadius: number,
 *   bezelWidth?: number,
 *   glassThickness?: number,
 *   specularOpacity?: number,
 *   lightAngle?: number,
 * }} opts
 */
export function buildLiquidGlassMaps({
  width,
  height,
  borderRadius,
  bezelWidth = 16,
  glassThickness = 28,
  specularOpacity = 0.72,
  lightAngle = -58,
}) {
  const w = Math.max(2, Math.round(width));
  const h = Math.max(2, Math.round(height));
  const radius = Math.min(borderRadius, w * 0.5, h * 0.5);
  const bezel = Math.min(bezelWidth, Math.min(w, h) * 0.48);

  const { magnitudes, maximumDisplacement, samples } = precomputeBezel(
    bezel,
    glassThickness,
  );
  const maxD = Math.max(maximumDisplacement, 1);

  const disp = document.createElement("canvas");
  disp.width = w;
  disp.height = h;
  const dctx = disp.getContext("2d", { willReadFrequently: true });
  const dimg = dctx.createImageData(w, h);

  const spec = document.createElement("canvas");
  spec.width = w;
  spec.height = h;
  const sctx = spec.getContext("2d", { willReadFrequently: true });
  const simg = sctx.createImageData(w, h);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const { d, nx, ny } = capsuleField(x + 0.5, y + 0.5, w, h, radius);
      const i = (y * w + x) * 4;

      // Neutral (no displacement)
      dimg.data[i] = 128;
      dimg.data[i + 1] = 128;
      dimg.data[i + 2] = 128;
      dimg.data[i + 3] = 255;
      simg.data[i] = 255;
      simg.data[i + 1] = 255;
      simg.data[i + 2] = 255;
      simg.data[i + 3] = 0;

      if (d < 0 || d > bezel) continue;

      const t = d / bezel;
      const idx = Math.min(samples - 1, Math.round(t * (samples - 1)));
      // Normalize magnitude to [0, 1] — feDisplacementMap scale restores pixels
      const mag = magnitudes[idx] / maxD;
      const dx = nx * mag;
      const dy = ny * mag;

      dimg.data[i] = clamp(Math.round(128 + dx * 127), 0, 255);
      dimg.data[i + 1] = clamp(Math.round(128 + dy * 127), 0, 255);

      const a = specularAlpha(nx, ny, t, lightAngle, specularOpacity);
      simg.data[i + 3] = clamp(Math.round(a * 255), 0, 255);
    }
  }

  dctx.putImageData(dimg, 0, 0);
  sctx.putImageData(simg, 0, 0);

  return {
    displacementMapUrl: disp.toDataURL("image/png"),
    specularMapUrl: spec.toDataURL("image/png"),
    // Stronger scale so bezel refraction reads clearly over listing photos
    scale: Math.min(110, Math.max(36, maxD * 1.75)),
    width: w,
    height: h,
  };
}

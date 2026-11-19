"use client";

import React, { useEffect, useRef } from "react";

// Slices of 1600x905 image: [x, y, w, h] as fractions
const SLICES = {
  LA: [0, 0.06, 0.47, 0.4],
  RA: [0.53, 0.06, 0.47, 0.4],
  LB: [0, 0.55, 0.47, 0.4],
  RB: [0.53, 0.55, 0.47, 0.4],
};

const REMOTE_URL =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85";
const LOCAL_FALLBACK = "/assets/hands_sheet.webp";

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function smooth(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function mixAt(t: number, on: number, off: number, dur: number): number {
  return smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));
}

function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const LEVELS = [0, 0.26, 0.52, 0.78, 1];

export function DotMatrixHandsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number;
    let t0 = performance.now();
    let isDestroyed = false;

    // Load source sheet
    const img = new Image();
    img.crossOrigin = "anonymous";

    let tiles: {
      LA: HTMLCanvasElement;
      RA: HTMLCanvasElement;
      LB: HTMLCanvasElement;
      RB: HTMLCanvasElement;
    } | null = null;

    let fA: HTMLCanvasElement | null = null;
    let fB: HTMLCanvasElement | null = null;
    let ctxA: CanvasRenderingContext2D | null = null;
    let ctxB: CanvasRenderingContext2D | null = null;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let step = 7;
    let rowStep = 14;
    let R = 3;
    let DPR = 1;
    let isPortrait = false;

    const onImageLoaded = () => {
      if (isDestroyed) return;
      const nw = img.naturalWidth || 1600;
      const nh = img.naturalHeight || 905;

      // Slice into 4 pre-downscaled tiles, 420px wide each
      const targetW = 420;
      tiles = {
        LA: createTile(img, SLICES.LA, nw, nh, targetW),
        RA: createTile(img, SLICES.RA, nw, nh, targetW),
        LB: createTile(img, SLICES.LB, nw, nh, targetW),
        RB: createTile(img, SLICES.RB, nw, nh, targetW),
      };

      setupSize();
      requestAnimationFrame(loop);
    };

    img.onload = onImageLoaded;
    img.onerror = () => {
      // If external fails, use local cached asset
      if (img.src !== LOCAL_FALLBACK && !img.src.endsWith(LOCAL_FALLBACK)) {
        img.src = LOCAL_FALLBACK;
      }
    };
    img.src = REMOTE_URL;

    function createTile(
      sourceImg: HTMLImageElement,
      rect: number[],
      nw: number,
      nh: number,
      targetW: number
    ): HTMLCanvasElement {
      const [rx, ry, rw, rh] = rect;
      const sx = rx * nw;
      const sy = ry * nh;
      const sw = rw * nw;
      const sh = rh * nh;
      const targetH = Math.round((sh / sw) * targetW);

      const tc = document.createElement("canvas");
      tc.width = targetW;
      tc.height = targetH;
      const tctx = tc.getContext("2d");
      if (tctx) {
        tctx.imageSmoothingEnabled = true;
        tctx.imageSmoothingQuality = "high";
        tctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, targetW, targetH);
      }
      return tc;
    }

    function setupSize() {
      if (!canvas) return;
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      if (width < 10) width = window.innerWidth;
      if (height < 10) height = window.innerHeight;

      isPortrait = height > width;
      DPR = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.round(width * DPR);
      canvas.height = Math.round(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      step = Math.max(5, width / 205);
      rowStep = step * 2.05;
      cols = Math.ceil(width / step);
      rows = Math.ceil(height / rowStep);
      R = step * 0.46;

      // Offscreen field canvases
      fA = document.createElement("canvas");
      fA.width = cols;
      fA.height = rows;
      ctxA = fA.getContext("2d", { willReadFrequently: true });

      fB = document.createElement("canvas");
      fB.width = cols;
      fB.height = rows;
      ctxB = fB.getContext("2d", { willReadFrequently: true });
    }

    window.addEventListener("resize", setupSize);

    function renderFrame(tSec: number) {
      if (!ctx || !canvas || !tiles || !fA || !fB || !ctxA || !ctxB) return;

      const LOOP = 20;
      const t = tSec % LOOP;
      const a = (2 * Math.PI * t) / LOOP;

      // Dimensions & Placement: Hands reach gracefully across the open lower viewport
      const hw = isPortrait ? width * 0.66 : width * 0.53;
      const hh = hw * ((0.4 * 1520) / (0.47 * 2688));
      const cy = isPortrait ? height * 0.78 : height * 0.70;

      // Step 1: Draw pose A into fA, pose B into fB
      ctxA.fillStyle = "#ffffff";
      ctxA.fillRect(0, 0, cols, rows);
      ctxB.fillStyle = "#ffffff";
      ctxB.fillRect(0, 0, cols, rows);

      // Draw left hand (phase = 0)
      drawHandToField(ctxA, tiles.LA, true, a, 0, hw, hh, cy);
      drawHandToField(ctxB, tiles.LB, true, a, 0, hw, hh, cy);

      // Draw right hand (phase = pi)
      drawHandToField(ctxA, tiles.RA, false, a, Math.PI, hw, hh, cy);
      drawHandToField(ctxB, tiles.RB, false, a, Math.PI, hw, hh, cy);

      // Read pixel luminance fields
      const dataA = ctxA.getImageData(0, 0, cols, rows).data;
      const dataB = ctxB.getImageData(0, 0, cols, rows).data;

      // Glitch dissolve timings
      const mL = mixAt(t, 6.2, 14.6, 1.6);
      const mR = mixAt(t, 2.4, 10.4, 1.6);
      const tick = Math.floor(t * 7);

      // Clear main canvas with warm off-white #f7f7f5
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = "#f7f7f5";
      ctx.fillRect(0, 0, width, height);

      // Draw dot matrix in #0d0d0d
      ctx.fillStyle = "#0d0d0d";

      for (let j = 0; j < rows; j++) {
        // Row glitch: horizontal displacement
        let rowShift = 0;
        if (hash(j, tick) > 0.965) {
          rowShift = Math.round((hash(tick, j) - 0.5) * 8);
        }

        const dotY = (j + 0.5) * rowStep;

        for (let i = 0; i < cols; i++) {
          const sampleI = clamp(i - rowShift, 0, cols - 1);
          const idx = (j * cols + sampleI) * 4;

          const isLeftHalf = i < cols / 2;
          const m = isLeftHalf ? mL : mR;

          // Per-cell dissolve seed
          const seed = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7);
          const useB = seed < m;
          const redVal = useB ? dataB[idx] : dataA[idx];
          const lum = redVal / 255;

          let v = clamp((1 - lum - 0.16) / 0.42, 0, 1);
          if (v <= 0.001) continue;

          // While switch in progress, front edge sparkles
          if (m > 0.001 && m < 0.999) {
            const dist = Math.abs(seed - m);
            if (dist < 0.12) {
              v *= dist / 0.12;
              if (hash(i + tick, j) <= 0.4) {
                v *= 0.3;
              }
            }
          }

          // Shimmer
          v *= 0.86 + 0.14 * Math.sin(t * 3.2 + seed * 40);

          // Centre fade: fingertips dissolve gracefully before touching
          const cx = Math.abs((i + 0.5) / cols - 0.5);
          v *= smooth(0.015, 0.08, cx);

          // Top Quiet Zone: 100% clears any dots above the hand staging line so cards and copy NEVER overlap
          const quietLimit = isPortrait ? height * 0.54 : height * 0.46;
          const quietStart = isPortrait ? height * 0.44 : height * 0.38;
          if (dotY < quietLimit) {
            v *= smooth(quietStart, quietLimit, dotY);
          }

          if (v <= 0.05) continue;

          // Quantise to LEVELS = [0, .26, .52, .78, 1]
          let level = 0;
          for (let k = LEVELS.length - 1; k >= 0; k--) {
            if (v >= LEVELS[k] - 0.13) {
              level = LEVELS[k];
              break;
            }
          }
          if (level === 0) continue;

          // Radius
          const radius = level === 0.26 ? R * 0.38 : R * level;
          const dotX = (i + 0.5) * step;

          // Draw filled circle
          ctx.beginPath();
          ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawHandToField(
      fctx: CanvasRenderingContext2D,
      tile: HTMLCanvasElement,
      isLeft: boolean,
      a: number,
      ph: number,
      hw: number,
      hh: number,
      cy: number
    ) {
      const reach =
        (0.035 * Math.sin(a + ph) + 0.012 * Math.sin(2 * a + 1.3 + ph)) * width;
      const scale = 1 + 0.07 * Math.sin(a + 0.9 + ph);
      const rot = (isLeft ? 1 : -1) * 0.045 * Math.sin(a + 2.1 + ph);

      const x = isLeft ? reach - width * 0.045 : width - hw + width * 0.045 - reach;
      const y = cy - hh / 2;

      // Transform into field coordinate space
      const sx = cols / width;
      const sy = rows / height;

      fctx.save();
      fctx.scale(sx, sy);

      // Pivot: left edge or right edge at vertical center
      const pivotX = isLeft ? 0 : width;
      const pivotY = cy;

      fctx.translate(pivotX, pivotY);
      fctx.rotate(rot);
      fctx.scale(scale, scale);
      fctx.translate(-pivotX, -pivotY);

      fctx.drawImage(tile, x, y, hw, hh);
      fctx.restore();
    }

    function loop(now: number) {
      if (isDestroyed) return;
      const elapsed = (now - t0) / 1000;
      renderFrame(elapsed);
      animId = requestAnimationFrame(loop);
    }

    // Expose window.__render for deterministic tests / recorders
    if (typeof window !== "undefined") {
      (window as any).__render = (tSec: number) => renderFrame(tSec);
    }

    return () => {
      isDestroyed = true;
      window.removeEventListener("resize", setupSize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="dots"
      className="absolute inset-0 w-full h-full block pointer-events-none z-0"
    />
  );
}

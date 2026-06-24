// =========================================================================
// HeroBackground — Legal AI intelligence canvas animation
// =========================================================================
// Animated clause-graph network + document scan lines for the landing hero.
// Theme-aware, respects prefers-reduced-motion.

import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const CLAUSE_LABELS = [
  'Indemnity',
  'Liability',
  'Termination',
  'IP Ownership',
  'Payment',
  'Confidentiality',
  'Governing Law',
];

const NODE_COUNT = 64;
const LINK_DISTANCE = 165;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createNodes(width, height) {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const isHub = i < CLAUSE_LABELS.length;
    nodes.push({
      x: randomBetween(width * 0.06, width * 0.94),
      y: randomBetween(height * 0.08, height * 0.92),
      vx: randomBetween(-0.35, 0.35),
      vy: randomBetween(-0.35, 0.35),
      radius: isHub ? randomBetween(3.5, 5) : randomBetween(2, 3.5),
      label: isHub ? CLAUSE_LABELS[i] : null,
      pulse: randomBetween(0, Math.PI * 2),
      pulseSpeed: randomBetween(0.02, 0.045),
      isHub,
    });
  }
  return nodes;
}

export default function HeroBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    let animationId = 0;
    let nodes = [];
    let scanY = 0;
    let time = 0;

    const getColors = () => ({
      primary: isDark ? '#3b82f6' : '#2563eb',
      primaryBright: isDark ? '#60a5fa' : '#3b82f6',
      node: isDark ? 'rgba(147,197,253,0.95)' : 'rgba(37,99,235,0.85)',
      nodeCore: isDark ? '#ffffff' : '#1d4ed8',
      link: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(37,99,235,0.28)',
      linkActive: isDark ? 'rgba(147,197,253,0.9)' : 'rgba(37,99,235,0.75)',
      label: isDark ? 'rgba(191,219,254,0.9)' : 'rgba(29,78,216,0.75)',
      labelBg: isDark ? 'rgba(17,18,22,0.72)' : 'rgba(240,244,248,0.82)',
      scan: isDark ? 'rgba(59,130,246,0.22)' : 'rgba(37,99,235,0.16)',
      scanLine: isDark ? 'rgba(96,165,250,0.55)' : 'rgba(37,99,235,0.4)',
      glowCenter: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(37,99,235,0.18)',
      glowSide: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.1)',
      grid: isDark ? 'rgba(96,165,250,0.07)' : 'rgba(37,99,235,0.09)',
      ring: isDark ? 'rgba(96,165,250,0.2)' : 'rgba(37,99,235,0.15)',
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = createNodes(width, height);
      scanY = 0;
    };

    const drawAmbientGlow = (width, height, colors) => {
      const cx = width * 0.5;
      const cy = height * 0.45;

      const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.42);
      center.addColorStop(0, colors.glowCenter);
      center.addColorStop(0.55, colors.glowSide);
      center.addColorStop(1, 'transparent');
      ctx.fillStyle = center;
      ctx.fillRect(0, 0, width, height);

      const leftOrb = ctx.createRadialGradient(width * 0.15, height * 0.3, 0, width * 0.15, height * 0.3, width * 0.28);
      leftOrb.addColorStop(0, isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.12)');
      leftOrb.addColorStop(1, 'transparent');
      ctx.fillStyle = leftOrb;
      ctx.fillRect(0, 0, width, height);

      const rightOrb = ctx.createRadialGradient(width * 0.85, height * 0.55, 0, width * 0.85, height * 0.55, width * 0.3);
      rightOrb.addColorStop(0, isDark ? 'rgba(96,165,250,0.12)' : 'rgba(59,130,246,0.1)');
      rightOrb.addColorStop(1, 'transparent');
      ctx.fillStyle = rightOrb;
      ctx.fillRect(0, 0, width, height);
    };

    const drawGrid = (width, height, colors) => {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      const gridSize = 56;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawHubRings = (width, height, colors) => {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const baseR = Math.min(width, height) * 0.22;
      const pulse = Math.sin(time * 0.0015) * 8;

      for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.35 - i * 0.08;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + i * 42 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawScanLine = (width, height, colors) => {
      const bandHeight = height * 0.22;
      const grad = ctx.createLinearGradient(0, scanY - bandHeight, 0, scanY + bandHeight);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.45, colors.scan);
      grad.addColorStop(0.55, colors.scan);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - bandHeight, width, bandHeight * 2);

      ctx.strokeStyle = colors.scanLine;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.scanLine;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawLabel = (node, colors) => {
      const text = node.label;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const metrics = ctx.measureText(text);
      const padX = 8;
      const padY = 5;
      const boxW = metrics.width + padX * 2;
      const boxH = 18;
      const x = node.x + 10;
      const y = node.y - boxH - 4;

      ctx.fillStyle = colors.labelBg;
      ctx.strokeStyle = colors.linkActive;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.label;
      ctx.globalAlpha = 0.95;
      ctx.fillText(text, x + padX, y + 13);
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      const colors = getColors();
      ctx.clearRect(0, 0, width, height);

      drawAmbientGlow(width, height, colors);
      drawGrid(width, height, colors);
      if (!prefersReducedMotion) drawHubRings(width, height, colors);

      const links = [];
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            links.push({ a: nodes[i], b: nodes[j], dist, strength: 1 - dist / LINK_DISTANCE });
          }
        }
      }

      links.forEach(({ a, b, strength }) => {
        const isHubLink = a.isHub || b.isHub;
        ctx.strokeStyle = colors.link;
        ctx.globalAlpha = strength * (isHubLink ? 0.85 : 0.55);
        ctx.lineWidth = isHubLink ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        if (!prefersReducedMotion) {
          const t = (time * 0.003 + strength) % 1;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.fillStyle = colors.linkActive;
          ctx.globalAlpha = strength;
          ctx.shadowColor = colors.linkActive;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, isHubLink ? 2.2 : 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.globalAlpha = 1;

      nodes.forEach((node) => {
        node.pulse += node.pulseSpeed;
        const glow = 0.65 + Math.sin(node.pulse) * 0.35;
        const glowRadius = node.isHub ? node.radius * 7 : node.radius * 5;

        if (node.label) drawLabel(node, colors);

        const nodeGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        nodeGrad.addColorStop(0, colors.primaryBright);
        nodeGrad.addColorStop(0.4, colors.primary);
        nodeGrad.addColorStop(1, 'transparent');
        ctx.globalAlpha = glow * 0.55;
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (node.isHub && !prefersReducedMotion) {
          ctx.strokeStyle = colors.linkActive;
          ctx.globalAlpha = 0.25 + Math.sin(node.pulse) * 0.15;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6 + Math.sin(node.pulse) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = colors.nodeCore;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.node;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (!prefersReducedMotion) {
        drawScanLine(width, height, colors);
        scanY += 1.2;
        if (scanY > height + 50) scanY = -50;
      }

      if (!prefersReducedMotion) {
        nodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 24 || node.x > width - 24) node.vx *= -1;
          if (node.y < 24 || node.y > height - 24) node.vy *= -1;
        });
        time += 16;
      }
    };

    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <div className="hero-bg-root pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-bg-orb hero-bg-orb-left" />
      <div className="hero-bg-orb hero-bg-orb-right" />
      <canvas ref={canvasRef} className="hero-bg-canvas absolute inset-0 h-full w-full" />
      <div className="hero-bg-vignette absolute inset-0" />
      <div className="hero-bg-fade absolute inset-x-0 bottom-0 h-24" />
    </div>
  );
}

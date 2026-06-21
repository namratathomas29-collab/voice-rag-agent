import { useEffect, useRef } from "react";

/**
 * ParticleOrb
 * A self-contained canvas particle sphere with a glowing cyan core.
 * No external dependencies — pure React + Canvas.
 */
export default function ParticleOrb() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationId;

    // Build particles distributed on a sphere using a fibonacci spiral
    const COUNT = 520;
    const particles = [];
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.42;

      angle += 0.0035;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const tilt = 0.45;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Glowing core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      coreGrad.addColorStop(0, "rgba(120, 255, 250, 0.55)");
      coreGrad.addColorStop(0.4, "rgba(20, 220, 240, 0.18)");
      coreGrad.addColorStop(1, "rgba(10, 80, 120, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sort particles by depth for nicer overlap
      const projected = particles.map((p) => {
        // rotate around Y
        let x = p.x * cosA - p.z * sinA;
        let z = p.x * sinA + p.z * cosA;
        let y = p.y;
        // tilt around X
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        return { x, y: y2, z: z2 };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1) / 2; // 0..1
        const px = cx + p.x * radius;
        const py = cy + p.y * radius;
        const size = 0.6 + depth * 1.8;
        const alpha = 0.15 + depth * 0.75;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${120 + depth * 80}, ${235}, ${245}, ${alpha})`;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bright equatorial glow line at the front
      ctx.beginPath();
      ctx.strokeStyle = "rgba(150, 255, 250, 0.25)";
      ctx.lineWidth = 1;
      ctx.ellipse(cx, cy, radius, radius * sinT, 0, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
    
  }, []);

  return <canvas ref={canvasRef} className="particle-orb-canvas" />;
}
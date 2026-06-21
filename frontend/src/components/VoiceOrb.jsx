import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./VoiceOrb.css";

/**
 * VoiceOrb — a Jarvis-style AI voice assistant orb.
 *
 * Props:
 *   state: "idle" | "listening" | "thinking" | "speaking"
 *   size:  number (px) — diameter of the orb stage. Defaults to 320.
 *
 * Fully self-contained: a canvas particle sphere whose rotation speed and
 * energy react to `state`, layered with Framer Motion rings, waveform, and glow.
 * No external APIs.
 */

const STATE_CONFIG = {
  idle: { speed: 0.0016, energy: 0.15, hue: 188 },
  listening: { speed: 0.0026, energy: 0.4, hue: 190 },
  thinking: { speed: 0.012, energy: 0.7, hue: 200 },
  speaking: { speed: 0.006, energy: 1, hue: 185 },
};

function ParticleSphere({ state }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);

  // keep latest state available inside the animation loop without re-init
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;

    const COUNT = 560;
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
    let curSpeed = STATE_CONFIG.idle.speed;
    let curEnergy = STATE_CONFIG.idle.energy;
    let t = 0;

    const render = () => {
      t += 0.016;
      const cfg = STATE_CONFIG[stateRef.current] || STATE_CONFIG.idle;

      // ease current values toward the target state for smooth transitions
      curSpeed += (cfg.speed - curSpeed) * 0.06;
      curEnergy += (cfg.energy - curEnergy) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.4;

      // breathing / voice pulse — strongest while speaking
      const pulse =
        stateRef.current === "speaking"
          ? 1 + Math.sin(t * 7) * 0.06 + Math.sin(t * 13) * 0.03
          : 1 + Math.sin(t * 2) * 0.02 * curEnergy;
      const radius = baseR * pulse;

      angle += curSpeed * 16;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const tilt = 0.5;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const hue = cfg.hue;

      // glowing core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      core.addColorStop(0, `hsla(${hue}, 100%, 75%, ${0.4 + curEnergy * 0.3})`);
      core.addColorStop(0.45, `hsla(${hue}, 100%, 55%, 0.14)`);
      core.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const projected = particles.map((p) => {
        const x = p.x * cosA - p.z * sinA;
        const z = p.x * sinA + p.z * cosA;
        const y = p.y;
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        return { x, y: y2, z: z2 };
      });
      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1) / 2;
        const px = cx + p.x * radius;
        const py = cy + p.y * radius;
        const size = 0.5 + depth * (1.6 + curEnergy * 1.2);
        const alpha = 0.12 + depth * (0.6 + curEnergy * 0.3);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 100%, ${70 + depth * 15}%, ${alpha})`;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="vo-canvas" />;
}

export default function VoiceOrb({ state = "idle", size = 320 }) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";

  return (
    <div className="vo-stage" style={{ width: size, height: size }}>
      {/* Outer ambient glow — intensity varies per state */}
      <motion.div
        className="vo-glow"
        animate={{
          opacity: isSpeaking ? 0.9 : isThinking ? 0.6 : isListening ? 0.5 : 0.3,
          scale: isSpeaking ? [1, 1.12, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.6 },
          scale: { duration: 0.9, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" },
        }}
      />

      {/* Listening — pulsing concentric rings */}
      <AnimatePresence>
        {isListening &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={`ring-${i}`}
              className="vo-ring"
              initial={{ scale: 0.7, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* Thinking — fast orbiting energy arc */}
      <AnimatePresence>
        {isThinking && (
          <motion.span
            className="vo-thinking-arc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{
              rotate: { duration: 1.1, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.4 },
            }}
          />
        )}
      </AnimatePresence>

      {/* Speaking — animated waveform circling the orb */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="vo-waveform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="vo-wave-bar"
                style={{
                  transform: `rotate(${i * 9}deg) translateY(${-size * 0.47}px)`,
                  animationDelay: `${(i % 10) * 0.08}s`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core particle sphere — reacts to voice while speaking */}
      <motion.div
        className="vo-core"
        animate={{
          scale: isSpeaking ? [1, 1.08, 0.97, 1.05, 1] : isListening ? [1, 1.03, 1] : 1,
        }}
        transition={{
          duration: isSpeaking ? 0.7 : 2.4,
          repeat: isSpeaking || isListening ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <ParticleSphere state={state} />

        <img
          src="/astra-logo.png"
          alt="Astra"
          className="vo-logo"
        />
      </motion.div>

      {/* Status caption */}
      <motion.div
        className="vo-caption"
        key={state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {state === "idle" && "Standby"}
        {state === "listening" && "Listening…"}
        {state === "thinking" && "Thinking…"}
        {state === "speaking" && "Speaking"}
      </motion.div>
    </div>
  );
}

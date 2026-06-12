import React, { useRef, useEffect } from "react";

const BackgroundParticles = ({ role }) => {
  const canvasRef = useRef(null);
  const targetColorRef = useRef({ r: 139, g: 92, b: 246 });

  useEffect(() => {
    if (role === "candidate") {
      targetColorRef.current = { r: 139, g: 92, b: 246 };
    } else {
      targetColorRef.current = { r: 16, g: 185, b: 129 };
    }
  }, [role]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let currentRGB = { r: 139, g: 92, b: 246 };
    const mouse = { x: null, y: null };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const drawRing = (cx, cy, radius, phase, alpha, stroke) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.42, phase, 0, Math.PI * 2);
      ctx.strokeStyle = stroke.replace("ALPHA", alpha.toFixed(3));
      ctx.lineWidth = 2.2;
      ctx.stroke();
    };

    const drawOrbitingDots = (cx, cy, baseRadius, phase, t, rgb) => {
      const dotCount = 24;
      for (let i = 0; i < dotCount; i += 1) {
        const a = (i / dotCount) * Math.PI * 2 + t * 0.45 + phase;
        const x = cx + Math.cos(a) * baseRadius;
        const y = cy + Math.sin(a) * (baseRadius * 0.42);
        const depth = (Math.sin(a + t * 0.7) + 1) / 2;
        const size = 1.6 + depth * 2.8;
        const glow = 0.24 + depth * 0.56;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glow})`;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      currentRGB.r += (targetColorRef.current.r - currentRGB.r) * 0.05;
      currentRGB.g += (targetColorRef.current.g - currentRGB.g) * 0.05;
      currentRGB.b += (targetColorRef.current.b - currentRGB.b) * 0.05;

      const t = performance.now() * 0.001;
      const width = canvas.width;
      const height = canvas.height;
      const driftX = Math.cos(t * 0.28) * width * 0.018;
      const driftY = Math.sin(t * 0.24) * height * 0.014;
      const parallaxX = mouse.x ? (mouse.x - width * 0.5) * 0.035 : 0;
      const parallaxY = mouse.y ? (mouse.y - height * 0.5) * 0.03 : 0;
      const centerX = width * 0.5 + driftX + parallaxX;
      const centerY = height * 0.52 + driftY + parallaxY;
      const pulse = 1 + Math.sin(t * 0.9) * 0.08;
      const sphereRadius = Math.min(width, height) * 0.44 * pulse;

      ctx.clearRect(0, 0, width, height);

      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        sphereRadius * 0.2,
        centerX,
        centerY,
        sphereRadius * 2.2
      );
      radialGlow.addColorStop(0, `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, 0.32)`);
      radialGlow.addColorStop(0.55, `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, 0.14)`);
      radialGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      const bloom = ctx.createRadialGradient(
        centerX + sphereRadius * 0.2,
        centerY - sphereRadius * 0.18,
        sphereRadius * 0.1,
        centerX,
        centerY,
        sphereRadius * 1.45
      );
      bloom.addColorStop(0, "rgba(255,255,255,0.12)");
      bloom.addColorStop(0.35, "rgba(255,255,255,0.06)");
      bloom.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, width, height);

      const ringColor = `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, ALPHA)`;
      const rings = 8;
      for (let i = 0; i < rings; i += 1) {
        const ratio = (i + 1) / rings;
        const radius = sphereRadius * (0.28 + ratio * 0.95);
        const phase = t * (0.09 + ratio * 0.15) + i * 0.75;
        const alpha = 0.18 + ratio * 0.16 + Math.sin(t * 1.8 + i) * 0.025;
        drawRing(centerX, centerY, radius, phase, alpha, ringColor);
        drawOrbitingDots(centerX, centerY, radius, phase, t, currentRGB);
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 0.88, 0, Math.PI * 2);
      const coreGradient = ctx.createRadialGradient(
        centerX - sphereRadius * 0.25,
        centerY - sphereRadius * 0.25,
        sphereRadius * 0.1,
        centerX,
        centerY,
        sphereRadius
      );
      coreGradient.addColorStop(0, `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, 0.42)`);
      coreGradient.addColorStop(1, `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, 0.08)`);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.35,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.16)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [role]);

  return (
    <div className="particles-container">
      <canvas ref={canvasRef} className="particles-canvas"></canvas>
    </div>
  );
};

export default BackgroundParticles;

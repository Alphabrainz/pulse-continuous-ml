import React, { useEffect, useRef } from 'react';

/**
 * SpectralCanvas - Signature Animated VIBGYOR Spectral Pulse & Flowing Ribbon
 * 
 * Simulates coherent photons and flowing light ribbons traveling through an intelligent system.
 * Smoothly cascades across all seven VIBGYOR wavelengths:
 * Violet (400nm), Indigo (430nm), Blue (470nm), Green (520nm), Yellow (580nm), Orange (605nm), Red (680nm).
 * 
 * Never a cartoon rainbow: utilizes screen blend modes, gaussian attenuation, variable phase harmonics,
 * and deep negative space integration.
 */
export default function SpectralCanvas({ 
  mode = 'idle', // 'idle' | 'focused' | 'generating' | 'voice'
  reducedMotion = false,
  intensity = 1.0,
  interactive = true 
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let time = 0;

    // The Seven VIBGYOR spectral definitions with calibrated optical weights
    const wavelengths = [
      { name: 'Violet', r: 139, g: 43, b: 226, freq: 0.0016, ampScale: 0.95, phaseOffset: 0.0 },
      { name: 'Indigo', r: 79,  g: 43, b: 237, freq: 0.0018, ampScale: 1.05, phaseOffset: 0.35 },
      { name: 'Blue',   r: 0,   g: 112, b: 243, freq: 0.0020, ampScale: 1.15, phaseOffset: 0.70 },
      { name: 'Green',  r: 0,   g: 214, b: 143, freq: 0.0022, ampScale: 1.20, phaseOffset: 1.05 },
      { name: 'Yellow', r: 255, g: 199, b: 0,   freq: 0.0024, ampScale: 1.10, phaseOffset: 1.40 },
      { name: 'Orange', r: 255, g: 122, b: 0,   freq: 0.0026, ampScale: 1.00, phaseOffset: 1.75 },
      { name: 'Red',    r: 255, g: 51,  b: 102, freq: 0.0028, ampScale: 0.90, phaseOffset: 2.10 },
    ];

    // Traveling photon particles along the spectral ribbon
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      progress: (i / particleCount),
      speed: 0.0006 + Math.random() * 0.0004,
      waveIndex: i % 7,
      size: 1.5 + Math.random() * 1.5,
      alpha: 0.4 + Math.random() * 0.5
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      if (reducedMotion) {
        // Render static, elegant spectral gradient fallback
        ctx.clearRect(0, 0, width, height);
        const grad = ctx.createLinearGradient(0, height * 0.4, width, height * 0.6);
        wavelengths.forEach((w, idx) => {
          grad.addColorStop(idx / 6, `rgba(${w.r}, ${w.g}, ${w.b}, 0.07)`);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Speed & Amplitude multipliers based on app state
      let speedMult = 1.0;
      let ampMult = 1.0;
      let photonSpeedMult = 1.0;

      if (mode === 'focused') {
        speedMult = 1.25;
        ampMult = 1.15;
      } else if (mode === 'generating') {
        speedMult = 2.4;
        ampMult = 1.35;
        photonSpeedMult = 3.0;
      } else if (mode === 'voice') {
        speedMult = 1.8;
        ampMult = 1.5;
        photonSpeedMult = 2.0;
      }

      time += 0.016 * speedMult;

      // Use screen blend mode so overlapping wavelengths additively synthesize into luminous white-hot photon centers
      ctx.globalCompositeOperation = 'screen';

      const baseY = height * 0.45;
      const baseAmp = Math.min(height * 0.18, 55) * ampMult * intensity;

      // Render 7 interwoven spectral ribbon strands
      wavelengths.forEach((wave, idx) => {
        ctx.beginPath();

        const strandPhase = time * wave.freq * 1000 + wave.phaseOffset;
        const pts = [];
        const step = 20;

        for (let x = 0; x <= width + step; x += step) {
          // Complex harmonic synthesis: Primary wave + secondary harmonic + tertiary ripple
          const nx = x / width;
          const harmonic1 = Math.sin(nx * 4.2 + strandPhase) * baseAmp * wave.ampScale;
          const harmonic2 = Math.cos(nx * 7.5 - strandPhase * 0.8) * (baseAmp * 0.35);
          const envelope = Math.sin(nx * Math.PI); // Taper at edges for natural organic flow

          // Interactive mouse gravity deflection
          let mouseDeflection = 0;
          if (mouseRef.current.x > 0) {
            const dist = Math.hypot(x - mouseRef.current.x, (baseY + harmonic1) - mouseRef.current.y);
            if (dist < 220) {
              mouseDeflection = Math.sin((1 - dist / 220) * Math.PI) * 22;
            }
          }

          const y = baseY + (harmonic1 + harmonic2) * envelope + mouseDeflection;
          pts.push({ x, y });
        }

        // Draw smooth bezier curve through points
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 2; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.quadraticCurveTo(
          pts[pts.length - 2].x,
          pts[pts.length - 2].y,
          pts[pts.length - 1].x,
          pts[pts.length - 1].y
        );

        // Core luminous line
        const alpha = (0.24 + Math.sin(time * 0.8 + idx) * 0.08) * intensity;
        ctx.strokeStyle = `rgba(${wave.r}, ${wave.g}, ${wave.b}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 2.2 * intensity;
        ctx.stroke();

        // Diffused optical halo around the wave
        ctx.strokeStyle = `rgba(${wave.r}, ${wave.g}, ${wave.b}, ${(alpha * 0.4).toFixed(3)})`;
        ctx.lineWidth = 7.0 * intensity;
        ctx.stroke();
      });

      // Render traveling photon packets
      particles.forEach((p) => {
        p.progress += p.speed * photonSpeedMult;
        if (p.progress > 1) p.progress -= 1;

        const wave = wavelengths[p.waveIndex];
        const strandPhase = time * wave.freq * 1000 + wave.phaseOffset;
        const px = p.progress * width;
        const nx = p.progress;
        const harmonic1 = Math.sin(nx * 4.2 + strandPhase) * baseAmp * wave.ampScale;
        const harmonic2 = Math.cos(nx * 7.5 - strandPhase * 0.8) * (baseAmp * 0.35);
        const envelope = Math.sin(nx * Math.PI);
        const py = baseY + (harmonic1 + harmonic2) * envelope;

        const pAlpha = p.alpha * envelope * intensity;
        if (pAlpha > 0.02) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * (mode === 'generating' ? 1.6 : 1), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${wave.r}, ${wave.g}, ${wave.b}, ${pAlpha.toFixed(3)})`;
          ctx.fill();

          // Photon glow
          ctx.beginPath();
          ctx.arc(px, py, p.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${wave.r}, ${wave.g}, ${wave.b}, ${(pAlpha * 0.25).toFixed(3)})`;
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mode, reducedMotion, intensity, interactive]);

  return (
    <div 
      className="spectral-canvas-wrapper" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: 0.85
        }} 
      />
      {/* Top subtle vignette to soften canvas edges into deep midnight */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 80% at 50% 40%, transparent 40%, var(--bg-midnight) 100%)',
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
}

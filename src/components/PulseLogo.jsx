import React from 'react';

/**
 * PulseLogo - Signature VIBGYOR brand mark for Pulse AI.
 * Represents an intelligent refraction pulse traveling through seven harmonic spectrum wavelengths:
 * Violet (400nm), Indigo (430nm), Blue (470nm), Green (520nm), Yellow (580nm), Orange (605nm), Red (680nm).
 */
export default function PulseLogo({ size = 'medium', animated = true, showText = true, badge = '2.5' }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const dimension = isSmall ? 28 : isLarge ? 48 : 36;

  return (
    <div className={`pulse-brand-mark ${size}`} style={{ display: 'inline-flex', alignItems: 'center', gap: isSmall ? '8px' : '12px' }}>
      <div 
        className="mark-prism-container" 
        style={{ 
          position: 'relative', 
          width: dimension, 
          height: dimension,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: isSmall ? '8px' : '10px',
          background: 'linear-gradient(145deg, #121522 0%, #0a0c14 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg 
          width={dimension * 0.72} 
          height={dimension * 0.72} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Luminous 7-color VIBGYOR gradient */}
            <linearGradient id="pulseSpectralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B2BE2" />
              <stop offset="16.6%" stopColor="#4F2BED" />
              <stop offset="33.3%" stopColor="#0070F3" />
              <stop offset="50%" stopColor="#00D68F" />
              <stop offset="66.6%" stopColor="#FFC700" />
              <stop offset="83.3%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FF3366" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background subtle harmonic guide line */}
          <path 
            d="M 6 20 C 11 12, 14 28, 20 20 C 26 12, 29 28, 34 20" 
            stroke="rgba(255, 255, 255, 0.12)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />

          {/* Main Intelligent Pulse Wave */}
          <path 
            className={animated ? 'pulse-wave-anim' : ''}
            d="M 6 20 C 11 8, 14 32, 20 20 C 26 8, 29 32, 34 20" 
            stroke="url(#pulseSpectralGrad)" 
            strokeWidth="2.8" 
            strokeLinecap="round" 
            filter="url(#softGlow)"
          />

          {/* Central Intelligent Convergence Singularity Node */}
          <circle cx="20" cy="20" r="2.2" fill="#00D68F" />
          <circle cx="20" cy="20" r="4.2" stroke="#00D68F" strokeWidth="0.8" opacity="0.4" />
        </svg>

        {/* Ambient Corner Specular Glow */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'radial-gradient(circle at 10% 10%, rgba(139, 43, 226, 0.25), transparent 60%)',
            pointerEvents: 'none'
          }} 
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                fontFamily: 'var(--font-sans)', 
                fontWeight: 700, 
                fontSize: isSmall ? '15px' : isLarge ? '20px' : '17px', 
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                Pulse
              </span>
              <span style={{ 
                fontSize: isSmall ? '10px' : '11px', 
                fontWeight: 800, 
                background: 'var(--spectral-gradient-horizontal)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
                lineHeight: 1
              }}>
                AI
              </span>
            </div>
          </div>

          {badge && (
            <span style={{
              fontSize: '10.5px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}>
              {badge}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulseFlow {
          0% {
            stroke-dashoffset: 0;
            filter: drop-shadow(0 0 2px rgba(139, 43, 226, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 6px rgba(0, 214, 143, 0.6));
          }
          100% {
            stroke-dashoffset: -70;
            filter: drop-shadow(0 0 2px rgba(255, 51, 102, 0.5));
          }
        }

        .pulse-wave-anim {
          stroke-dasharray: 40 10;
          animation: pulseFlow 6s linear infinite;
        }

        .mark-prism-container:hover .pulse-wave-anim {
          animation-duration: 2.5s;
        }
      `}</style>
    </div>
  );
}

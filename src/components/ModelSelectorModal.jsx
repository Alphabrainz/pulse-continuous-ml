import React from 'react';
import { X, Check, Sparkles, Zap, ShieldCheck, Brain } from 'lucide-react';

const MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'Pulse 2.5 Flash Flow',
    groqEngine: 'openai/gpt-oss-20b',
    tag: 'Active',
    color: '#0070F3',
    icon: Zap,
    context: '128,000 tokens',
    speed: '~450 tokens/sec',
    description: 'Ultra-fast, natural conversational assistant powered by Groq LPU™ for everyday questions, programming, and mathematical problem-solving.',
    strengths: ['Sub-80ms first token', 'Ultra-fast streaming', 'Natural conversation', 'Problem-solving']
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Google Gemini 3.8 Flash',
    geminiEngine: 'gemini-3.8-flash',
    tag: 'Google AI',
    color: '#4285F4',
    icon: Sparkles,
    context: '1,000,000 tokens',
    speed: '~380 tokens/sec',
    description: 'Google flagship multimodal model with 1M context, real-time streaming, and search grounding powered by your Gemini API key.',
    strengths: ['Official Gemini API Key', '1M token context window', 'Search grounding', 'Multimodal analysis']
  },
  {
    id: 'pulse-local-trained',
    name: 'Pulse Local Trained Model (Edge / Offline)',
    tag: 'Trained Model',
    color: '#A78BFA',
    icon: Brain,
    context: 'Infinite (Edge)',
    speed: 'Instant (0-token)',
    description: '100% on-device model powered by your local intelligence heuristics & VADER sentiment engine. Completely bypasses external cloud APIs with zero token consumption.',
    strengths: ['Runs 100% locally on device', 'Zero external API tokens consumed', 'Instant sub-10ms latency', 'Offline sentiment & emotion analysis']
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'Pulse 2.5 Spectral Pro (Deep Reasoning)',
    groqEngine: 'openai/gpt-oss-120b',
    tag: 'Coming Later',
    color: '#8B2BE2',
    icon: ShieldCheck,
    context: '128,000 tokens',
    speed: '~180 tokens/sec',
    description: 'Heavy 120B cognitive architecture for deep analytical multi-pass audits. Reserved for upcoming release.',
    strengths: ['Deep reasoning model', 'Will be enabled later', '120B parameter scale'],
    disabled: true
  }
];

export default function ModelSelectorModal({ 
  isOpen, 
  onClose, 
  selectedModel, 
  onSelectModel,
  geminiApiEnabled = true,
  groqApiEnabled = true,
  onToggleAllApis
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 12, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div 
        style={{
          width: '90%',
          maxWidth: '560px',
          background: 'rgba(16, 19, 30, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px -10px rgba(139, 43, 226, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
              Select Intelligence Model
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Flash Flow is currently the active reasoning model (Deep Reasoning coming later)
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Offline Trained Model Mode Switch */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: (!geminiApiEnabled && !groqApiEnabled)
            ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 43, 226, 0.2) 100%)'
            : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${(!geminiApiEnabled && !groqApiEnabled) ? 'rgba(167, 139, 250, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} style={{ color: '#A78BFA' }} />
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                Local Model Testing Mode (APIs OFF)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {(!geminiApiEnabled && !groqApiEnabled) ? 'Both cloud APIs disabled • 100% on-device' : 'Cloud APIs active (Gemini / Groq)'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = (!geminiApiEnabled && !groqApiEnabled);
              if (onToggleAllApis) onToggleAllApis(next);
            }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              background: (!geminiApiEnabled && !groqApiEnabled) ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)',
              color: (!geminiApiEnabled && !groqApiEnabled) ? '#0D1117' : '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {(!geminiApiEnabled && !groqApiEnabled) ? 'APIs Disabled' : 'Turn Off APIs'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {MODELS.map((m) => {
            const isSelected = (selectedModel?.id || 'openai/gpt-oss-20b') === m.id;
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => {
                  if (m.disabled) return;
                  if (m.id === 'pulse-local-trained' && onToggleAllApis) {
                    onToggleAllApis(false); // disable cloud APIs for local trained model
                  } else if ((!geminiApiEnabled && !groqApiEnabled) && onToggleAllApis) {
                    onToggleAllApis(true); // re-enable APIs when switching back to cloud models
                  }
                  onSelectModel(m);
                  onClose();
                }}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.07)'}`,
                  cursor: m.disabled ? 'not-allowed' : 'pointer',
                  opacity: m.disabled ? 0.6 : 1,
                  transition: 'all 0.18s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                    <Icon size={15} style={{ color: m.color }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>{m.name}</span>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                      {m.tag}
                    </span>
                    <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 214, 143, 0.12)', color: '#00D68F', fontFamily: 'var(--font-mono)' }}>
                      ⚡ {m.speed}
                    </span>
                  </div>
                  {isSelected && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#00D68F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#090B12', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '10px' }}>
                  {m.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {m.strengths.map((str, idx) => (
                    <span key={idx} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                      ✓ {str}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

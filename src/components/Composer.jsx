import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Square, 
  Paperclip, 
  Globe, 
  Mic, 
  MicOff,
  SlidersHorizontal, 
  FileText, 
  Image as ImageIcon,
  Film,
  X, 
  Sparkles,
  ChevronDown,
  Layers,
  Scale,
  Code2,
  Atom,
  TrendingUp,
  Zap
} from 'lucide-react';
import { elevenLabsService } from '../services/elevenLabsService.js';

const CAPABILITIES = [
  { id: 'general', label: 'Pulse Flash', color: '#0070F3', icon: Zap, desc: 'Fast, natural conversational assistant' },
  { id: 'code', label: 'Coding', color: '#00D68F', icon: Code2, desc: 'Code writing, algorithms, and debugging' },
  { id: 'math', label: 'Math & Science', color: '#38BDF8', icon: Atom, desc: 'Formulas, equations, and proofs' },
  { id: 'analytics', label: 'Analytics', color: '#FFC700', icon: TrendingUp, desc: 'Calculations, data, and risk modeling' },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Composer({ 
  onSend, 
  isGenerating = false, 
  onStop, 
  onFocusChange,
  onOpenVoiceModal,
  onOpenSettings,
  selectedCapability,
  onSelectCapability,
  initialText = ''
}) {
  const [text, setText] = useState(initialText);
  const [isFocused, setIsFocused] = useState(false);
  const [groundingEnabled, setGroundingEnabled] = useState(false);
  const [showWebFlyout, setShowWebFlyout] = useState(false);
  const [searchDepth, setSearchDepth] = useState('deep');
  const [domainFilter, setDomainFilter] = useState('all');
  const [attachment, setAttachment] = useState(null);
  const [showCapabilityMenu, setShowCapabilityMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustHeight();
      }
    }
  }, [initialText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    adjustHeight();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocusChange) onFocusChange(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onFocusChange) onFocusChange(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isGenerating) {
      if (onStop) onStop();
      return;
    }
    if (!text.trim() && !attachment) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setIsListening(false);
    }

    onSend({
      content: text,
      attachment: attachment,
      capability: selectedCapability || CAPABILITIES[0],
      grounding: groundingEnabled,
      webOptions: {
        depth: searchDepth,
        domain: domainFilter
      }
    });

    setText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    const reader = new FileReader();

    if (isImg || isVid) {
      reader.onload = (event) => {
        setAttachment({
          id: `att-${Date.now()}`,
          name: file.name,
          size: formatBytes(file.size),
          type: file.type,
          kind: isImg ? 'image' : 'video',
          previewUrl: event.target.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        setAttachment({
          id: `att-${Date.now()}`,
          name: file.name,
          size: formatBytes(file.size),
          type: file.type || 'text/plain',
          kind: 'file',
          textContent: typeof event.target.result === 'string' ? event.target.result.slice(0, 100000) : ''
        });
      };
      if (file.size < 5 * 1024 * 1024) {
        reader.readAsText(file);
      } else {
        setAttachment({
          id: `att-${Date.now()}`,
          name: file.name,
          size: formatBytes(file.size),
          type: file.type || 'application/octet-stream',
          kind: 'file'
        });
      }
    }

    e.target.value = '';
  };

  const toggleVoiceInput = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      if (onOpenVoiceModal) {
        onOpenVoiceModal();
      } else {
        alert('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      }
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Match microphone input language with selected ElevenLabs voice language
      const selectedLang = elevenLabsService.getSelectedLanguage();
      const langMap = {
        'hi': 'hi-IN',
        'kn': 'kn-IN',
        'en-IN': 'en-IN',
        'en': 'en-US',
        'auto': 'en-IN'
      };
      recognition.lang = langMap[selectedLang] || 'en-IN';

      baseTextRef.current = text.trim();
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += chunk;
          } else {
            interim += chunk;
          }
        }

        if (finalChunk) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + finalChunk.trim();
        }

        const combinedSpoken = (finalTranscriptRef.current + ' ' + interim).trim();
        const base = baseTextRef.current;
        const newText = base ? `${base} ${combinedSpoken}` : combinedSpoken;

        setText(newText);
        adjustHeight();
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setIsListening(false);
    }
  };

  const currentCap = selectedCapability || CAPABILITIES[0];
  const CapIcon = currentCap.icon;

  return (
    <div className="composer-root-container" style={{ position: 'relative', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* Clean, unified Pulse Flash indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0070F3', boxShadow: '0 0 8px #0070F3' }} />
          <span style={{ fontWeight: 500, letterSpacing: '0.01em' }}>Pulse Flash</span>
        </div>

        {/* VIBGYOR Micro Harmony Indicator */}
        <div className="vibgyor-bar" title="Pulse Spectral Engine (VIBGYOR active)">
          <span className="dot dot-v" />
          <span className="dot dot-i" />
          <span className="dot dot-b" />
          <span className="dot dot-g" />
          <span className="dot dot-y" />
          <span className="dot dot-o" />
          <span className="dot dot-r" />
        </div>
      </div>

      {/* Main Composer Box */}
      <div 
        className={`composer-box ${isFocused ? 'is-focused' : ''}`}
        style={{
          position: 'relative',
          borderRadius: '18px',
          background: 'rgba(16, 19, 29, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: isFocused 
            ? '0 16px 40px -10px rgba(0, 0, 0, 0.8), 0 0 35px -8px rgba(79, 43, 237, 0.25)' 
            : '0 12px 32px -8px rgba(0, 0, 0, 0.65)',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          padding: '14px 16px 12px'
        }}
      >
        {/* Subtle Ambient Rainbow Ring on Focus (masked, never blinding neon) */}
        <div 
          style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '19px',
            padding: '1px',
            background: 'var(--spectral-gradient-linear)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: isFocused ? 0.5 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          }} 
        />

        {/* Attachment Preview Badge if attached */}
        {attachment && (
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              marginBottom: '10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
          >
            {attachment.kind === 'image' && attachment.previewUrl && (
              <img 
                src={attachment.previewUrl} 
                alt="preview" 
                style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} 
              />
            )}
            {attachment.kind === 'image' && !attachment.previewUrl && <ImageIcon size={14} style={{ color: '#00D68F' }} />}
            {attachment.kind === 'video' && <Film size={14} style={{ color: '#FF7A00' }} />}
            {attachment.kind === 'file' && <FileText size={14} style={{ color: '#0070F3' }} />}
            
            <span style={{ fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attachment.name}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({attachment.size})</span>
            <button 
              type="button" 
              onClick={() => setAttachment(null)}
              title="Remove attachment"
              style={{ display: 'flex', alignItems: 'center', padding: '2px', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Ask Pulse anything... (e.g. explain a concept, write code, solve an equation)"
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: '15.5px',
            lineHeight: 1.5,
            resize: 'none',
            fontFamily: 'var(--font-sans)',
            minHeight: '26px',
            maxHeight: '220px',
            padding: 0
          }}
        />

        {/* Bottom Toolbar & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '6px' }}>
          
          {/* Left Controls: Attachments & Grounding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            
            {/* Real File / Photo / Video Upload Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.js,.py,.html,.css,.csv,.ts,.tsx,.jsx,.c,.cpp,.rs,.go" 
              style={{ display: 'none' }} 
            />

            {/* Attachment Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn-icon"
                title="Attach Photo, Video, or Document"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  color: attachment ? '#00D68F' : 'var(--text-muted)',
                  background: attachment ? 'rgba(0, 214, 143, 0.1)' : 'transparent',
                  borderColor: attachment ? 'rgba(0, 214, 143, 0.3)' : 'transparent'
                }}
              >
                <Paperclip size={16} />
              </button>
            </div>

            {/* Web Research API & Grounding Controls */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn-icon"
                title={groundingEnabled ? 'Web Research Active: Indexes live web, Wikipedia, arXiv & journals' : 'Web Research Disabled'}
                onClick={() => setGroundingEnabled(!groundingEnabled)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowWebFlyout(!showWebFlyout);
                }}
                style={{
                  color: groundingEnabled ? '#0070F3' : 'var(--text-faint)',
                  background: groundingEnabled ? 'rgba(0, 112, 243, 0.12)' : 'transparent',
                  borderColor: groundingEnabled ? 'rgba(0, 112, 243, 0.35)' : 'transparent',
                  gap: '5px',
                  padding: '0 9px',
                  width: 'auto'
                }}
              >
                <Globe size={15} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Web</span>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWebFlyout(!showWebFlyout);
                  }}
                  style={{ display: 'flex', alignItems: 'center', opacity: 0.7, padding: '2px' }}
                  title="Web Research Options"
                >
                  <ChevronDown size={11} />
                </span>
              </button>

              {/* Web Research Configuration Flyout */}
              {showWebFlyout && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '125%',
                    left: 0,
                    zIndex: 60,
                    width: '300px',
                    background: '#101424',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    padding: '12px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 112, 243, 0.2)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={14} style={{ color: '#0070F3' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>Web Research API</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGroundingEnabled(!groundingEnabled)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: groundingEnabled ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: groundingEnabled ? '#00D68F' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {groundingEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Research Depth */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Research Depth:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSearchDepth('fast')}
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          background: searchDepth === 'fast' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${searchDepth === 'fast' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                          color: searchDepth === 'fast' ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Fast Grounding
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchDepth('deep')}
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          background: searchDepth === 'deep' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${searchDepth === 'deep' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                          color: searchDepth === 'deep' ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Deep Multi-Pass
                      </button>
                    </div>
                  </div>

                  {/* Domain Scope */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Domain Scope:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {[
                        { id: 'all', label: 'All Web' },
                        { id: 'science', label: 'arXiv & Science' },
                        { id: 'legal', label: 'Statutory Law' },
                        { id: 'tech', label: 'Engineering' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDomainFilter(item.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: domainFilter === item.id ? 'rgba(0, 112, 243, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${domainFilter === item.id ? 'rgba(0, 112, 243, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: domainFilter === item.id ? '#FFFFFF' : 'var(--text-muted)',
                            fontSize: '10.5px',
                            cursor: 'pointer'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Link */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Live Multi-Spectrum Engine</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWebFlyout(false);
                        if (onOpenSettings) onOpenSettings('web-api');
                      }}
                      style={{ fontSize: '11px', color: '#0070F3', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Configure API Key →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spectral Voice / Mic Mode */}
            <button
              type="button"
              className="btn-icon"
              title={isListening ? 'Listening... click to stop' : 'Voice Input (Click to speak)'}
              onClick={toggleVoiceInput}
              style={{ 
                color: isListening ? '#EF4444' : 'var(--text-muted)',
                background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                borderColor: isListening ? 'rgba(239, 68, 68, 0.4)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* Right Controls: Model Tag & Send / Stop Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'none' }} className="shortcut-hint">
              Press ↵ to send
            </span>

            {/* Send / Stop Action Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isGenerating && !text.trim() && !attachment}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isGenerating 
                  ? '#EF4444' 
                  : text.trim() || attachment
                    ? '#F8FAFC' 
                    : 'rgba(255, 255, 255, 0.08)',
                color: isGenerating ? '#FFFFFF' : '#0B0D14',
                cursor: (!isGenerating && !text.trim() && !attachment) ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                border: 'none',
                boxShadow: (text.trim() || attachment) ? '0 2px 10px rgba(255, 255, 255, 0.2)' : 'none'
              }}
              title={isGenerating ? 'Stop Generation' : 'Send Prompt'}
            >
              {isGenerating ? (
                <Square size={13} fill="#FFFFFF" />
              ) : (
                <ArrowUp size={17} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

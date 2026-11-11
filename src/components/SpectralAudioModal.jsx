import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Sparkles, 
  RotateCcw,
  Volume2,
  FastForward,
  ChevronDown
} from 'lucide-react';
import { groqService } from '../services/groqService';
import { localIntelligence } from '../services/localIntelligence';
import { 
  elevenLabsService, 
  ELEVENLABS_VOICES, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_VOICE_ID 
} from '../services/elevenLabsService';

export const DEDICATED_VOICES = ELEVENLABS_VOICES;

export default function SpectralAudioModal({ isOpen, onClose, onSaveCallTurn }) {
  // Call state: 'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted'
  const [callState, setCallState] = useState('connecting');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => elevenLabsService.getSelectedVoiceId());
  const [selectedLanguage, setSelectedLanguage] = useState(() => elevenLabsService.getSelectedLanguage());
  const [playbackSpeed, setPlaybackSpeed] = useState(() => elevenLabsService.getPlaybackRate());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [audioLatencyMs, setAudioLatencyMs] = useState(null);

  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const callTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const interimBufferRef = useRef('');
  const hasGreetedRef = useRef(false);

  const currentVoice = ELEVENLABS_VOICES.find(v => v.id === selectedVoiceId) || ELEVENLABS_VOICES[0];
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Call duration counter
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      clearInterval(callTimerRef.current);
      return;
    }
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(callTimerRef.current);
  }, [isOpen]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Speak assistant response using the selected Indian voice (Aditi or Aarav)
  const speakResponse = useCallback(async (text) => {
    elevenLabsService.stop();

    const clean = elevenLabsService.cleanTextForSpeech(text);
    if (!clean) {
      setCallState('listening');
      startListening();
      return;
    }

    setCallState('speaking');
    isSpeakingRef.current = true;

    try {
      await elevenLabsService.speak(clean, {
        voiceId: selectedVoiceId,
        language: selectedLanguage,
        onStart: () => {
          setCallState('speaking');
          isSpeakingRef.current = true;
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setCallState('listening');
          setTimeout(() => {
            startListening();
          }, 250);
        },
        onError: () => {
          isSpeakingRef.current = false;
          setCallState('listening');
          setTimeout(() => {
            startListening();
          }, 250);
        }
      });
    } catch (e) {
      console.warn('Voice speak error in live call:', e);
      isSpeakingRef.current = false;
      setCallState('listening');
      startListening();
    }
  }, [selectedVoiceId, selectedLanguage]);

  // Process user speech and query Groq with voice-call humanoid system prompt
  const processUserSpeech = useCallback(async (spokenPrompt) => {
    const promptText = (spokenPrompt || interimBufferRef.current || '').trim();
    if (!promptText) {
      setCallState('listening');
      startListening();
      return;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop microphone recognition while thinking
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setCallState('thinking');
    setUserTranscript(promptText);
    interimBufferRef.current = '';

    const startCallTime = performance.now();

    try {
      let reply = '';

      // Check local zero-token intelligence engine first
      if (localIntelligence.canHandleLocally(promptText)) {
        const local = localIntelligence.processLocally(promptText);
        reply = local.content;
      } else if (groqService.hasApiKey()) {
        // High-speed conversational voice inference:
        // Instruct Groq to answer directly without saying "Namaste" on every reply
        const voiceSystemPrompt = `You are Pulse AI on a live phone voice call with the user.
Persona & Spoken Demeanor:
- Demeanor: Warm, friendly, direct, articulate mentor.
- Brevity (CRITICAL): Keep spoken responses concise (1 to 2 short sentences). Never output multi-paragraph essays or lists.
- Direct Answers (CRITICAL): Address the user's specific topic, interview doubts, or questions directly. Do NOT start every response with "Namaste" or "Hello" once the call is in progress.
- Formats: NEVER use markdown, bullet points, asterisks, tables, or code snippets in spoken replies. Everything must be natural conversational dialogue.
- Language: If addressed in Hindi or Hinglish, answer in fluent, natural Hindi/Hinglish. If in Kannada, answer in Kannada. If in English, answer in natural Indian English.`;

        const result = await groqService.streamChatCompletion({
          messages: [
            { role: 'system', content: voiceSystemPrompt },
            { role: 'user', content: promptText }
          ],
          modelId: 'openai/gpt-oss-20b'
        });
        reply = result.content;
      } else {
        reply = "I'm right here with you. Connect your Groq API key in Settings to unlock deep conversational answers.";
      }

      const totalLatency = Math.round(performance.now() - startCallTime);
      setAudioLatencyMs(totalLatency);
      setAssistantReply(reply);

      // Save turn to thread history
      if (onSaveCallTurn) {
        onSaveCallTurn(promptText, reply);
      }

      // Speak response immediately
      speakResponse(reply);

    } catch (err) {
      console.warn('Voice call processing error:', err);
      const fallback = "I caught that, but hit a brief network hiccup. Could you say that once more?";
      setAssistantReply(fallback);
      speakResponse(fallback);
    }
  }, [onSaveCallTurn, speakResponse]);

  // Start listening for user's voice
  const startListening = useCallback(() => {
    if (isSpeakingRef.current) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setCallState('muted');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      if (selectedLanguage === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLanguage === 'kn') {
        recognition.lang = 'kn-IN';
      } else if (selectedLanguage === 'en-IN') {
        recognition.lang = 'en-IN';
      } else if (selectedLanguage === 'en') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'en-IN'; // Default Indian English
      }

      recognition.onstart = () => {
        setCallState('listening');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const trimmed = currentTranscript.trim();
        if (trimmed) {
          setUserTranscript(trimmed);
          interimBufferRef.current = trimmed;

          // Fast silence debounce: 600ms pause triggers answer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            try { recognition.stop(); } catch (e) {}
            processUserSpeech(trimmed);
          }, 600);
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('Voice recognition error:', e);
        }
      };

      recognition.onend = () => {
        if (callState === 'listening' && !isSpeakingRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setCallState('listening');
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setCallState('listening');
    }
  }, [callState, selectedLanguage, processUserSpeech]);

  // Fast-forward: Send spoken prompt immediately without waiting for silence
  const handleFastForwardSend = () => {
    if (userTranscript.trim() && callState === 'listening') {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      processUserSpeech(userTranscript.trim());
    }
  };

  // Initialize call ONCE on modal open
  useEffect(() => {
    if (!isOpen) {
      elevenLabsService.stop();
      isSpeakingRef.current = false;
      hasGreetedRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    // Only greet once per call session!
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setUserTranscript('');
      setAssistantReply('');
      setCallState('connecting');

      const initTimer = setTimeout(() => {
        const greeting = selectedLanguage === 'hi'
          ? "नमस्ते! मैं पल्स एआई हूँ। आप क्या पूछना चाहते हैं?"
          : selectedLanguage === 'kn'
          ? "ನಮಸ್ಕಾರ! ನಾನು ಪಲ್ಸ್ ಎಐ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
          : "Namaste! I'm Pulse. How can I help you today?";

        setAssistantReply(greeting);
        speakResponse(greeting);
      }, 350);

      return () => {
        clearTimeout(initTimer);
        elevenLabsService.stop();
      };
    }
  }, [isOpen]); // Only re-run when modal opens or closes!

  // Dynamic Multi-Harmonic Particle & Orbital Wave Canvas Visualizer
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let t = 0;

    const particles = Array.from({ length: 20 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 45 + Math.random() * 50,
      speed: 0.01 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.6
    }));

    const render = () => {
      const width = (canvas.width = 480);
      const height = (canvas.height = 240);
      ctx.clearRect(0, 0, width, height);

      t += 0.035;

      const centerX = width / 2;
      const centerY = height / 2;

      let primaryColor = '#00D68F';
      let secondaryColor = '#0070F3';
      let glowColor = 'rgba(0, 214, 143, 0.4)';
      let baseRadius = 54;

      if (callState === 'speaking') {
        primaryColor = '#38BDF8';
        secondaryColor = '#8B2BE2';
        glowColor = 'rgba(56, 189, 248, 0.55)';
        baseRadius = 62 + Math.sin(t * 5) * 6;
      } else if (callState === 'thinking') {
        primaryColor = '#8B2BE2';
        secondaryColor = '#FFB800';
        glowColor = 'rgba(139, 43, 226, 0.5)';
        baseRadius = 50 + Math.sin(t * 3) * 4;
      } else if (callState === 'muted') {
        primaryColor = '#EF4444';
        secondaryColor = '#F97316';
        glowColor = 'rgba(239, 68, 68, 0.35)';
        baseRadius = 46;
      } else if (callState === 'listening') {
        primaryColor = '#00D68F';
        secondaryColor = '#38BDF8';
        glowColor = 'rgba(0, 214, 143, 0.45)';
        baseRadius = 56 + Math.sin(t * 2.5) * 4;
      }

      // Orbital energy rings
      const rings = 3;
      for (let r = 1; r <= rings; r++) {
        const ringRadius = baseRadius + r * 22 + Math.sin(t * 2 + r) * 6;
        const ringGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          ringRadius * 0.6,
          centerX,
          centerY,
          ringRadius
        );
        ringGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        ringGrad.addColorStop(0.85, `${glowColor}`);
        ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = 2.5 - r * 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Particles
      particles.forEach((p) => {
        p.angle += p.speed * (callState === 'speaking' || callState === 'thinking' ? 1.8 : 1);
        const px = centerX + Math.cos(p.angle) * (p.dist + Math.sin(t * 2) * 8);
        const py = centerY + Math.sin(p.angle) * (p.dist * 0.75 + Math.cos(t * 2) * 6);

        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Core orb
      const coreGrad = ctx.createRadialGradient(
        centerX - 8,
        centerY - 8,
        6,
        centerX,
        centerY,
        baseRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.28, primaryColor);
      coreGrad.addColorStop(0.8, secondaryColor);
      coreGrad.addColorStop(1, '#080B14');

      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = callState === 'speaking' ? 36 : 22;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fluid sine wave ripple when speaking
      if (callState === 'speaking') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const waveWidth = baseRadius * 1.3;
        for (let x = -waveWidth; x <= waveWidth; x += 3) {
          const y = Math.sin((x / 14) + t * 6) * 10 * Math.cos((x / waveWidth) * (Math.PI / 2));
          if (x === -waveWidth) {
            ctx.moveTo(centerX + x, centerY + y);
          } else {
            ctx.lineTo(centerX + x, centerY + y);
          }
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, callState]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    if (callState === 'muted') {
      startListening();
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      elevenLabsService.stop();
      isSpeakingRef.current = false;
      setCallState('muted');
    }
  };

  const handleInterrupt = () => {
    elevenLabsService.stop();
    isSpeakingRef.current = false;
    setCallState('listening');
    startListening();
  };

  const handleEndCall = () => {
    elevenLabsService.stop();
    isSpeakingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    onClose();
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1.0;
    setPlaybackSpeed(nextSpeed);
    elevenLabsService.setPlaybackRate(nextSpeed);
  };

  const selectVoice = (id) => {
    setSelectedVoiceId(id);
    elevenLabsService.saveSelectedVoiceId(id);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 6, 14, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        style={{
          width: '92%',
          maxWidth: '540px',
          background: 'linear-gradient(180deg, rgba(17, 21, 38, 0.98) 0%, rgba(10, 13, 26, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '32px',
          padding: '24px 26px',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.95), 0 0 60px -10px rgba(0, 214, 143, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Top Header Bar: Status, Timer, 2-Voice Switcher, Language */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          
          {/* Status & Live Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '9px', 
              height: '9px', 
              borderRadius: '50%', 
              background: callState === 'speaking' ? '#38BDF8' : callState === 'listening' ? '#00D68F' : callState === 'thinking' ? '#8B2BE2' : '#EF4444',
              boxShadow: `0 0 10px ${callState === 'speaking' ? '#38BDF8' : callState === 'listening' ? '#00D68F' : '#8B2BE2'}`
            }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
              Pulse Live Call
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ({formatTime(callDuration)})
            </span>
            {audioLatencyMs && (
              <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(0, 214, 143, 0.1)', color: '#00D68F', fontWeight: 600 }}>
                {audioLatencyMs}ms
              </span>
            )}
          </div>

          {/* Right Controls: 2-Voice Switcher Pill & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Speed toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              title={`Voice speed: ${playbackSpeed}x`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8F0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {playbackSpeed}x
            </button>

            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown size={11} />
              </button>

              {showLangMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '125%',
                    right: 0,
                    zIndex: 40,
                    width: '180px',
                    background: '#12162A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)'
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        elevenLabsService.saveSelectedLanguage(lang.id);
                        setShowLangMenu(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: lang.id === selectedLanguage ? 'rgba(0, 214, 143, 0.15)' : 'transparent',
                        border: 'none',
                        color: lang.id === selectedLanguage ? '#00D68F' : '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleEndCall}
              title="Close call"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ONLY TWO VOICES: Dedicated Clean Voice Toggle */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '3px',
            marginBottom: '8px',
            gap: '4px'
          }}
        >
          {ELEVENLABS_VOICES.map((v) => {
            const isSelected = selectedVoiceId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => selectVoice(v.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0, 214, 143, 0.18)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(0, 214, 143, 0.45)' : 'transparent'}`,
                  color: isSelected ? '#00D68F' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.16s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? '#00D68F' : v.color }} />
                <span>{v.name} ({v.gender})</span>
              </button>
            );
          })}
        </div>

        {/* Live Visualizer Canvas with Organic Harmonic Glow */}
        <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Dynamic Status Title */}
        <div style={{ textAlign: 'center', margin: '2px 0 12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>
            {callState === 'listening' ? 'Listening...' : callState === 'thinking' ? 'Pulse is thinking...' : callState === 'speaking' ? `Pulse (${currentVoice.name}) is speaking...` : callState === 'muted' ? 'Microphone Muted' : 'Connecting live call...'}
          </h3>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {callState === 'listening' 
              ? 'Ask your interview doubts or questions naturally.' 
              : callState === 'speaking' 
              ? 'Tap Interrupt anytime to speak over Pulse.' 
              : 'Direct 1-on-1 voice conversation.'}
          </p>
        </div>

        {/* Real-time Subtitles / Live Transcript Box */}
        <div 
          style={{
            width: '100%',
            minHeight: '80px',
            maxHeight: '120px',
            overflowY: 'auto',
            background: 'rgba(5, 7, 16, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '13px',
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
            marginBottom: '18px'
          }}
        >
          {userTranscript && (
            <div style={{ marginBottom: '6px', color: '#38BDF8' }}>
              <span style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--text-muted)' }}>You: </span>
              {userTranscript}
            </div>
          )}
          {assistantReply && (
            <div style={{ color: '#E2E8F0' }}>
              <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#00D68F' }}>Pulse ({currentVoice.name}): </span>
              {assistantReply}
            </div>
          )}
          {!userTranscript && !assistantReply && (
            <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
              Ask an interview question or doubt to begin...
            </span>
          )}
        </div>

        {/* In-Call Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', width: '100%' }}>
          
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={callState === 'muted' ? 'Unmute microphone' : 'Mute microphone'}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: callState === 'muted' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${callState === 'muted' ? '#EF4444' : 'rgba(255, 255, 255, 0.16)'}`,
              color: callState === 'muted' ? '#EF4444' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            {callState === 'muted' ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            title="End voice call"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              border: 'none',
              color: '#FFFFFF',
              boxShadow: '0 8px 26px rgba(239, 68, 68, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <PhoneOff size={24} />
          </button>

          {/* Dynamic Action Button: "Send Now" when listening / "Interrupt" when speaking */}
          {callState === 'speaking' ? (
            <button
              type="button"
              onClick={handleInterrupt}
              title="Interrupt Pulse & speak"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <RotateCcw size={19} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFastForwardSend}
              disabled={!userTranscript.trim() || callState !== 'listening'}
              title="Send speech immediately"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: userTranscript.trim() && callState === 'listening' ? 'rgba(0, 214, 143, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${userTranscript.trim() && callState === 'listening' ? '#00D68F' : 'rgba(255, 255, 255, 0.1)'}`,
                color: userTranscript.trim() && callState === 'listening' ? '#00D68F' : 'var(--text-faint)',
                cursor: userTranscript.trim() && callState === 'listening' ? 'pointer' : 'default',
                opacity: userTranscript.trim() && callState === 'listening' ? 1 : 0.45,
                transition: 'all 0.18s ease'
              }}
            >
              <FastForward size={19} />
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

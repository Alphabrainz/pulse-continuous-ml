/**
 * Pulse AI — ElevenLabs Multilingual Neural Voice Service
 * 
 * Clean, ultra-fast neural voice synthesis with exactly TWO pristine Indian voices:
 * 1. Aditi (Female - Warm, expressive, natural Indian English & Hindi)
 * 2. Aarav (Male - Crisp, articulate, deep Indian English & Hindi)
 * 
 * Features strict single-session audio locking (prevents overlapping/fighting audio),
 * low-latency Turbo v2.5 streaming, and reliable Indic browser fallback.
 */

const STORAGE_KEYS = {
  API_KEY: 'pulse_elevenlabs_api_key',
  VOICE_ID: 'pulse_elevenlabs_voice_id',
  LANGUAGE: 'pulse_elevenlabs_language',
  PLAYBACK_SPEED: 'pulse_elevenlabs_speed'
};

// ElevenLabs API key (configured via environment or settings modal)
const DEFAULT_ELEVENLABS_KEY = '';

// Only TWO pristine Indian voices
export const ELEVENLABS_VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Aditi',
    gender: 'Female',
    desc: 'Warm, expressive Indian female voice — authentic Indian English & Hindi',
    category: 'Conversational',
    color: '#00D68F',
    badge: '🇮🇳 Female'
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'Aarav',
    gender: 'Male',
    desc: 'Crisp, articulate Indian male voice — deep natural Indian English & Hindi',
    category: 'Professional',
    color: '#0070F3',
    badge: '🇮🇳 Male'
  }
];

export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Aditi

export const SUPPORTED_LANGUAGES = [
  { id: 'auto', label: 'Auto-Detect', flag: '🌐', desc: 'Auto-detects Indian English or Hindi' },
  { id: 'en-IN', label: 'Indian English', flag: '🇮🇳', desc: 'Natural Indian English cadence' },
  { id: 'hi', label: 'Hindi (हिन्दी)', flag: '🇮🇳', desc: 'Native Devanagari & Hinglish' },
  { id: 'kn', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', desc: 'Native Kannada & Kanglish' }
];

export class ElevenLabsService {
  constructor() {
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.currentAudio = null;
    this.currentAudioUrl = null;
    this.audioCache = new Map();
    this.currentSessionId = 0;
    this.isPlayingState = false;
    this.playbackRate = Number(localStorage.getItem(STORAGE_KEYS.PLAYBACK_SPEED)) || 1.0;
    this.abortController = null;
    
    // Pre-cache browser voices
    this.cachedBrowserVoices = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          this.cachedBrowserVoices = window.speechSynthesis.getVoices() || [];
        } catch (e) {}
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  getApiKey() {
    const saved = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (saved && saved.trim()) return saved.trim();
    if (import.meta.env?.VITE_ELEVENLABS_API_KEY) return import.meta.env.VITE_ELEVENLABS_API_KEY.trim();
    return DEFAULT_ELEVENLABS_KEY;
  }

  saveApiKey(key) {
    if (key !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    }
  }

  getSelectedVoiceId() {
    const saved = localStorage.getItem(STORAGE_KEYS.VOICE_ID);
    // Strict clamp: only Aditi or Aarav
    if (saved === 'JBFqnCBsd6RMkjVDRZzb') return 'JBFqnCBsd6RMkjVDRZzb';
    return DEFAULT_VOICE_ID;
  }

  saveSelectedVoiceId(voiceId) {
    // Only allow Aditi or Aarav
    const idToSave = (voiceId === 'JBFqnCBsd6RMkjVDRZzb') ? 'JBFqnCBsd6RMkjVDRZzb' : DEFAULT_VOICE_ID;
    localStorage.setItem(STORAGE_KEYS.VOICE_ID, idToSave);
  }

  getEffectiveVoiceId() {
    return this.getSelectedVoiceId();
  }

  getCustomVoiceId() {
    return localStorage.getItem('pulse_elevenlabs_custom_voice_id') || '';
  }

  saveCustomVoiceId(voiceId) {
    if (voiceId !== undefined) {
      localStorage.setItem('pulse_elevenlabs_custom_voice_id', voiceId.trim());
    }
  }

  getSelectedLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'auto';
  }

  saveSelectedLanguage(lang) {
    if (lang) {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    }
  }

  getPlaybackRate() {
    return this.playbackRate;
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_SPEED, String(rate));
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  detectLanguage(text) {
    if (!text) return 'en-IN';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    const lower = text.toLowerCase();
    if (/\b(namaste|kaise|kya|shukriya|haan|nahi|theek|bhai|ji|dhanyavad|kripya)\b/.test(lower)) {
      return 'hi';
    }
    return 'en-IN';
  }

  cleanTextForSpeech(rawText) {
    if (!rawText) return '';
    return rawText
      .replace(/```[\s\S]*?```/g, ' [Code example] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\$\$[\s\S]*?\$\$/g, ' [formula] ')
      .replace(/\\\[[\s\S]*?\\\]/g, ' [formula] ')
      .replace(/\$([^$\n]+)\$/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~#]/g, '')
      .replace(/^[>•\-*]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  splitIntoSentences(text) {
    const clean = this.cleanTextForSpeech(text);
    if (!clean) return [];

    const rawSentences = clean.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [clean];
    const sentences = [];

    let current = '';
    for (const chunk of rawSentences) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      if (current && (current.length + trimmed.length < 90)) {
        current += ' ' + trimmed;
      } else {
        if (current) sentences.push(current);
        current = trimmed;
      }
    }
    if (current) sentences.push(current);

    return sentences.length > 0 ? sentences : [clean];
  }

  /**
   * Hard stop: Immediately terminates all audio playback, cancels pending promises,
   * invalidates session IDs, and clears browser speech synthesis.
   * Guarantees zero overlapping audio ("fighting").
   */
  stop() {
    // Invalidate session so in-flight requests abort
    this.currentSessionId++;
    this.isPlayingState = false;

    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {}
      this.abortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch (e) {}
      this.currentAudioUrl = null;
    }

    // Cancel browser speech synthesis completely
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  isPlaying() {
    return this.isPlayingState;
  }

  /**
   * Fetch audio buffer from ElevenLabs Turbo v2.5 with Indian acoustic parameters
   */
  async _fetchAudioBlob(text, voiceId, apiKey, signal) {
    const cacheKey = `${voiceId}:${text.slice(0, 100)}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    const url = `${this.baseUrl}/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4&output_format=mp3_44100_128`;

    const body = {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.85,
        style: 0.12,
        use_speaker_boost: true
      }
    };

    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      // Fallback to multilingual v2 if turbo not accessible
      body.model_id = 'eleven_multilingual_v2';
      res = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body),
        signal
      });
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.detail?.message || errData.message || `Status ${res.status}`;
      throw new Error(`ElevenLabs error: ${msg}`);
    }

    const blob = await res.blob();
    if (this.audioCache.size > 25) {
      const first = this.audioCache.keys().next().value;
      this.audioCache.delete(first);
    }
    this.audioCache.set(cacheKey, blob);
    return blob;
  }

  /**
   * Single-stream speech executor: guarantees exactly ONE audio stream plays at a time.
   */
  async speak(text, options = {}) {
    // 1. Immediately kill any current audio
    this.stop();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) {
      if (options.onEnd) options.onEnd();
      return null;
    }

    // Allocate brand-new session ID
    const sessionId = this.currentSessionId;
    this.isPlayingState = true;

    const apiKey = options.apiKey || this.getApiKey();
    // Clamp to either Aditi or Aarav
    const voiceId = (options.voiceId === 'JBFqnCBsd6RMkjVDRZzb') ? 'JBFqnCBsd6RMkjVDRZzb' : DEFAULT_VOICE_ID;
    const selectedLang = options.language || this.getSelectedLanguage();
    const effectiveLang = selectedLang === 'auto' ? this.detectLanguage(clean) : selectedLang;

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    if (options.onStart) options.onStart();

    // If text is concise (< 350 chars), play directly as a single pristine audio stream
    if (clean.length < 350) {
      try {
        const blob = await this._fetchAudioBlob(clean, voiceId, apiKey, signal);
        if (this.currentSessionId !== sessionId || signal.aborted) return null;
        return await this._playSingleBlob(blob, sessionId, options);
      } catch (err) {
        if (this.currentSessionId !== sessionId || signal.aborted) return null;
        console.warn('ElevenLabs speech failed, using native Indian browser voice:', err.message);
        return this._fallbackBrowserSpeech(clean, effectiveLang, sessionId, options);
      }
    }

    // For longer text, split into sentences
    const sentences = this.splitIntoSentences(clean);
    const queue = sentences.slice(0, 10);

    try {
      const firstBlob = await this._fetchAudioBlob(queue[0], voiceId, apiKey, signal);
      if (this.currentSessionId !== sessionId || signal.aborted) return null;
      return await this._playQueueLoop(queue, 0, firstBlob, voiceId, apiKey, signal, sessionId, effectiveLang, options);
    } catch (err) {
      if (this.currentSessionId !== sessionId || signal.aborted) return null;
      console.warn('ElevenLabs speech failed, using native Indian browser voice:', err.message);
      return this._fallbackBrowserSpeech(clean, effectiveLang, sessionId, options);
    }
  }

  _playSingleBlob(blob, sessionId, options) {
    return new Promise((resolve) => {
      if (this.currentSessionId !== sessionId) {
        resolve(null);
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      this.currentAudioUrl = audioUrl;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.playbackRate;

      audio.onended = () => {
        try { URL.revokeObjectURL(audioUrl); } catch (e) {}
        if (this.currentSessionId === sessionId) {
          this.isPlayingState = false;
          if (options.onEnd) options.onEnd();
        }
        resolve(audio);
      };

      audio.onerror = (e) => {
        try { URL.revokeObjectURL(audioUrl); } catch (err) {}
        if (this.currentSessionId === sessionId) {
          this.isPlayingState = false;
          if (options.onError) options.onError(e);
          if (options.onEnd) options.onEnd();
        }
        resolve(null);
      };

      audio.play().catch((err) => {
        if (this.currentSessionId === sessionId) {
          this.isPlayingState = false;
          if (options.onError) options.onError(err);
        }
        resolve(null);
      });
    });
  }

  async _playQueueLoop(queue, index, currentBlob, voiceId, apiKey, signal, sessionId, lang, options) {
    if (this.currentSessionId !== sessionId || signal.aborted || index >= queue.length) {
      this.stop();
      if (options.onEnd) options.onEnd();
      return null;
    }

    // Pre-fetch next sentence in background
    let nextBlobPromise = null;
    if (index + 1 < queue.length) {
      nextBlobPromise = this._fetchAudioBlob(queue[index + 1], voiceId, apiKey, signal).catch(() => null);
    }

    return new Promise((resolve) => {
      const audioUrl = URL.createObjectURL(currentBlob);
      this.currentAudioUrl = audioUrl;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.playbackRate;

      audio.onended = async () => {
        try { URL.revokeObjectURL(audioUrl); } catch (e) {}

        if (this.currentSessionId !== sessionId || signal.aborted) {
          resolve(null);
          return;
        }

        if (index + 1 < queue.length) {
          try {
            const nextBlob = nextBlobPromise ? await nextBlobPromise : null;
            if (nextBlob && this.currentSessionId === sessionId) {
              const res = await this._playQueueLoop(queue, index + 1, nextBlob, voiceId, apiKey, signal, sessionId, lang, options);
              resolve(res);
              return;
            }
          } catch (e) {}
        }

        // All finished
        this.isPlayingState = false;
        if (options.onEnd) options.onEnd();
        resolve(audio);
      };

      audio.onerror = () => {
        try { URL.revokeObjectURL(audioUrl); } catch (e) {}
        this.isPlayingState = false;
        if (options.onEnd) options.onEnd();
        resolve(null);
      };

      audio.play().catch(() => {
        this.isPlayingState = false;
        resolve(null);
      });
    });
  }

  _fallbackBrowserSpeech(text, lang, sessionId, options = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isPlayingState = false;
      if (options.onEnd) options.onEnd();
      return null;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    if (this.currentSessionId !== sessionId) return null;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.cachedBrowserVoices.length > 0 
      ? this.cachedBrowserVoices 
      : (window.speechSynthesis.getVoices() || []);

    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && (v.name.includes('Natural') || v.name.includes('Swara') || v.name.includes('Madhur') || v.name.includes('Google'))) || voices.find(v => v.lang.startsWith('hi'));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (lang === 'kn') {
      utterance.lang = 'kn-IN';
      const knVoice = voices.find(v => v.lang.startsWith('kn') || v.name.includes('Kannada'));
      if (knVoice) utterance.voice = knVoice;
    } else {
      utterance.lang = 'en-IN';
      const enVoice = voices.find(v => (v.lang === 'en-IN' || v.name.includes('India')) && (v.name.includes('Natural') || v.name.includes('Neerja') || v.name.includes('Prabhat') || v.name.includes('Google'))) || voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.rate = this.playbackRate;

    utterance.onend = () => {
      if (this.currentSessionId === sessionId) {
        this.isPlayingState = false;
        if (options.onEnd) options.onEnd();
      }
    };

    utterance.onerror = () => {
      if (this.currentSessionId === sessionId) {
        this.isPlayingState = false;
        if (options.onEnd) options.onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  }
}

export const elevenLabsService = new ElevenLabsService();

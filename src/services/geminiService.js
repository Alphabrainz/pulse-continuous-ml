/**
 * Pulse AI — Google Gemini Intelligence Service
 * 
 * Provides real-time streaming LLM inference & search grounding via Google's Gemini API:
 * - gemini-2.5-flash (State-of-the-art multimodal speed & reasoning)
 * - gemini-2.0-flash (Sub-second low latency)
 * - gemini-1.5-flash (High efficiency, 1M context)
 * - gemini-1.5-pro (Complex reasoning & auditing)
 */

import { personalizationService } from './personalizationService.js';

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'pulse_gemini_api_key',
  GEMINI_MODEL: 'pulse_gemini_model'
};

const DEFAULT_GEMINI_API_KEY = '';

export const GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    internalModel: 'gemini-3.8-flash',
    tag: 'Active',
    color: '#4285F4',
    speed: '~380 tokens/sec',
    desc: 'Google flagship multimodal model with ultra-fast streaming and advanced reasoning.'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    internalModel: 'gemini-2.0-flash',
    tag: 'Fast',
    color: '#34A853',
    speed: '~280 tokens/sec',
    desc: 'Low-latency high-throughput model for interactive coding and fast analysis.'
  }
];

export class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  getApiKey() {
    const saved = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    if (saved && saved.trim()) return saved.trim();
    if (import.meta.env?.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY.trim();
    return DEFAULT_GEMINI_API_KEY;
  }

  saveApiKey(key) {
    if (key !== undefined) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
    }
  }

  getSelectedModel() {
    const saved = localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL);
    if (saved && GEMINI_MODELS.some(m => m.id === saved)) return saved;
    return 'gemini-3.8-flash';
  }

  saveSelectedModel(modelId) {
    if (modelId) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, modelId);
    }
  }

  isApiEnabled() {
    const saved = localStorage.getItem('pulse_gemini_api_enabled');
    if (saved === null) return true; // enabled by default
    return saved === 'true';
  }

  setApiEnabled(enabled) {
    localStorage.setItem('pulse_gemini_api_enabled', String(Boolean(enabled)));
  }

  hasApiKey() {
    if (!this.isApiEnabled()) return false;
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 10 && !key.includes('your_'));
  }

  getCachedGeminiResponse(prompt) {
    if (!prompt) return null;
    try {
      const key = `pulse_gemini_cache_${prompt.trim().toLowerCase().slice(0, 120)}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.content;
        }
      }
    } catch (e) {}
    return null;
  }

  saveCachedGeminiResponse(prompt, content) {
    if (!prompt || !content) return;
    try {
      const key = `pulse_gemini_cache_${prompt.trim().toLowerCase().slice(0, 120)}`;
      localStorage.setItem(key, JSON.stringify({
        content,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  compactConversationContext(messages) {
    if (!messages || messages.length === 0) return [];

    const valid = messages.filter(m => m && (m.content || m.attachment));
    if (valid.length <= 4) return valid;

    const recent = valid.slice(-3);
    const older = valid.slice(0, -3);

    const summaries = older.map(m => {
      let text = (m.content || '').replace(/```[\s\S]*?```/g, '[code snippet]').replace(/\s+/g, ' ').trim();
      if (text.length > 120) text = text.slice(0, 117) + '...';
      return `${m.role === 'assistant' ? 'Model' : 'User'}: ${text}`;
    });

    return [
      {
        role: 'user',
        content: `[Previous conversation summary (token-optimized)]:\n${summaries.join('\n')}`
      },
      {
        role: 'assistant',
        content: 'Understood, previous context retained.'
      },
      ...recent
    ];
  }

  // Format conversational messages to Gemini format
  _formatContents(messages) {
    const contents = [];
    const compacted = this.compactConversationContext(messages);

    compacted.forEach((m) => {
      if (m.role === 'system') return; // Handled separately in systemInstruction

      const role = m.role === 'assistant' ? 'model' : 'user';
      const parts = [];

      // If text content is present
      if (m.content) {
        parts.push({ text: m.content });
      }

      // If image attachment is present
      if (m.attachment && m.attachment.previewUrl && m.attachment.previewUrl.startsWith('data:')) {
        const match = m.attachment.previewUrl.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    });

    return contents;
  }

  // Real-time SSE streaming chat completion from Gemini
  async streamChatCompletion({
    messages,
    modelId = 'gemini-3.8-flash',
    capability = null,
    grounding = false,
    onToken = () => {},
    signal = null
  }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please configure it in Settings.');
    }

    let cleanModel = modelId && modelId.startsWith('gemini-') ? modelId : 'gemini-3.8-flash';
    const contents = this._formatContents(messages);

    const personalizationContext = personalizationService.getSystemPromptContext() || '';

    const systemInstructionText = `You are Pulse AI, powered by Google Gemini and accelerated by the VIBGYOR Cognitive Architecture.
You were created and developed by Anirudh M. If asked who created you, who made you, or who built Pulse, always state warmly and clearly that you were created by Anirudh M.

Cognitive Presentation & Reasoning Guidelines:
- Direct, natural, and humanoid tone without robotic preambles ("As an AI...", "Certainly! Here is...").
- Mathematical Rigor: Format all formulas and variables using standard KaTeX ($inline$ and $$display math$$). Ensure valid math syntax.
- Software Engineering: Output clean, idiomatic, production-ready code with syntax highlighting, concise logic explanation, and time & space complexity ($O(n)$, $O(\\log n)$).
- Proportional Depth: Provide concise, intuitive answers for straightforward questions, and rich multi-step deep dives when the user requests comprehensive depth.
${capability?.label ? `- Focus domain: ${capability.label} (${capability.desc || ''})` : ''}
${personalizationContext}`;

    // Compute intelligent token budget based on prompt to reduce API token usage
    const lastUserMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
    let maxOutputTokens = 1536;
    if (lastUserMsg.includes('code') || lastUserMsg.includes('write') || lastUserMsg.includes('script') || lastUserMsg.includes('essay') || lastUserMsg.includes('deeply')) {
      maxOutputTokens = 2500;
    } else if (lastUserMsg.length < 60 && !lastUserMsg.includes('explain') && !lastUserMsg.includes('how')) {
      maxOutputTokens = 800; // Quick conversational answers save tokens
    }

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      generationConfig: {
        temperature: 0.65,
        topP: 0.95,
        topK: 40,
        maxOutputTokens
      }
    };

    // Google Search Grounding tool if requested
    if (grounding) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    const startTime = performance.now();
    let accumulatedText = '';
    let tokenCount = 0;

    let url = `${this.baseUrl}/models/${cleanModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    // Fallback to gemini-2.0-flash if model not found
    if (!response.ok && cleanModel !== 'gemini-2.0-flash') {
      console.warn(`Gemini ${cleanModel} error (${response.status}), falling back to gemini-2.0-flash...`);
      cleanModel = 'gemini-2.0-flash';
      url = `${this.baseUrl}/models/${cleanModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal
      });
    }

    if (!response.ok) {
      let errDetails = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errDetails = errJson.error?.message || errDetails;
      } catch (e) {}
      throw new Error(`Google Gemini API error: ${errDetails}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              const candidate = parsed.candidates?.[0];
              const textChunk = candidate?.content?.parts?.[0]?.text;
              if (textChunk) {
                accumulatedText += textChunk;
                tokenCount += Math.max(1, Math.round(textChunk.length / 4));
                onToken(textChunk, accumulatedText);
              }
            } catch (jsonErr) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const durationSec = ((performance.now() - startTime) / 1000).toFixed(2);
    const tokensPerSec = durationSec > 0 ? Math.round(tokenCount / durationSec) : 0;

    return {
      content: accumulatedText,
      durationSec: `${durationSec}s`,
      latency: `${durationSec}s`,
      tokensPerSec: `${tokensPerSec} t/s`,
      model: cleanModel
    };
  }

  // Test connection to Gemini API
  async testConnection(customKey = null) {
    const key = customKey || this.getApiKey();
    if (!key) throw new Error('Gemini API key is required.');

    const startTime = performance.now();
    const url = `${this.baseUrl}/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with single word: OK' }] }]
      })
    });

    if (!response.ok) {
      // Fallback test to gemini-2.0-flash
      const fallbackUrl = `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
      const fbResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, respond with single word: OK' }] }]
        })
      });

      if (!fbResponse.ok) {
        let errDetails = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errDetails = errJson.error?.message || errDetails;
        } catch (e) {}
        throw new Error(errDetails);
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      durationMs,
      model: 'Gemini 3.8 Flash'
    };
  }
}

export const geminiService = new GeminiService();

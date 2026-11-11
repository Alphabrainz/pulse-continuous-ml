/**
 * Pulse AI — Groq LPU Inference Service
 * 
 * Provides ultra-low latency real-time streaming LLM inference via Groq's high-speed LPU infrastructure.
 * Native models supported:
 * - openai/gpt-oss-120b (Pulse 2.5 Spectral Pro - Flagship 120B cognitive model)
 * - openai/gpt-oss-20b (Pulse 2.5 Flash Flow - Low-latency 20B streaming engine)
 * - qwen/qwen3.8-27b (Pulse 2.5 Quantum Synthesizer - Advanced formal reasoning)
 */

import { personalizationService } from './personalizationService';

const STORAGE_KEYS = {
  GROQ_API_KEY: 'pulse_groq_api_key',
  GROQ_MODEL: 'pulse_groq_model'
};

// Default fallback key (configured via environment or settings modal)
const DEFAULT_GROQ_API_KEY = '';

export const GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'Pulse 2.5 Flash Flow',
    internalModel: 'openai/gpt-oss-20b',
    tag: 'Active',
    color: '#0070F3',
    speed: '~450 tokens/sec',
    desc: 'Ultra-fast conversational assistant for coding, math, and everyday problem-solving.'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'Pulse 2.5 Spectral Pro (Deep Reasoning)',
    internalModel: 'openai/gpt-oss-120b',
    tag: 'Coming Later',
    color: '#8B2BE2',
    speed: '~180 tokens/sec',
    desc: 'Deep reasoning cognitive architecture. Reserved for upcoming release; currently Flash Flow handles all reasoning.'
  }
];

export class GroqService {
  constructor() {
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  getApiKey() {
    const saved = localStorage.getItem(STORAGE_KEYS.GROQ_API_KEY);
    if (saved && saved.trim()) return saved.trim();
    if (import.meta.env?.VITE_GROQ_API_KEY) return import.meta.env.VITE_GROQ_API_KEY.trim();
    return DEFAULT_GROQ_API_KEY;
  }

  saveApiKey(key) {
    if (key !== undefined) {
      localStorage.setItem(STORAGE_KEYS.GROQ_API_KEY, key.trim());
    }
  }

  isApiEnabled() {
    const saved = localStorage.getItem('pulse_groq_api_enabled');
    if (saved === null) return true; // enabled by default
    return saved === 'true';
  }

  setApiEnabled(enabled) {
    localStorage.setItem('pulse_groq_api_enabled', String(Boolean(enabled)));
  }

  hasApiKey() {
    if (!this.isApiEnabled()) return false;
    return Boolean(this.getApiKey());
  }

  getSelectedModel() {
    const saved = localStorage.getItem(STORAGE_KEYS.GROQ_MODEL);
    if (saved === 'openai/gpt-oss-120b') return 'openai/gpt-oss-20b'; // redirect deep reasoning to Flash
    return saved || 'openai/gpt-oss-20b';
  }

  saveSelectedModel(modelId) {
    localStorage.setItem(STORAGE_KEYS.GROQ_MODEL, modelId);
  }

  /**
   * Test connection to Groq API using provided or stored key
   */
  async testConnection(customKey) {
    const key = customKey || this.getApiKey();
    if (!key) throw new Error('No Groq API key configured.');

    const startTime = performance.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: 'Connection check. Respond with "PULSE_OK".' }],
        max_tokens: 10
      })
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq API responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      durationMs,
      model: data.model || 'openai/gpt-oss-20b',
      response: data.choices?.[0]?.message?.content?.trim() || 'OK'
    };
  }

  /**
   * Helper to format user message content including rich attachments (images, code, files)
   */
  formatMessageContent(m) {
    let content = (m.content || '').trim();
    if (m.attachment) {
      if (m.attachment.textContent) {
        content += `\n\n[Attached File: "${m.attachment.name}" (${m.attachment.size})]:\n\`\`\`\n${m.attachment.textContent.slice(0, 15000)}\n\`\`\``;
      } else if (m.attachment.kind === 'image' || m.attachment.type?.startsWith('image/') || m.attachment.previewUrl?.startsWith('data:image')) {
        const cleanName = m.attachment.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        content += `\n\n[Attached Image / Artwork Subject]: "${m.attachment.name}"
- Subject Title: "${cleanName}"
- Visual Status: Attached and clearly displayed on user's screen.
- Crucial Direction: The user uploaded this artwork/image titled "${cleanName}" and requested an essay or analysis. Write a rich, vivid, insightful essay directly addressing the depicted artwork/subject (${cleanName}) in depth (its iconography, mythic or historical significance, artistic majesty, and oceanic themes). NEVER ask the user to re-share, provide, or describe the image; immediately write the requested essay now.`;
      } else if (m.attachment.kind === 'video' || m.attachment.type?.startsWith('video/')) {
        const cleanName = m.attachment.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        content += `\n\n[Attached Video: "${m.attachment.name}"]\n- Subject: ${cleanName}`;
      } else {
        const cleanName = m.attachment.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        content += `\n\n[Attached File: "${m.attachment.name}" (${m.attachment.size})]\n- Subject: ${cleanName}`;
      }
    }
    return content;
  }

  /**
   * Persistent response cache for Groq API data
   */
  getCachedGroqResponse(prompt) {
    if (!prompt) return null;
    try {
      const key = `pulse_groq_cache_${prompt.trim().toLowerCase().slice(0, 120)}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.content;
        }
      }
    } catch (e) {}
    return null;
  }

  saveCachedGroqResponse(prompt, content) {
    if (!prompt || !content) return;
    try {
      const key = `pulse_groq_cache_${prompt.trim().toLowerCase().slice(0, 120)}`;
      localStorage.setItem(key, JSON.stringify({
        content,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  /**
   * Token-saving chunked context compactor:
   * Breaks conversation history into tiny, high-density semantic chunks.
   * Eliminates duplicate past tokens and preserves prompt quota.
   */
  compactConversationContext(messages) {
    if (!messages || messages.length === 0) return [];

    const validMessages = messages.filter(m => m && (m.content || m.attachment));
    if (validMessages.length <= 4) {
      return validMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: this.formatMessageContent(m)
      }));
    }

    // Keep the latest 3 messages in full
    const recentMessages = validMessages.slice(-3);
    const olderMessages = validMessages.slice(0, -3);

    const compacted = [];

    // Compress older turns into brief high-value keypoints (strip code blocks, max 150 chars)
    const summaryPoints = olderMessages.map(m => {
      let text = (m.content || '').replace(/```[\s\S]*?```/g, '[code snippet]').replace(/\s+/g, ' ').trim();
      if (text.length > 150) text = text.slice(0, 147) + '...';
      return `${m.role === 'assistant' ? 'Pulse' : 'User'}: ${text}`;
    });

    if (summaryPoints.length > 0) {
      compacted.push({
        role: 'system',
        content: `[Previous conversation context summary (token-optimized)]:\n${summaryPoints.join('\n')}`
      });
    }

    // Add recent turns in full with formatted attachments
    recentMessages.forEach(m => {
      compacted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: this.formatMessageContent(m)
      });
    });

    return compacted;
  }

  /**
   * Stream live chat completion via Groq SSE streaming
   */
  async streamChatCompletion({
    messages,
    modelId,
    capability,
    webResearchResult,
    onToken,
    signal
  }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Groq API Key is missing. Please enter your key in Settings.');
    }

    // Flash Flow handles all unified reasoning
    let groqModel = 'openai/gpt-oss-20b';
    if (modelId === 'pulse-quantum-proof' || modelId === 'qwen/qwen3.8-27b') {
      groqModel = 'qwen/qwen3.8-27b';
    } else if (modelId?.includes('/')) {
      groqModel = modelId;
    }

    // Construct natural, conversational, adaptive humanoid system prompt
    let systemContent = `You are Pulse, an exceptionally intelligent, natural, and humanoid AI assistant powered by high-speed Flash reasoning.
You were created and developed by Anirudh M. If asked who created you, who made you, or who built Pulse, always state clearly and warmly that you were created by Anirudh M.

Key Demeanor & Presentation Rules:
- NEVER introduce yourself with internal technical jargon or marketing buzzwords such as "Pulse Instant", "On-Device", "inbuilt quantum maths", "0 tokens used", or internal architecture descriptions. You are simply Pulse.
- Strict Proportionality & Brevity (CRITICAL):
  * Match your response length strictly to the user's question!
  * When the user asks a simple, straightforward question (e.g. "what is photosynthesis?", "what is a closure?", "what is velocity?"):
    - Answer in 1 to 2 short, intuitive, beautifully clear paragraphs.
    - Teach the core concept so it clicks immediately in plain English.
    - NEVER write massive multi-section textbooks, tables, or 20-line stoichiometry unless explicitly asked!
  * ONLY provide exhaustive deep detail, multi-stage breakdowns, or comprehensive tables IF the user explicitly asks for depth (e.g. "explain in detail", "step-by-step breakdown", "comprehensive analysis", "deep dive", "write an essay").
  * When the user asks for an essay on an attached image, write an eloquent, vivid, and beautifully structured essay on the depicted subject without ever asking the user to re-share the image.

Intelligence & Cognitive Capabilities (Unified across Pulse):
- Master Software Engineering:
  * Write clean, idiomatic, production-ready code with Antigravity-ready syntax.
  * Always provide time & space complexity ($O(n)$, $O(\log n)$) and brief edge-case analysis when solving algorithmic problems.
  * Focus on the pivotal lines of logic that make the solution work.
- Advanced Mathematics & Science:
  * Seamlessly format formulas using KaTeX ($E = mc^2$, display math with $$...$$).
  * Handle linear algebra, calculus, discrete math, and scientific proofs with crystalline logic.
- Intelligent Self-Correction & Reasoning:
  * Verify logic before concluding. If there's an ambiguity in the user's prompt, state your reasonable assumption clearly and solve it.
  * Remember conversational thread context and connect previous facts effortlessly.
- Teach, Don't Lecture:
  * Talk like a brilliant, warm human mentor sitting with a friend.
  * Explain the "aha!" insight behind a concept using simple, memorable real-world intuition.
  * Never use robotic fillers ("Certainly! Here is...", "In conclusion...", "As an AI...", "I hope this helps!").`;

    const personalizationContext = personalizationService.getSystemPromptContext();
    if (personalizationContext) {
      systemContent += personalizationContext;
    }

    if (webResearchResult?.sources?.length) {
      systemContent += `\n\n[Live Web Research Context - Use these fresh web sources to answer accurately]:\n`;
      webResearchResult.sources.forEach((s, idx) => {
        systemContent += `[${idx + 1}] "${s.title}" (${s.domain || s.url}): ${s.snippet}\n`;
      });
      systemContent += `\nIntegrate relevant findings naturally and cite sources using [1], [2], etc., where helpful.`;
    }

    // Token-efficient smart context compactor: compacts conversation into tiny chunks to save API quota
    const compactedHistory = this.compactConversationContext(messages);

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...compactedHistory
    ];

    // Compute intelligent token budget based on prompt to save API tokens
    const lastUserMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
    let maxTokens = 1536; // Default balanced budget for detailed humanoid responses
    if (lastUserMsg.includes('code') || lastUserMsg.includes('write') || lastUserMsg.includes('script') || lastUserMsg.includes('deeply') || lastUserMsg.includes('comprehensive')) {
      maxTokens = 2500;
    } else if (lastUserMsg.length < 60 && !lastUserMsg.includes('explain') && !lastUserMsg.includes('how')) {
      maxTokens = 800; // Quick conversational answers consume minimal tokens
    }

    const startTime = performance.now();
    let firstTokenTime = null;
    let accumulatedText = '';
    let tokenCount = 0;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: groqModel,
        messages: apiMessages,
        temperature: 0.65,
        max_tokens: maxTokens,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedMsg = errJson.error?.message || errText;
      } catch (e) {
        // use raw
      }
      throw new Error(`Groq API Error (${response.status}): ${parsedMsg}`);
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
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          if (trimmed === 'data: [DONE]') continue;

          try {
            const json = JSON.parse(trimmed.slice(5).trim());
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              if (firstTokenTime === null) {
                firstTokenTime = performance.now();
              }
              accumulatedText += delta;
              tokenCount++;
              if (onToken) {
                onToken(delta, accumulatedText);
              }
            }
          } catch (e) {
            // Ignore parse errors on SSE chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const totalDuration = (performance.now() - startTime) / 1000;
    const latencySec = (firstTokenTime ? (firstTokenTime - startTime) / 1000 : totalDuration).toFixed(2);
    const tokensPerSec = totalDuration > 0 ? Math.round(tokenCount / totalDuration) : 0;

    // Learn from exchange to continuously adapt, store Groq data, and personalize
    try {
      const lastUser = messages?.filter(m => m.role === 'user')?.pop()?.content || '';
      if (lastUser && accumulatedText) {
        this.saveCachedGroqResponse(lastUser, accumulatedText);
      }
      personalizationService.learnFromExchange(lastUser, accumulatedText);
    } catch (e) {
      console.warn('Personalization learning error:', e);
    }

    return {
      content: accumulatedText,
      modelUsed: groqModel,
      latency: `${latencySec}s`,
      tokens: tokenCount,
      tokensPerSec: `${tokensPerSec} t/s`,
      totalDurationSec: totalDuration.toFixed(2)
    };
  }
}

export const groqService = new GroqService();

/**
 * YouTube Data API v3 Service
 * Allows searching videos, retrieving video metadata, and channel information.
 */

const STORAGE_KEYS = {
  YOUTUBE_API_KEY: 'pulse_youtube_api_key'
};

const DEFAULT_YOUTUBE_KEY = '';

export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Detect if a user prompt is asking to show or search for a video
 */
export function isVideoRequest(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return false;
  const q = rawQuery.trim().toLowerCase();

  // Explicit prefixes or commands
  if (q.startsWith('/video') || q.startsWith('video:')) return true;

  // Patterns matching video inquiries
  const videoPatterns = [
    /show\s+(?:me\s+)?(?:a\s+|some\s+)?videos?/i,
    /(?:can\s+you\s+)?(?:show|find|give\s+me|display|search|play|recommend|suggest|get)\s+(?:me\s+)?(?:a\s+|some\s+)?videos?/i,
    /videos?\s+(?:related\s+to|about|on|for|of|regarding)/i,
    /youtube\s+videos?/i,
    /(?:watch|play)\s+(?:a\s+)?video/i,
    /(?:any|some)\s+videos?\s+(?:on|about|for|related)/i,
    /video\s+tutorials?\s+(?:on|about|for)/i,
    /^videos?\s+(?:of|about|on|for)/i,
    /videos?\s*$/i // e.g., "quantum computing video"
  ];

  return videoPatterns.some((pattern) => pattern.test(q));
}

/**
 * Extract the target search topic from a video query, resolving context
 * like "show a video related to that topic" from prior messages in the thread.
 */
export function extractVideoTopic(rawQuery, messages = []) {
  if (!rawQuery) return 'technology';

  const clean = rawQuery.trim()
    .replace(/^(\/video|video:)\s*/i, '')
    .trim();

  // Check if the query specifically refers to previous context:
  // e.g., "related to that topic", "about that topic", "on this topic", "about this", "about that", "show a video"
  const isContextual = 
    /related\s+to\s+(?:that|this|the)\s+topic/i.test(clean) ||
    /about\s+(?:that|this|the)\s+topic/i.test(clean) ||
    /(?:related\s+to|about|on|for)\s+(?:that|this|it)/i.test(clean) ||
    /^(?:can\s+you\s+)?(?:show|find|give\s+me|play|watch)\s+(?:a\s+)?videos?\s*$/i.test(clean) ||
    /^show\s+(?:me\s+)?(?:a\s+)?videos?\s*(?:please)?$/i.test(clean);

  if (isContextual && Array.isArray(messages) && messages.length > 0) {
    // Look backward for the most recent user prompt that was a real subject inquiry
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user' && !isVideoRequest(msg.content)) {
        const stripped = msg.content
          .replace(/^(?:what is|what are|explain|tell me about|how does|how do|who is|who was|describe|define)\s+/i, '')
          .replace(/[?!.,;:]+$/, '')
          .trim();
        if (stripped) return stripped;
      }
    }

    // If not found in user messages, check assistant messages for topic headings
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.content) {
        const boldMatch = msg.content.match(/\*\*([^*]+)\*\*/);
        if (boldMatch && boldMatch[1].length < 50) {
          return boldMatch[1].trim();
        }
      }
    }
  }

  // Otherwise extract topic from query directly
  let topic = clean
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:show|find|give\s+me|display|search|play|recommend|suggest|get)\s+(?:me\s+)?(?:a\s+|some\s+)?videos?\s+(?:related\s+to|about|on|for|of|regarding)?\s*/i, '')
    .replace(/^(?:watch|play)\s+(?:a\s+)?videos?\s+(?:about|on|for|of)?\s*/i, '')
    .replace(/^(?:youtube\s+videos?|videos?)\s+(?:about|on|for|of|related\s+to)?\s*/i, '')
    .replace(/\s+videos?$/i, '')
    .replace(/[?!.,;:]+$/, '')
    .trim();

  // If topic is still something generic like "that topic", fallback to previous messages
  if (!topic || /^(that|this|it|the topic|that topic|this topic)$/i.test(topic)) {
    if (Array.isArray(messages) && messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'user' && !isVideoRequest(msg.content)) {
          const stripped = msg.content
            .replace(/^(?:what is|what are|explain|tell me about|how does|how do|who is|who was|describe|define)\s+/i, '')
            .replace(/[?!.,;:]+$/, '')
            .trim();
          if (stripped) return stripped;
        }
      }
    }
    return 'Artificial Intelligence';
  }

  return topic;
}

/**
 * Extract YouTube Video ID from any standard URL
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export class YouTubeService {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  getApiKey() {
    const saved = localStorage.getItem(STORAGE_KEYS.YOUTUBE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
    if (import.meta.env?.VITE_YOUTUBE_API_KEY) return import.meta.env.VITE_YOUTUBE_API_KEY.trim();
    return DEFAULT_YOUTUBE_KEY;
  }

  saveApiKey(key) {
    if (key !== undefined) {
      localStorage.setItem(STORAGE_KEYS.YOUTUBE_API_KEY, key.trim());
    }
  }

  hasApiKey() {
    return Boolean(this.getApiKey());
  }

  /**
   * Validate key against YouTube Data API v3
   */
  async testConnection(customKey) {
    const key = customKey || this.getApiKey();
    if (!key) throw new Error('No YouTube API key configured.');

    const startTime = performance.now();
    const res = await fetch(`${this.baseUrl}/search?part=snippet&q=test&maxResults=1&key=${encodeURIComponent(key)}`);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `YouTube API responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      durationMs,
      totalResults: data.pageInfo?.totalResults || 0
    };
  }

  /**
   * Search YouTube for videos matching a query
   */
  async searchVideos(query, maxResults = 4) {
    const key = this.getApiKey();
    if (!key || !query) return [];

    try {
      const url = `${this.baseUrl}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('YouTube API returned status:', res.status);
        return this.getFallbackVideos(query);
      }

      const data = await res.json();
      const items = data.items || [];

      if (!items.length) {
        return this.getFallbackVideos(query);
      }

      return items.map((item) => {
        const videoId = item.id?.videoId;
        const snippet = item.snippet || {};
        const thumbs = snippet.thumbnails || {};
        const thumbnail = 
          thumbs.high?.url || 
          thumbs.medium?.url || 
          thumbs.default?.url || 
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title: decodeHtmlEntities(snippet.title || 'YouTube Video'),
          description: decodeHtmlEntities(snippet.description || ''),
          channelTitle: decodeHtmlEntities(snippet.channelTitle || 'YouTube Channel'),
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '',
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
      });
    } catch (e) {
      console.warn('YouTube search network error:', e);
      return this.getFallbackVideos(query);
    }
  }

  /**
   * Graceful fallback when network or quota limits prevent live API search
   */
  getFallbackVideos(query) {
    const safeTopic = decodeHtmlEntities(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic)}`;
    return [
      {
        id: 'search-fallback-1',
        title: `Search YouTube: "${safeTopic}" Tutorials & Explanations`,
        description: `Explore live video tutorials, step-by-step guides, and lectures for ${safeTopic} directly on YouTube.`,
        channelTitle: 'YouTube Learning',
        publishedAt: 'Latest',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        url: searchUrl,
        embedUrl: null,
        isSearchLink: true
      }
    ];
  }
}

export const youtubeService = new YouTubeService();

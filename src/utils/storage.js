/**
 * Pulse AI Persistent Storage Engine
 * Manages localStorage persistence for conversations, web research sources, attachments, and API keys.
 */

const STORAGE_KEYS = {
  CONVERSATIONS: 'pulse_conversations_v1',
  SETTINGS: 'pulse_settings_v1',
  ACTIVE_THREAD: 'pulse_active_thread_id_v1'
};

// Initial starter threads if storage is empty
export const SEED_THREADS = [
  {
    id: 'thread-1',
    title: 'Delaware MSA Contract Review',
    category: 'Legal',
    color: '#FF7A00',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        timestamp: '10:42 AM',
        content: 'Review this Delaware Master Services Agreement for unilateral indemnity and liability cap carve-outs.'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        timestamp: '10:42 AM',
        model: 'Pulse 2.5 Pro',
        latency: '1.2s',
        content: `Here is a concise breakdown of the Delaware MSA terms and key risk areas:

### Key Vulnerabilities Identified:

1. **Unilateral Indemnification (Section 9.2)**:
   The indemnification obligation is currently one-sided. You defend and indemnify against broad performance losses, whereas reciprocal indemnification is restricted. Under Delaware commercial law, this creates unhedged exposure.

2. **Illusionary Liability Cap (Section 11.3)**:
   While Section 11.1 sets a 12-month fee cap, Section 11.3 introduces carve-outs for confidentiality and IP. Because standard SaaS touches both, the cap is practically non-functional in serious litigation.

### Remediation Recommendations:
- Amend Section 9.2 into bilateral indemnity with mutual fault apportionment.
- Subject all confidentiality claims to a designated super-cap (e.g. 2x annual contract value) rather than uncapped exposure.`
      }
    ]
  },
  {
    id: 'thread-2',
    title: 'Topological Quantum Qubits',
    category: 'Quantum',
    color: '#00D68F',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        timestamp: 'Yesterday',
        content: 'Explain topological quantum computing and why non-Abelian anyons protect against decoherence.'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        timestamp: 'Yesterday',
        model: 'Pulse 2.5 Pro',
        latency: '0.9s',
        content: `Topological quantum computing protects quantum information by storing it **non-locally** across quasiparticle pairs called **non-Abelian anyons** (such as Majorana zero modes):

- **Geometric Invariance**: Instead of relying on vulnerable quantum spin states, quantum gates are performed by physically *braiding* anyons around one another in two-dimensional space.
- **Decoherence Immunity**: Local environmental perturbations (thermal noise, stray electromagnetic fields) cannot perturb the topological braiding knot because the information is not stored in any single local particle.
- **Fault-Tolerance**: Errors only arise if a thermal fluctuation traverses the entire physical substrate to wrap around an anyon, yielding exponential error suppression.`
      }
    ]
  }
];

export function getStoredConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(SEED_THREADS));
      return SEED_THREADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_THREADS;
  } catch (err) {
    console.error('Failed to read conversations from localStorage:', err);
    return SEED_THREADS;
  }
}

export function sanitizeConversationsForStorage(conversations) {
  if (!Array.isArray(conversations)) return [];
  // Keep only the most recent 50 conversations to prevent storage bloat
  return conversations.slice(0, 50).map(c => ({
    ...c,
    messages: (c.messages || []).map(m => {
      // Strip out huge base64 data strings (>50KB) that lock localStorage
      if (m.attachment && m.attachment.previewUrl && m.attachment.previewUrl.startsWith('data:') && m.attachment.previewUrl.length > 50000) {
        return {
          ...m,
          attachment: {
            ...m.attachment,
            previewUrl: null // keep metadata (name, size, type, kind) intact
          }
        };
      }
      return m;
    })
  }));
}

export function saveConversations(conversations) {
  try {
    const clean = sanitizeConversationsForStorage(conversations);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save conversations to localStorage:', err);
    // If quota exceeded, trim older threads and retry
    try {
      const trimmed = sanitizeConversationsForStorage(conversations.slice(0, 15));
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(trimmed));
    } catch (e) {}
  }
}

export function saveConversation(conversation) {
  const all = getStoredConversations();
  const index = all.findIndex(c => c.id === conversation.id);
  const updatedConversation = {
    ...conversation,
    updatedAt: new Date().toISOString()
  };

  let updatedList;
  if (index >= 0) {
    updatedList = [...all];
    updatedList[index] = updatedConversation;
  } else {
    updatedList = [updatedConversation, ...all];
  }
  saveConversations(updatedList);
  return updatedList;
}

export function deleteConversation(id) {
  const all = getStoredConversations();
  const updatedList = all.filter(c => c.id !== id);
  saveConversations(updatedList);
  return updatedList;
}

export function updateConversationTitle(id, newTitle) {
  const all = getStoredConversations();
  const updatedList = all.map(c => c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c);
  saveConversations(updatedList);
  return updatedList;
}

export function clearAllConversations() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_THREAD);
  } catch (e) {
    console.error(e);
  }
}

// Settings management (Search APIs, keys, optics)
const DEFAULT_SETTINGS = {
  webSearchProvider: 'brave', // 'brave' | 'google' | 'gemini'
  braveApiKey: '',
  googleApiKey: '',
  googleSearchEngineId: '',
  geminiApiKey: '',
  realWebSearchEnabled: true,
  reducedMotion: false,
  spectralIntensity: 1.0,
  soundEnabled: true,
  showReasoningTrace: false
};

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Storage statistics and vault data
export function getStorageStats() {
  const conversations = getStoredConversations();
  let totalMessages = 0;
  let webSourcesCount = 0;
  let attachmentCount = 0;

  conversations.forEach(c => {
    if (Array.isArray(c.messages)) {
      totalMessages += c.messages.length;
      c.messages.forEach(m => {
        if (m.webSources && Array.isArray(m.webSources)) {
          webSourcesCount += m.webSources.length;
        }
        if (m.attachment) {
          attachmentCount += 1;
        }
      });
    }
  });

  const rawSize = (localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || '').length + 
                  (localStorage.getItem(STORAGE_KEYS.SETTINGS) || '').length;
  const storageUsedKB = (rawSize / 1024).toFixed(1);

  return {
    conversationCount: conversations.length,
    messageCount: totalMessages,
    webSourcesCount,
    attachmentCount,
    storageUsedKB
  };
}

export function getAllStoredWebSources() {
  const conversations = getStoredConversations();
  const sources = [];
  const seenUrls = new Set();

  conversations.forEach(c => {
    if (Array.isArray(c.messages)) {
      c.messages.forEach(m => {
        if (m.webSources && Array.isArray(m.webSources)) {
          m.webSources.forEach(src => {
            if (src.url && !seenUrls.has(src.url)) {
              seenUrls.add(src.url);
              sources.push({
                ...src,
                threadId: c.id,
                threadTitle: c.title,
                timestamp: m.timestamp
              });
            }
          });
        }
      });
    }
  });

  return sources;
}

export function exportAllDataJSON() {
  const data = {
    version: '2.5',
    exportDate: new Date().toISOString(),
    conversations: getStoredConversations(),
    settings: getStoredSettings()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pulse-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDataJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.conversations && Array.isArray(data.conversations)) {
      saveConversations(data.conversations);
    }
    if (data.settings) {
      saveStoredSettings(data.settings);
    }
    return { success: true, count: data.conversations?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

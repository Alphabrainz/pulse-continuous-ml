/**
 * Pulse AI Personalization & Adaptive Memory Engine
 * Learns user preferences, retains key facts, remembers important takeaways,
 * and maintains continuous improvement across interactions.
 */

const PERSONALIZATION_KEY = 'pulse_user_personalization_v1';

class PersonalizationService {
  constructor() {
    this.memory = this.loadMemory();
  }

  loadMemory() {
    try {
      const raw = localStorage.getItem(PERSONALIZATION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse personalization memory:', e);
    }

    return {
      userName: null,
      interests: [],
      preferences: {
        tone: 'natural and friendly',
        detailLevel: 'proportional (concise for simple, detailed when asked)',
        codeLanguage: null
      },
      importantNotes: [], // { id, text, timestamp, category }
      pinnedThreadIds: [],
      interactionCount: 0
    };
  }

  saveMemory() {
    try {
      localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(this.memory));
    } catch (e) {
      console.error('Failed to save personalization memory:', e);
    }
  }

  /**
   * Record and learn from conversation exchange
   */
  learnFromExchange(userText, assistantText = '') {
    if (!userText) return;
    this.memory.interactionCount = (this.memory.interactionCount || 0) + 1;

    const lower = userText.toLowerCase();

    // 1. Detect User Name
    const nameMatch = userText.match(/(?:my name is|i am|call me)\s+([A-Z][a-z]+)/i);
    if (nameMatch && !['pulse', 'ai', 'user', 'here', 'ready'].includes(nameMatch[1].toLowerCase())) {
      this.memory.userName = nameMatch[1];
    }

    // 2. Detect Programming Language Preference
    const langMatches = ['python', 'typescript', 'javascript', 'rust', 'c++', 'go', 'sql', 'react'];
    for (const lang of langMatches) {
      if (lower.includes(`in ${lang}`) || lower.includes(`using ${lang}`) || lower.includes(`i code ${lang}`)) {
        this.memory.preferences.codeLanguage = lang;
        if (!this.memory.interests.includes(lang)) {
          this.memory.interests.push(lang);
        }
        break;
      }
    }

    // 3. Detect Explicit "Important" / "Remember this" notes
    if (lower.includes('remember this') || lower.includes('this is important') || lower.includes('mark as important') || lower.includes('save this note')) {
      const cleanNote = userText
        .replace(/(?:please\s+)?(?:remember this|this is important|mark as important|save this note)[:,-]?\s*/i, '')
        .trim();

      if (cleanNote && cleanNote.length > 5) {
        this.addImportantNote(cleanNote, 'User Flagged');
      }
    }

    this.saveMemory();
  }

  /**
   * Add a key takeaway or important item
   */
  addImportantNote(text, category = 'General') {
    if (!text) return;
    // Avoid exact duplicates
    if (this.memory.importantNotes.some(n => n.text.toLowerCase() === text.toLowerCase())) return;

    this.memory.importantNotes.unshift({
      id: `note-${Date.now()}`,
      text,
      category,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
    });

    // Cap at 30 items
    if (this.memory.importantNotes.length > 30) {
      this.memory.importantNotes.pop();
    }
    this.saveMemory();
  }

  getImportantNotes() {
    return this.memory.importantNotes || [];
  }

  removeImportantNote(id) {
    this.memory.importantNotes = (this.memory.importantNotes || []).filter(n => n.id !== id);
    this.saveMemory();
  }

  /**
   * Pin or unpin a conversation thread
   */
  togglePinThread(threadId) {
    if (!threadId) return false;
    const pins = new Set(this.memory.pinnedThreadIds || []);
    let isPinned = false;
    if (pins.has(threadId)) {
      pins.delete(threadId);
      isPinned = false;
    } else {
      pins.add(threadId);
      isPinned = true;
    }
    this.memory.pinnedThreadIds = Array.from(pins);
    this.saveMemory();
    return isPinned;
  }

  isThreadPinned(threadId) {
    return (this.memory.pinnedThreadIds || []).includes(threadId);
  }

  /**
   * Generates a context block for Groq system prompt to adapt to user
   */
  getSystemPromptContext() {
    const parts = [];
    if (this.memory.userName) {
      parts.push(`User's name: ${this.memory.userName}.`);
    }
    if (this.memory.preferences.codeLanguage) {
      parts.push(`User prefers programming in ${this.memory.preferences.codeLanguage}.`);
    }
    if (this.memory.interests && this.memory.interests.length > 0) {
      parts.push(`User interest areas: ${this.memory.interests.slice(0, 5).join(', ')}.`);
    }
    if (this.memory.importantNotes && this.memory.importantNotes.length > 0) {
      const topNotes = this.memory.importantNotes.slice(0, 4).map(n => `"${n.text}"`).join('; ');
      parts.push(`Important facts remembered: ${topNotes}.`);
    }

    if (parts.length === 0) return '';
    return `\n[Personalized User Context - Adapt naturally without being awkward]:\n${parts.join(' ')}\n`;
  }

  /**
   * Synthesize "Important Ones" response from the current thread & saved notes
   */
  synthesizeImportantOnes(currentMessages = []) {
    const importantNotes = this.getImportantNotes();
    const assistantMessages = currentMessages.filter(m => m.role === 'assistant' && m.content);

    // Extract bullet points and key takeaways from recent messages
    const threadTakeaways = [];
    for (let i = assistantMessages.length - 1; i >= 0 && threadTakeaways.length < 5; i--) {
      const text = assistantMessages[i].content;
      // Extract bold statements or top bullet points
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          (trimmed.startsWith('- **') || trimmed.startsWith('1. **') || trimmed.startsWith('• **')) &&
          trimmed.length > 15 &&
          !threadTakeaways.includes(trimmed)
        ) {
          threadTakeaways.push(trimmed);
          if (threadTakeaways.length >= 4) break;
        }
      }
    }

    let output = `Here are the **most important key takeaways**:\n\n`;

    if (threadTakeaways.length > 0) {
      output += `### From Our Conversation:\n`;
      threadTakeaways.forEach(item => {
        output += `${item}\n`;
      });
      output += `\n`;
    }

    if (importantNotes.length > 0) {
      output += `### Your Pinned & Saved Important Notes:\n`;
      importantNotes.slice(0, 5).forEach(note => {
        output += `- 📌 **${note.text}** *(${note.timestamp})*\n`;
      });
    }

    if (threadTakeaways.length === 0 && importantNotes.length === 0) {
      output = `I haven't flagged any specific items yet. You can tell me **"remember this: ..."** or click the star/pin in the sidebar on any conversation to mark it as important!`;
    }

    return output;
  }
}

export const personalizationService = new PersonalizationService();

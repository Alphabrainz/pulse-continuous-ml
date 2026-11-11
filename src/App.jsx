import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HeroHome from './components/HeroHome';
import ChatFeed from './components/ChatFeed';
import SpectralCanvas from './components/SpectralCanvas';
import ModelSelectorModal from './components/ModelSelectorModal';
import SpectralAudioModal from './components/SpectralAudioModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import PortalGatekeeper from './components/PortalGatekeeper';
import { SAMPLE_THREADS, generateSpectralResponse } from './utils/spectralIntelligence';
import { getStoredConversations, saveConversation, deleteConversation } from './utils/storage';
import { personalizationService } from './services/personalizationService';
import { webResearchService } from './services/webResearchService';
import { groqService } from './services/groqService';
import { localIntelligence } from './services/localIntelligence';
import { youtubeService, isVideoRequest, extractVideoTopic } from './services/youtubeService';
import { elevenLabsService } from './services/elevenLabsService';
import { firebaseAuthService } from './services/firebaseAuthService';
import { firebaseFirestoreService } from './services/firebaseFirestoreService';
import { isFirebaseConfigured } from './services/firebase';
import { geminiService } from './services/geminiService';

export default function App() {
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'chat'
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 900;
    }
    return true;
  });
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('optics'); // 'optics' | 'groq' | 'web-api' | 'firebase'

  // Firebase Authentication & Cloud Sync State
  const [currentUser, setCurrentUser] = useState(() => firebaseAuthService.getCurrentUser());
  const [cloudSyncStatus, setCloudSyncStatus] = useState(() => isFirebaseConfigured() ? 'offline' : 'unconfigured');

  // Settings & Accessibility state
  const [reducedMotion, setReducedMotion] = useState(false);
  const [spectralIntensity, setSpectralIntensity] = useState(1.0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Model & Capability State: Pulse 2.5 Flash Flow is the primary active model
  const [selectedModel, setSelectedModel] = useState({
    id: 'openai/gpt-oss-20b',
    name: 'Pulse 2.5 Flash Flow',
    color: '#0070F3',
    groqModel: 'openai/gpt-oss-20b'
  });
  const [selectedCapability, setSelectedCapability] = useState(null);

  // Canvas interaction mode: 'idle' | 'focused' | 'generating' | 'voice'
  const [canvasMode, setCanvasMode] = useState('idle');

  // Cloud API Gateway Status (Can be turned off to test local trained model)
  const [geminiApiEnabled, setGeminiApiEnabled] = useState(() => geminiService.isApiEnabled());
  const [groqApiEnabled, setGroqApiEnabled] = useState(() => groqService.isApiEnabled());

  const handleToggleGeminiApi = (enabled) => {
    geminiService.setApiEnabled(enabled);
    setGeminiApiEnabled(enabled);
  };

  const handleToggleGroqApi = (enabled) => {
    groqService.setApiEnabled(enabled);
    setGroqApiEnabled(enabled);
  };

  const handleToggleAllApis = (enableBoth) => {
    geminiService.setApiEnabled(enableBoth);
    groqService.setApiEnabled(enableBoth);
    setGeminiApiEnabled(enableBoth);
    setGroqApiEnabled(enableBoth);
    localIntelligence.setLocalModelOnly(!enableBoth);
  };

  // Conversational Thread State & Local Persistence
  const [conversations, setConversations] = useState(() => getStoredConversations());
  const [pinnedThreadIds, setPinnedThreadIds] = useState(() => personalizationService.memory.pinnedThreadIds || []);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const abortControllerRef = useRef(null);
  const speechVoicesRef = useRef([]);

  // Preload free voices for Web Speech API
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        speechVoicesRef.current = window.speechSynthesis.getVoices();
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Check system prefers-reduced-motion on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }
  }, []);

  // Firebase Authentication & Cloud Sync Lifecycle
  useEffect(() => {
    const unsubscribeAuth = firebaseAuthService.subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setCloudSyncStatus('syncing');
        try {
          // 1. Intelligent two-way merge with Cloud Firestore
          const merged = await firebaseFirestoreService.syncConversations(user.uid);
          if (merged && Array.isArray(merged) && merged.length > 0) {
            setConversations(merged);
          }
          // 2. Load cloud personalization memory
          const cloudPersonalization = await firebaseFirestoreService.loadPersonalization(user.uid);
          if (cloudPersonalization) {
            personalizationService.memory = { ...personalizationService.memory, ...cloudPersonalization };
            personalizationService.saveMemory();
          }
          setCloudSyncStatus('synced');
        } catch (err) {
          console.warn('Firebase initial sync warning:', err);
          setCloudSyncStatus('offline');
        }
      } else {
        setCloudSyncStatus(isFirebaseConfigured() ? 'offline' : 'unconfigured');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Update canvas mode when generating
  useEffect(() => {
    if (isGenerating) {
      setCanvasMode('generating');
    } else {
      setCanvasMode('idle');
    }
  }, [isGenerating]);

  // Acoustic chime feedback
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime); // 520Hz = Green wavelength harmonic
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.36);
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  };

  const handleOpenSettingsTab = (tab = 'optics') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Toggle pin/star thread
  const handleTogglePinThread = (threadId) => {
    personalizationService.togglePinThread(threadId);
    setPinnedThreadIds([...(personalizationService.memory.pinnedThreadIds || [])]);
  };

  // Delete thread locally and from Cloud Firestore
  const handleDeleteThread = (threadId) => {
    const updated = deleteConversation(threadId);
    setConversations(updated);
    if (currentUser && currentUser.uid) {
      firebaseFirestoreService.deleteConversation(currentUser.uid, threadId);
    }
    if (currentThreadId === threadId) {
      handleNewChat();
    }
  };

  // Switch to or load a thread
  const handleSelectThread = (thread) => {
    elevenLabsService.stop();
    setSpeakingMessageId(null);
    const all = getStoredConversations();
    const found = all.find(c => c.id === thread.id);
    if (found) {
      setCurrentThreadId(found.id);
      setMessages(found.messages || []);
      setViewMode('chat');
    } else {
      const sample = SAMPLE_THREADS[thread.id];
      if (sample) {
        setCurrentThreadId(thread.id);
        setMessages(sample.messages);
        setViewMode('chat');
      }
    }
    // Close sidebar on small screens
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Start new inquiry
  const handleNewChat = () => {
    elevenLabsService.stop();
    setSpeakingMessageId(null);
    setCurrentThreadId(null);
    setMessages([]);
    setViewMode('home');
  };

  // Persist updated conversation history into storage & Cloud Firestore
  const saveThreadHistory = (threadId, finalMessages) => {
    if (!threadId || !finalMessages || finalMessages.length === 0) return;
    const all = getStoredConversations();
    let conv = all.find(c => c.id === threadId);
    if (!conv) {
      const firstUser = finalMessages.find(m => m.role === 'user');
      const title = firstUser?.content?.slice(0, 32) || 'New Conversation';
      conv = {
        id: threadId,
        title,
        category: selectedCapability?.label || 'General',
        color: selectedModel?.color || '#0070F3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: finalMessages,
        isPinned: false
      };
    } else {
      conv.messages = finalMessages;
      conv.updatedAt = new Date().toISOString();
    }
    const updatedList = saveConversation(conv);
    setConversations(updatedList);

    // Sync in background to Firebase Cloud Firestore if user is authenticated
    if (currentUser && currentUser.uid) {
      firebaseFirestoreService.saveConversation(currentUser.uid, conv);
      setCloudSyncStatus('synced');
    }
  };

  // Handle prompt submission with live Groq LPU Streaming & Web Research API integration
  const handleSendPrompt = async ({ content, attachment, capability, grounding, webOptions }) => {
    if (!content.trim() && !attachment) return;

    // Stop any active voice reading before generating new message
    elevenLabsService.stop();
    setSpeakingMessageId(null);

    // Allocate or maintain active conversation ID
    let activeThreadId = currentThreadId;
    if (!activeThreadId) {
      activeThreadId = `thread-${Date.now()}`;
      setCurrentThreadId(activeThreadId);
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: content.trim() || (attachment ? `Review uploaded file: ${attachment.name}` : ''),
      attachment: attachment
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setViewMode('chat');
    setIsGenerating(true);

    // Save initial user message to storage immediately
    saveThreadHistory(activeThreadId, newMessages);

    // Step 1: Conduct real live Web Research if grounding is active
    let webResearchResult = null;
    if (grounding && content.trim()) {
      try {
        webResearchResult = await webResearchService.conductResearch(content.trim(), webOptions);
      } catch (e) {
        console.warn('Web research query error:', e);
      }
    }

    // Step 2: Initialize clean assistant message for real-time streaming
    const assistantId = `asst-${Date.now()}`;
    const isLocalModelTesting = (!geminiApiEnabled && !groqApiEnabled) || selectedModel.id === 'pulse-local-trained';

    const initialAssistantMsg = {
      id: assistantId,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: isLocalModelTesting ? 'Pulse Local Trained Model' : selectedModel.name,
      latency: isLocalModelTesting
        ? 'Local Model (0 tokens)'
        : (selectedModel.id.startsWith('gemini') && geminiApiEnabled && geminiService.hasApiKey())
        ? 'Connecting to Gemini...' 
        : (groqApiEnabled && groqService.hasApiKey()) 
        ? 'Connecting to Groq...' 
        : 'Thinking...',
      webResearch: (grounding && webResearchResult?.sources?.length) ? webResearchResult : null,
      reasoning: null,
      legalMatrix: null,
      codeSnippet: null,
      citations: (grounding && webResearchResult?.sources?.length) ? webResearchResult.sources : null,
      content: '',
      isStreaming: true,
      videos: null
    };

    setMessages([...newMessages, initialAssistantMsg]);

    const trimmedQuery = content.trim();

    // Step 2.05: Dedicated YouTube Video Retrieval & In-App Playback
    if (!attachment && isVideoRequest(trimmedQuery)) {
      const topic = extractVideoTopic(trimmedQuery, messages);
      let videoResults = [];
      try {
        videoResults = await youtubeService.searchVideos(topic, 4);
      } catch (err) {
        console.warn('YouTube search query error:', err);
      }

      const videoIntro = videoResults.length > 0
        ? `Here are top-rated YouTube videos exploring **${topic}**.\n\nPress any video thumbnail below to watch and play it directly here within Pulse AI on localhost:`
        : `I searched YouTube for videos related to **${topic}**, but couldn't retrieve live results right now.`;

      if (groqService.hasApiKey()) {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        let groqTokenBuffer = videoIntro;
        let groqRaf = false;

        // Mount video cards immediately so user sees pressable cards right away
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: videoIntro, videos: videoResults, isStreaming: true }
              : m
          )
        );

        try {
          const augmentedMessages = [
            ...newMessages.slice(0, -1),
            {
              role: 'user',
              content: `${newMessages[newMessages.length - 1].content}\n\n[System Directive: YouTube video cards for "${topic}" are already fetched and displayed interactively in the UI with pressable thumbnails. Provide a concise, high-value 2-3 paragraph summary explaining "${topic}" and key concepts the user will learn from these videos. Do not write out raw markdown video links, as the player cards are already embedded.]`
            }
          ];

          const result = await groqService.streamChatCompletion({
            messages: augmentedMessages,
            modelId: selectedModel.id,
            capability: capability,
            signal: abortController.signal,
            onToken: (delta, accumulated) => {
              groqTokenBuffer = `${videoIntro}\n\n${accumulated}`;
              if (!groqRaf) {
                groqRaf = true;
                requestAnimationFrame(() => {
                  groqRaf = false;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: groqTokenBuffer, videos: videoResults } : m
                    )
                  );
                });
              }
            }
          });

          const finalMsgs = [
            ...newMessages,
            {
              id: assistantId,
              role: 'assistant',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: `${videoIntro}\n\n${result.content}`,
              videos: videoResults,
              latency: result.durationSec || '0.6s',
              model: selectedModel.name,
              isStreaming: false
            }
          ];

          setMessages(finalMsgs);
          saveThreadHistory(activeThreadId, finalMsgs);
          setIsGenerating(false);
          abortControllerRef.current = null;
          playChime();
          return;
        } catch (groqErr) {
          if (groqErr.name === 'AbortError') {
            setIsGenerating(false);
            abortControllerRef.current = null;
            return;
          }
        }
      }

      // If Groq is not used or throws error, return clean response with videos
      const finalMsgs = [
        ...newMessages,
        {
          id: assistantId,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: `${videoIntro}\n\n*Click any video card to play inline on localhost:5173, or use Theater mode for an expanded view.*`,
          videos: videoResults,
          latency: '0.15s',
          model: selectedModel.name,
          isStreaming: false
        }
      ];

      setMessages(finalMsgs);
      saveThreadHistory(activeThreadId, finalMsgs);
      setIsGenerating(false);
      playChime();
      return;
    }

    // Step 2.1: Free Neural Image Generation Feature
    const isImageGenRequest = 
      /^(?:generate|create|draw|make|paint|render)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration|drawing)\s+(?:of\s+)?/i.test(trimmedQuery) ||
      /^(?:draw|paint|illustrate)\s+/i.test(trimmedQuery) ||
      trimmedQuery.toLowerCase().startsWith('generate image:') ||
      trimmedQuery.toLowerCase().startsWith('/image');

    if (!attachment && isImageGenRequest) {
      const cleanPrompt = trimmedQuery
        .replace(/^(?:generate|create|draw|make|paint|render)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration|drawing)\s+(?:of\s+)?/i, '')
        .replace(/^(?:draw|paint|illustrate)\s+/i, '')
        .replace(/^(?:generate image:|\/image)\s*/i, '')
        .trim();

      if (cleanPrompt) {
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
        const finalMsgs = [
          ...newMessages,
          {
            id: assistantId,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Here is the artwork generated for **"${cleanPrompt}"**:\n\n![${cleanPrompt}](${imageUrl})\n\n*Created using free high-definition neural image generation.*`,
            latency: '1.2s',
            model: selectedModel.name,
            isStreaming: false
          }
        ];
        setMessages(finalMsgs);
        saveThreadHistory(activeThreadId, finalMsgs);
        setIsGenerating(false);
        playChime();
        return;
      }
    }

    // Step 2.2: Dual LLM Persistent Cache Lookup (0-token fast recall)
    const cachedGemini = selectedModel.id.startsWith('gemini') ? geminiService.getCachedGeminiResponse(content) : null;
    const cachedGroq = !selectedModel.id.startsWith('gemini') ? groqService.getCachedGroqResponse(content) : null;
    const cachedResponse = cachedGemini || cachedGroq;

    if (!attachment && !grounding && cachedResponse) {
      const finalMsgs = [
        ...newMessages,
        {
          id: assistantId,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: cachedResponse,
          latency: '0.04s',
          model: selectedModel.name,
          isStreaming: false
        }
      ];
      setMessages(finalMsgs);
      saveThreadHistory(activeThreadId, finalMsgs);
      setIsGenerating(false);
      playChime();
      return;
    }

    // Step 2.5: Zero-Token Local Engine Check (Calculations, Small Talk, NLP, or Local Model Testing)
    if (!attachment && !grounding && (isLocalModelTesting || localIntelligence.canHandleLocally(content, null, isLocalModelTesting))) {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let localTokenBuffer = '';
      let localRaf = false;

      try {
        const localResult = await localIntelligence.streamLocalResponse({
          query: content,
          signal: abortController.signal,
          currentMessages: newMessages,
          onToken: (delta, accumulated) => {
            localTokenBuffer = accumulated;
            if (!localRaf) {
              localRaf = true;
              requestAnimationFrame(() => {
                localRaf = false;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: localTokenBuffer } : m
                  )
                );
              });
            }
          }
        });

        const finalMsgs = [
          ...newMessages,
          {
            id: assistantId,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: localResult.content,
            latency: isLocalModelTesting ? '0.08s (0 tokens)' : '0.1s',
            model: isLocalModelTesting ? 'Pulse Local Trained Model' : selectedModel.name,
            isStreaming: false
          }
        ];

        setMessages(finalMsgs);
        saveThreadHistory(activeThreadId, finalMsgs);
        personalizationService.learnFromExchange(content, localResult.content);

        setIsGenerating(false);
        abortControllerRef.current = null;
        playChime();
        return;
      } catch (localErr) {
        if (localErr.name === 'AbortError') {
          setIsGenerating(false);
          abortControllerRef.current = null;
          return;
        }
      }
    }

    // Step 2.9: Stream tokens from Google Gemini API if Gemini model is active and API is enabled
    if (!isLocalModelTesting && geminiApiEnabled && selectedModel.id.startsWith('gemini') && geminiService.hasApiKey()) {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let geminiTokenBuffer = '';
      let geminiRaf = false;

      try {
        const result = await geminiService.streamChatCompletion({
          messages: newMessages,
          modelId: selectedModel.id,
          capability: capability,
          grounding: grounding,
          signal: abortController.signal,
          onToken: (delta, accumulated) => {
            geminiTokenBuffer = accumulated;
            if (!geminiRaf) {
              geminiRaf = true;
              requestAnimationFrame(() => {
                geminiRaf = false;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: geminiTokenBuffer } : m
                  )
                );
              });
            }
          }
        });

        const finalMsgs = [
          ...newMessages,
          {
            id: assistantId,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: result.content,
            latency: `${result.latency} (${result.tokensPerSec})`,
            model: selectedModel.name,
            isStreaming: false
          }
        ];

        setMessages(finalMsgs);
        saveThreadHistory(activeThreadId, finalMsgs);
        personalizationService.learnFromExchange(content, result.content);
        geminiService.saveCachedGeminiResponse(content, result.content);

        setIsGenerating(false);
        abortControllerRef.current = null;
        playChime();
        return;
      } catch (geminiErr) {
        if (geminiErr.name === 'AbortError') {
          setIsGenerating(false);
          abortControllerRef.current = null;
          return;
        }
        console.warn('Gemini streaming error, falling back:', geminiErr);
      }
    }

    // Step 3: Stream tokens from Groq API in real time if key is present and API is enabled
    if (!isLocalModelTesting && groqApiEnabled && groqService.hasApiKey()) {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let groqTokenBuffer = '';
      let groqRaf = false;

      try {
        const result = await groqService.streamChatCompletion({
          messages: newMessages,
          modelId: selectedModel.id,
          capability: capability,
          webResearchResult: webResearchResult,
          signal: abortController.signal,
          onToken: (delta, accumulated) => {
            groqTokenBuffer = accumulated;
            if (!groqRaf) {
              groqRaf = true;
              requestAnimationFrame(() => {
                groqRaf = false;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: groqTokenBuffer } : m
                  )
                );
              });
            }
          }
        });

        // Cache completed response in local engine for instant recall in future
        localIntelligence.cacheGroqResponse(content, result.content);

        const finalMsgs = [
          ...newMessages,
          {
            id: assistantId,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: result.content,
            latency: `${result.latency} (${result.tokensPerSec})`,
            isStreaming: false
          }
        ];

        setMessages(finalMsgs);
        saveThreadHistory(activeThreadId, finalMsgs);
        personalizationService.learnFromExchange(content, result.content);
        groqService.saveCachedGroqResponse(content, result.content);

        setIsGenerating(false);
        abortControllerRef.current = null;
        playChime();
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user.');
          setIsGenerating(false);
          abortControllerRef.current = null;
          return;
        }
        console.warn('Groq streaming failed or offline, engaging spectral synthesis fallback:', err);
      }
    }

    // Step 4: Fallback conversational streaming if Groq is unavailable
    const fallbackResponse = generateSpectralResponse(content, capability, selectedModel, webResearchResult);
    const fullContent = fallbackResponse.content;
    let currentLength = 0;

    const step = Math.max(1, Math.floor(fullContent.length / 35));
    const interval = setInterval(() => {
      currentLength += step;
      if (currentLength >= fullContent.length) {
        clearInterval(interval);
        setMessages((prev) => 
          prev.map((m) => 
            m.id === assistantId ? { ...m, content: fullContent, latency: fallbackResponse.latency, isStreaming: false } : m
          )
        );
        setIsGenerating(false);
        playChime();
      } else {
        setMessages((prev) => 
          prev.map((m) => 
            m.id === assistantId ? { ...m, content: fullContent.slice(0, currentLength) } : m
          )
        );
      }
    }, 45);
  };

  // Stop generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) => 
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  // Regenerate message
  const handleRegenerate = (msg) => {
    setIsGenerating(true);
    playChime();
    setTimeout(() => {
      setIsGenerating(false);
    }, 1200);
  };

  // ElevenLabs Multilingual Neural Voice Reading (English, Hindi, Kannada)
  const handleSpeak = async (text, messageId) => {
    if (speakingMessageId === messageId) {
      elevenLabsService.stop();
      setSpeakingMessageId(null);
      return;
    }

    elevenLabsService.stop();
    setSpeakingMessageId(messageId);

    try {
      await elevenLabsService.speak(text, {
        onStart: () => {
          setSpeakingMessageId(messageId);
        },
        onEnd: () => {
          setSpeakingMessageId(null);
        },
        onError: () => {
          setSpeakingMessageId(null);
        }
      });
    } catch (e) {
      console.warn('ElevenLabs speech synthesis error:', e);
      setSpeakingMessageId(null);
    }
  };

  // Save voice call exchange into thread history
  const handleSaveVoiceCallExchange = (userPrompt, assistantReply) => {
    let activeThreadId = currentThreadId;
    if (!activeThreadId) {
      activeThreadId = `thread-${Date.now()}`;
      setCurrentThreadId(activeThreadId);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      timestamp: timeStr,
      content: userPrompt
    };

    const asstMsg = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      timestamp: timeStr,
      model: selectedModel.name,
      content: assistantReply,
      latency: '0.4s',
      isStreaming: false
    };

    setMessages(prev => {
      const updated = [...prev, userMsg, asstMsg];
      saveThreadHistory(activeThreadId, updated);
      return updated;
    });
  };

  const handleSignOut = async () => {
    try {
      await firebaseAuthService.logOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    setCurrentUser(null);
  };

  // Gatekeeper Mode: Ask user to Sign Up / Sign In via Inbuilt Firebase API before entering Pulse Portal
  if (!currentUser) {
    return (
      <div 
        className={`pulse-app-root ${reducedMotion ? 'reduced-motion' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-midnight)',
          color: 'var(--text-primary)',
          position: 'relative'
        }}
      >
        <SpectralCanvas 
          mode="focused"
          reducedMotion={reducedMotion}
          intensity={spectralIntensity}
          interactive={true}
        />
        <PortalGatekeeper 
          onAuthenticated={(user) => {
            setCurrentUser(user);
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`pulse-app-root ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-midnight)',
        color: 'var(--text-primary)',
        position: 'relative'
      }}
    >
      {/* Signature Animated VIBGYOR Spectral Pulse & Flowing Ribbon */}
      <SpectralCanvas 
        mode={canvasMode}
        reducedMotion={reducedMotion}
        intensity={spectralIntensity}
        interactive={true}
      />

      {/* Top Navigation */}
      <Navbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        selectedModel={selectedModel}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenSettings={() => handleOpenSettingsTab('groq')}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onNewChat={handleNewChat}
        onOpenVoiceCall={() => setIsVoiceModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        cloudSyncStatus={cloudSyncStatus}
        geminiApiEnabled={geminiApiEnabled}
        groqApiEnabled={groqApiEnabled}
        onToggleGeminiApi={handleToggleGeminiApi}
        onToggleGroqApi={handleToggleGroqApi}
        onToggleAllApis={handleToggleAllApis}
      />

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* Sidebar History Drawer with Stored Conversations & Pinning */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          onOpenSettings={() => handleOpenSettingsTab('optics')}
          onSelectThread={handleSelectThread}
          currentThreadId={currentThreadId}
          conversations={conversations}
          onDeleteThread={handleDeleteThread}
          onTogglePinThread={handleTogglePinThread}
          pinnedThreadIds={pinnedThreadIds}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          cloudSyncStatus={cloudSyncStatus}
        />

        {/* Dynamic Content View: Spacious Home vs Calm Chat */}
        <main 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10,
            overflowY: 'auto'
          }}
        >
          {viewMode === 'home' ? (
            <HeroHome 
              onSend={handleSendPrompt}
              isGenerating={isGenerating}
              onStop={handleStop}
              onFocusChange={(focused) => setCanvasMode(focused ? 'focused' : 'idle')}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenSettings={handleOpenSettingsTab}
              selectedCapability={selectedCapability}
              onSelectCapability={setSelectedCapability}
            />
          ) : (
            <ChatFeed 
              messages={messages}
              onSend={handleSendPrompt}
              isGenerating={isGenerating}
              onStop={handleStop}
              onRegenerate={handleRegenerate}
              onFocusChange={(focused) => setCanvasMode(focused ? 'focused' : 'idle')}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenSettings={handleOpenSettingsTab}
              selectedCapability={selectedCapability}
              onSelectCapability={setSelectedCapability}
              onSpeak={handleSpeak}
              isSpeaking={Boolean(speakingMessageId)}
              speakingMessageId={speakingMessageId}
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <ModelSelectorModal 
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        geminiApiEnabled={geminiApiEnabled}
        groqApiEnabled={groqApiEnabled}
        onToggleAllApis={handleToggleAllApis}
      />

      <SpectralAudioModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSaveCallTurn={handleSaveVoiceCallExchange}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        spectralIntensity={spectralIntensity}
        setSpectralIntensity={setSpectralIntensity}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        geminiApiEnabled={geminiApiEnabled}
        groqApiEnabled={groqApiEnabled}
        onToggleGeminiApi={handleToggleGeminiApi}
        onToggleGroqApi={handleToggleGroqApi}
        onToggleAllApis={handleToggleAllApis}
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onOpenSettings={handleOpenSettingsTab}
        onSyncCompleted={async () => {
          if (currentUser && currentUser.uid) {
            const merged = await firebaseFirestoreService.syncConversations(currentUser.uid);
            setConversations(merged);
            setCloudSyncStatus('synced');
          }
        }}
      />
    </div>
  );
}

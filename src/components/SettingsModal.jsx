import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Sparkles, Sliders, Globe, Check, AlertCircle, RefreshCw, Zap, Video, Volume2, Play, Flame, Cloud, Brain, BarChart2, ShieldCheck, Activity } from 'lucide-react';
import { webResearchService, SEARCH_PROVIDERS } from '../services/webResearchService';
import { groqService, GROQ_MODELS } from '../services/groqService';
import { youtubeService } from '../services/youtubeService';
import { elevenLabsService, ELEVENLABS_VOICES, SUPPORTED_LANGUAGES } from '../services/elevenLabsService';
import { nlpService } from '../services/nlpService';
import { 
  getStoredFirebaseConfig, 
  saveFirebaseConfig, 
  testFirebaseConnection, 
  isFirebaseConfigured, 
  isCloudSyncEnabled, 
  setCloudSyncEnabled 
} from '../services/firebase';
import { firebaseFirestoreService } from '../services/firebaseFirestoreService';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { geminiService } from '../services/geminiService';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  reducedMotion, 
  setReducedMotion,
  spectralIntensity,
  setSpectralIntensity,
  soundEnabled,
  setSoundEnabled,
  initialTab = 'optics',
  geminiApiEnabled = true,
  groqApiEnabled = true,
  onToggleGeminiApi,
  onToggleGroqApi,
  onToggleAllApis
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'optics' | 'groq' | 'youtube' | 'web-api' | 'elevenlabs' | 'firebase'
  
  // Cloud API Gateway toggles for testing local trained model
  const [localGeminiEnabled, setLocalGeminiEnabled] = useState(geminiApiEnabled);
  const [localGroqEnabled, setLocalGroqEnabled] = useState(groqApiEnabled);

  useEffect(() => {
    setLocalGeminiEnabled(geminiApiEnabled);
  }, [geminiApiEnabled]);

  useEffect(() => {
    setLocalGroqEnabled(groqApiEnabled);
  }, [groqApiEnabled]);
  
  // Groq LPU State
  const [groqKey, setGroqKey] = useState(() => groqService.getApiKey());
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqModel, setGroqModel] = useState(() => groqService.getSelectedModel());
  const [groqTestStatus, setGroqTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [groqTestDetails, setGroqTestDetails] = useState('');

  // YouTube Data API v3 State
  const [youtubeKey, setYoutubeKey] = useState(() => youtubeService.getApiKey());
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [youtubeTestStatus, setYoutubeTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [youtubeTestDetails, setYoutubeTestDetails] = useState('');
  const [testVideoResults, setTestVideoResults] = useState([]);

  // Web Research State
  const [provider, setProvider] = useState(() => webResearchService.getSettings().provider);
  const [apiKey, setApiKey] = useState(() => webResearchService.getSettings().apiKey);
  const [showKey, setShowKey] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState(() => webResearchService.getSettings().customEndpoint);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testDetails, setTestDetails] = useState('');

  // ElevenLabs Voice State
  const [elevenLabsKey, setElevenLabsKey] = useState(() => elevenLabsService.getApiKey());
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(() => elevenLabsService.getSelectedVoiceId());
  const [customVoiceId, setCustomVoiceId] = useState(() => elevenLabsService.getCustomVoiceId());
  const [selectedLanguage, setSelectedLanguage] = useState(() => elevenLabsService.getSelectedLanguage());
  const [elevenTestStatus, setElevenTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [elevenTestDetails, setElevenTestDetails] = useState('');
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  // Firebase Cloud State
  const [firebaseConfig, setFirebaseConfig] = useState(() => getStoredFirebaseConfig());
  const [showFirebaseKey, setShowFirebaseKey] = useState(false);
  const [firebaseTestStatus, setFirebaseTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [firebaseTestDetails, setFirebaseTestDetails] = useState('');
  const [cloudSyncActive, setCloudSyncActive] = useState(() => isCloudSyncEnabled());
  const [syncBatchStatus, setSyncBatchStatus] = useState(null);
  const [syncBatchDetails, setSyncBatchDetails] = useState('');

  // Google Gemini State
  const [geminiKey, setGeminiKey] = useState(() => geminiService.getApiKey());
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [geminiTestDetails, setGeminiTestDetails] = useState('');

  // NLP & Sentiment Analysis Laboratory State
  const [nlpInputText, setNlpInputText] = useState("Pulse AI's speed and multimodal reasoning is truly phenomenal! It feels effortless, though I want to explore deeper proofs.");
  const [nlpResult, setNlpResult] = useState(() => nlpService.analyzeSentiment("Pulse AI's speed and multimodal reasoning is truly phenomenal! It feels effortless, though I want to explore deeper proofs."));

  const handleAnalyzeNLP = (customText) => {
    const text = customText !== undefined ? customText : nlpInputText;
    if (customText !== undefined) setNlpInputText(customText);
    const res = nlpService.analyzeSentiment(text);
    setNlpResult(res);
  };

  const handleSaveGemini = (keyToSave = geminiKey) => {
    geminiService.saveApiKey(keyToSave);
  };

  const handleTestGemini = async () => {
    setGeminiTestStatus('testing');
    setGeminiTestDetails('Pinging Google Generative Language API with gemini-3.8-flash...');
    handleSaveGemini();

    try {
      const res = await geminiService.testConnection(geminiKey);
      setGeminiTestStatus('success');
      setGeminiTestDetails(`Gemini API verified in ${res.durationMs}ms (Active Model: ${res.model})`);
    } catch (err) {
      setGeminiTestStatus('error');
      setGeminiTestDetails(`Gemini error: ${err.message || 'Connection failed'}`);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSaveFirebase = (newConfig = firebaseConfig) => {
    saveFirebaseConfig(newConfig);
  };

  const handleTestFirebase = async () => {
    setFirebaseTestStatus('testing');
    setFirebaseTestDetails('Validating Firebase credentials and checking Auth service...');
    handleSaveFirebase();

    try {
      const res = await testFirebaseConnection(firebaseConfig);
      setFirebaseTestStatus('success');
      setFirebaseTestDetails(`Connected to Firebase Project "${res.projectId}" in ${res.durationMs}ms (Auth Domain: ${res.authDomain})`);
    } catch (err) {
      setFirebaseTestStatus('error');
      setFirebaseTestDetails(err.message || 'Firebase connection failed.');
    }
  };

  const handleToggleCloudSync = (enabled) => {
    setCloudSyncActive(enabled);
    setCloudSyncEnabled(enabled);
  };

  const handleBatchSyncLocalToFirebase = async () => {
    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      setSyncBatchStatus('error');
      setSyncBatchDetails('Please sign in to Firebase first (click your profile avatar in the Navbar).');
      return;
    }

    setSyncBatchStatus('syncing');
    setSyncBatchDetails('Uploading local threads to Cloud Firestore...');
    try {
      const res = await firebaseFirestoreService.uploadAllLocalConversations(user.uid);
      setSyncBatchStatus('success');
      setSyncBatchDetails(`Successfully uploaded ${res.uploadedCount} conversation(s) to Cloud Firestore!`);
    } catch (err) {
      setSyncBatchStatus('error');
      setSyncBatchDetails(err.message || 'Sync failed.');
    }
  };

  const handleSaveGroq = (keyToSave = groqKey, modelToSave = groqModel) => {
    groqService.saveApiKey(keyToSave);
    groqService.saveSelectedModel(modelToSave);
  };

  const handleTestGroq = async () => {
    setGroqTestStatus('testing');
    setGroqTestDetails('Pinging Groq LPU™ cluster with openai/gpt-oss-20b (Flash Flow)...');
    handleSaveGroq();

    try {
      const res = await groqService.testConnection(groqKey);
      setGroqTestStatus('success');
      setGroqTestDetails(`Groq LPU™ verified in ${res.durationMs}ms (Model: ${res.model})`);
    } catch (err) {
      setGroqTestStatus('error');
      setGroqTestDetails(`Groq connection failed: ${err.message || 'Network error'}`);
    }
  };

  const handleSaveYoutube = (keyToSave = youtubeKey) => {
    youtubeService.saveApiKey(keyToSave);
  };

  const handleTestYoutube = async () => {
    setYoutubeTestStatus('testing');
    setYoutubeTestDetails('Pinging YouTube Data API v3 endpoint with key...');
    handleSaveYoutube();

    try {
      const res = await youtubeService.testConnection(youtubeKey);
      setYoutubeTestStatus('success');
      setYoutubeTestDetails(`YouTube Data API v3 verified in ${res.durationMs}ms (Status: 200 OK)`);
      const vids = await youtubeService.searchVideos('Artificial Intelligence 2026', 2);
      setTestVideoResults(vids);
    } catch (err) {
      setYoutubeTestStatus('error');
      setYoutubeTestDetails(`YouTube verification failed: ${err.message || 'Network error'}`);
    }
  };

  const handleSaveElevenLabs = (
    keyToSave = elevenLabsKey, 
    voiceToSave = selectedVoice, 
    langToSave = selectedLanguage,
    customToSave = customVoiceId
  ) => {
    elevenLabsService.saveApiKey(keyToSave);
    elevenLabsService.saveSelectedVoiceId(voiceToSave);
    elevenLabsService.saveSelectedLanguage(langToSave);
    elevenLabsService.saveCustomVoiceId(customToSave);
  };

  const handleTestElevenLabs = async (sampleText = 'Namaste! Welcome to Pulse AI with high-speed voice synthesis.', lang = 'en-IN') => {
    if (isPlayingTestAudio) {
      elevenLabsService.stop();
      setIsPlayingTestAudio(false);
      return;
    }

    setElevenTestStatus('testing');
    setElevenTestDetails(`Connecting to ElevenLabs Turbo v2.5 (sub-second streaming)...`);
    handleSaveElevenLabs();

    const startT = performance.now();

    try {
      setIsPlayingTestAudio(true);
      await elevenLabsService.speak(sampleText, {
        apiKey: elevenLabsKey,
        voiceId: selectedVoice === 'custom' ? customVoiceId : selectedVoice,
        language: lang,
        onStart: () => {
          const lat = Math.round(performance.now() - startT);
          setElevenTestStatus('success');
          setElevenTestDetails(`Speaking in ${lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'Indian English'} via ElevenLabs Turbo v2.5 (${lat}ms response time).`);
        },
        onEnd: () => {
          setIsPlayingTestAudio(false);
        },
        onError: (err) => {
          setIsPlayingTestAudio(false);
          setElevenTestStatus('error');
          setElevenTestDetails(`Voice error: ${err?.message || 'Playback failed'}`);
        }
      });
    } catch (err) {
      setIsPlayingTestAudio(false);
      setElevenTestStatus('error');
      setElevenTestDetails(`ElevenLabs error: ${err.message || 'API error'}`);
    }
  };

  const handleSaveApi = () => {
    webResearchService.saveSettings({
      provider,
      apiKey,
      customEndpoint
    });
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestDetails('Querying live web endpoints...');
    handleSaveApi();

    try {
      const res = await webResearchService.conductResearch('quantum computing breakthroughs', {
        provider
      });
      if (res && res.sources && res.sources.length > 0) {
        setTestStatus('success');
        setTestDetails(`Connected via ${res.providerName}: Retrieved ${res.sources.length} sources in ${res.durationMs}ms`);
      } else {
        setTestStatus('error');
        setTestDetails('Received empty response from search provider.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestDetails(`Connection failed: ${err.message || 'Network error'}`);
    }
  };

  const selectedProviderObj = SEARCH_PROVIDERS.find(p => p.id === provider) || SEARCH_PROVIDERS[0];

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
          maxWidth: '640px',
          background: 'rgba(16, 19, 30, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px -8px rgba(79, 43, 237, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: '#8B2BE2' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>
              Settings & Intelligence Configuration
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('optics')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'optics' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: activeTab === 'optics' ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}
          >
            Optics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groq')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'groq' ? 'rgba(139, 43, 226, 0.22)' : 'transparent',
              color: activeTab === 'groq' ? '#8B2BE2' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Zap size={11} style={{ color: '#00D68F' }} />
            <span>Groq</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'youtube' ? 'rgba(255, 0, 0, 0.18)' : 'transparent',
              color: activeTab === 'youtube' ? '#FF4D4D' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Video size={11} style={{ color: '#FF4D4D' }} />
            <span>YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('web-api')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'web-api' ? 'rgba(0, 112, 243, 0.18)' : 'transparent',
              color: activeTab === 'web-api' ? '#0070F3' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={11} />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('elevenlabs')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'elevenlabs' ? 'rgba(0, 214, 143, 0.2)' : 'transparent',
              color: activeTab === 'elevenlabs' ? '#00D68F' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Volume2 size={11} style={{ color: '#00D68F' }} />
            <span>Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'firebase' ? 'rgba(255, 122, 0, 0.22)' : 'transparent',
              color: activeTab === 'firebase' ? '#FF7A00' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Flame size={12} style={{ color: '#FF7A00' }} />
            <span>Firebase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nlp')}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              background: activeTab === 'nlp' ? 'rgba(167, 139, 250, 0.22)' : 'transparent',
              color: activeTab === 'nlp' ? '#A78BFA' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Brain size={12} style={{ color: '#A78BFA' }} />
            <span>NLP</span>
          </button>
        </div>

        {/* Tab 1: Optics & Accessibility */}
        {activeTab === 'optics' && (
          <div>
            {/* Spectral Intensity Control */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF' }}>Spectral Luminous Intensity</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {spectralIntensity === 0.6 ? 'Subtle' : spectralIntensity === 1.0 ? 'Balanced' : 'Radiant'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Adjusts optical energy of the continuous VIBGYOR background ribbon and ambient halos.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { val: 0.6, label: 'Subtle' },
                  { val: 1.0, label: 'Balanced' },
                  { val: 1.4, label: 'Radiant' }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSpectralIntensity(opt.val)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: spectralIntensity === opt.val ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${spectralIntensity === opt.val ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: spectralIntensity === opt.val ? '#FFFFFF' : 'var(--text-muted)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF' }}>Reduced Motion Mode</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Replaces dynamic photon wave physics with a calm static gradient.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '9999px',
                  background: reducedMotion ? '#00D68F' : 'rgba(255, 255, 255, 0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                <div 
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: reducedMotion ? '23px' : '3px',
                    transition: 'left 0.2s ease'
                  }} 
                />
              </button>
            </div>

            {/* Sound Feedback Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF' }}>Harmonic Acoustic Feedback</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Synthesized 520Hz acoustic chime upon reasoning convergence.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '9999px',
                  background: soundEnabled ? '#00D68F' : 'rgba(255, 255, 255, 0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                <div 
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: soundEnabled ? '23px' : '3px',
                    transition: 'left 0.2s ease'
                  }} 
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Groq LPU™ Frontier Inference & Cloud API Gateways */}
        {activeTab === 'groq' && (
          <div>
            {/* Master API Gateway & Local Model Testing Controls */}
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: (!localGeminiEnabled && !localGroqEnabled) 
                ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.18) 0%, rgba(139, 43, 226, 0.18) 100%)' 
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${(!localGeminiEnabled && !localGroqEnabled) ? 'rgba(167, 139, 250, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
              marginBottom: '20px',
              boxShadow: (!localGeminiEnabled && !localGroqEnabled) ? '0 0 24px rgba(167, 139, 250, 0.2)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} style={{ color: '#A78BFA' }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
                      Local Trained Model Testing (Offline Mode)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Turn off both cloud APIs to test your trained model in 100% isolation with 0 tokens.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const bothOff = !localGeminiEnabled && !localGroqEnabled;
                    const next = bothOff; // if both were off, turn on; if either on, turn both off
                    setLocalGeminiEnabled(next);
                    setLocalGroqEnabled(next);
                    if (onToggleAllApis) onToggleAllApis(next);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: (!localGeminiEnabled && !localGroqEnabled) ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)',
                    color: (!localGeminiEnabled && !localGroqEnabled) ? '#0D1117' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {(!localGeminiEnabled && !localGroqEnabled) ? '✓ APIs OFF (Testing Model)' : 'Turn Off Both APIs'}
                </button>
              </div>

              {/* Individual API Gateways */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {/* Google Gemini API Toggle */}
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: localGeminiEnabled ? 'rgba(66, 133, 244, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${localGeminiEnabled ? 'rgba(66, 133, 244, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: '#4285F4' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>
                        Google Gemini API
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !localGeminiEnabled;
                        setLocalGeminiEnabled(next);
                        if (onToggleGeminiApi) onToggleGeminiApi(next);
                      }}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '9999px',
                        background: localGeminiEnabled ? '#4285F4' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: localGeminiEnabled ? '21px' : '3px',
                        transition: 'left 0.2s ease'
                      }} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: localGeminiEnabled ? '#4285F4' : 'var(--text-muted)' }}>
                    {localGeminiEnabled ? '● API Active & Online' : '○ Disabled (Testing Local Model)'}
                  </div>
                </div>

                {/* Groq API Toggle */}
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: localGroqEnabled ? 'rgba(0, 214, 143, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${localGroqEnabled ? 'rgba(0, 214, 143, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} style={{ color: '#00D68F' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>
                        Groq LPU™ API
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !localGroqEnabled;
                        setLocalGroqEnabled(next);
                        if (onToggleGroqApi) onToggleGroqApi(next);
                      }}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '9999px',
                        background: localGroqEnabled ? '#00D68F' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: localGroqEnabled ? '21px' : '3px',
                        transition: 'left 0.2s ease'
                      }} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: localGroqEnabled ? '#00D68F' : 'var(--text-muted)' }}>
                    {localGroqEnabled ? '● API Active & Online' : '○ Disabled (Testing Local Model)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Header info card */}
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(139, 43, 226, 0.08)', border: '1px solid rgba(139, 43, 226, 0.2)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Zap size={16} style={{ color: '#00D68F' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
                  Groq LPU™ Ultra-Fast Inference
                </span>
                <span style={{ 
                  fontSize: '10.5px', 
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  background: localGroqEnabled ? 'rgba(0, 214, 143, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                  color: localGroqEnabled ? '#00D68F' : '#EF4444', 
                  fontWeight: 700 
                }}>
                  {localGroqEnabled ? 'ACTIVE' : 'OFFLINE (TESTING LOCAL MODEL)'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Streams frontier models directly from Groq LPUs at up to 450+ tokens per second. Pre-configured with your high-speed API token.
              </p>
            </div>

            {/* API Key input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                Groq API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => {
                    setGroqKey(e.target.value);
                    handleSaveGroq(e.target.value, groqModel);
                  }}
                  placeholder="gsk_..."
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div style={{ marginBottom: '18px', padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: groqTestStatus ? '8px' : 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Validate Groq LPU™ Endpoint:
                </span>
                <button
                  type="button"
                  onClick={handleTestGroq}
                  disabled={groqTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--spectral-gradient-horizontal)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: groqTestStatus === 'testing' ? 'not-allowed' : 'pointer',
                    border: 'none',
                    boxShadow: '0 2px 10px rgba(139, 43, 226, 0.3)'
                  }}
                >
                  {groqTestStatus === 'testing' && <RefreshCw size={12} className="pulse-wave-anim" />}
                  <span>{groqTestStatus === 'testing' ? 'Verifying...' : 'Test Groq Connection'}</span>
                </button>
              </div>

              {groqTestStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: groqTestStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: groqTestStatus === 'success' ? '#00D68F' : '#EF4444',
                  border: `1px solid ${groqTestStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {groqTestStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{groqTestDetails}</span>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                Default Groq Frontier Engine
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {GROQ_MODELS.map((m) => {
                  const isSelected = groqModel === m.internalModel;
                  const isComingLater = m.internalModel === 'openai/gpt-oss-120b';
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (isComingLater) return;
                        setGroqModel(m.internalModel);
                        handleSaveGroq(groqKey, m.internalModel);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: isComingLater ? 'not-allowed' : 'pointer',
                        opacity: isComingLater ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: m.color }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{m.name}</span>
                          <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                            {m.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {m.desc}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#00D68F', fontFamily: 'var(--font-mono)' }}>
                          {m.speed}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Gemini 3.8 Flash Configuration Card */}
            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#4285F4' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
                    Google Gemini 3.8 Flash Engine
                  </span>
                </div>
                <span style={{ 
                  fontSize: '10.5px', 
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  background: localGeminiEnabled ? 'rgba(66, 133, 244, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                  color: localGeminiEnabled ? '#4285F4' : '#EF4444', 
                  fontWeight: 700 
                }}>
                  {localGeminiEnabled ? 'ACTIVE (1M CONTEXT)' : 'OFFLINE (TESTING LOCAL MODEL)'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                Enables next-generation reasoning with Google Gemini 3.8 Flash, native search grounding, and deep multimodal audits.
              </p>

              {/* Gemini API Key Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  Gemini API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      handleSaveGemini(e.target.value);
                    }}
                    placeholder="AQ.Ab8RN6LC94d8..."
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Test Gemini Connection Button & Status */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: geminiTestStatus ? '8px' : 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Validate Gemini Connection:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={geminiTestStatus === 'testing'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#4285F4',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: geminiTestStatus === 'testing' ? 'not-allowed' : 'pointer',
                      border: 'none'
                    }}
                  >
                    {geminiTestStatus === 'testing' && <RefreshCw size={12} className="pulse-wave-anim" />}
                    <span>{geminiTestStatus === 'testing' ? 'Testing...' : 'Test Gemini API'}</span>
                  </button>
                </div>

                {geminiTestStatus && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    background: geminiTestStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: geminiTestStatus === 'success' ? '#00D68F' : '#EF4444',
                    border: `1px solid ${geminiTestStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    {geminiTestStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{geminiTestDetails}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: ElevenLabs Multilingual Neural Voice */}
        {activeTab === 'elevenlabs' && (
          <div>
            {/* Header info card */}
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0, 214, 143, 0.08)', border: '1px solid rgba(0, 214, 143, 0.25)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Volume2 size={16} style={{ color: '#00D68F' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
                  ElevenLabs Indian Neural Voice & Fast Streaming
                </span>
                <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 214, 143, 0.15)', color: '#00D68F', fontWeight: 700 }}>
                  TURBO v2.5 ACTIVE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Powered by <strong>ElevenLabs Turbo v2.5</strong> with sentence-level pipelined streaming (~200ms latency). Delivers authentic Indian English, <strong>Hindi (हिन्दी)</strong>, and <strong>Kannada (ಕನ್ನಡ)</strong> speech with natural human prosody and zero robotic cadence.
              </p>
            </div>

            {/* API Key input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                ElevenLabs API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showElevenLabsKey ? 'text' : 'password'}
                  value={elevenLabsKey}
                  onChange={(e) => {
                    setElevenLabsKey(e.target.value);
                    handleSaveElevenLabs(e.target.value, selectedVoice, selectedLanguage, customVoiceId);
                  }}
                  placeholder="sk_..."
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showElevenLabsKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Language Preference Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                Default Language & Accent Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        handleSaveElevenLabs(elevenLabsKey, selectedVoice, lang.id, customVoiceId);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0, 214, 143, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'rgba(0, 214, 143, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.16s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{lang.flag}</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: isSelected ? '#00D68F' : '#FFFFFF' }}>
                          {lang.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {lang.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voice Model Selection */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                ElevenLabs Neural Voice Profile (Indian Cadence)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {ELEVENLABS_VOICES.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVoice(v.id);
                        handleSaveElevenLabs(elevenLabsKey, v.id, selectedLanguage, customVoiceId);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0, 214, 143, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'rgba(0, 214, 143, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: v.color }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#00D68F' : '#FFFFFF' }}>{v.name}</span>
                          {v.badge && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                              {v.badge}
                            </span>
                          )}
                          <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)' }}>
                            {v.gender} • {v.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {v.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#00D68F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#090B12', flexShrink: 0 }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Test Connection & Live Audio Preview Buttons */}
            <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                Test Live Multilingual Neural Synthesis:
              </span>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: elevenTestStatus ? '12px' : 0 }}>
                {/* Test Indian English */}
                <button
                  type="button"
                  onClick={() => handleTestElevenLabs('Namaste! Welcome to Pulse AI with high-speed voice synthesis.', 'en-IN')}
                  disabled={elevenTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 214, 143, 0.12)',
                    border: '1px solid rgba(0, 214, 143, 0.3)',
                    color: '#00D68F',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: elevenTestStatus === 'testing' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={11} fill="#00D68F" />
                  <span>🇮🇳 Test Indian English</span>
                </button>

                {/* Test Hindi */}
                <button
                  type="button"
                  onClick={() => handleTestElevenLabs('नमस्ते! पल्स एआई में आपका स्वागत है। मैं हिंदी और कन्नड़ दोनों बोल सकता हूँ।', 'hi')}
                  disabled={elevenTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 122, 0, 0.12)',
                    border: '1px solid rgba(255, 122, 0, 0.3)',
                    color: '#FF9E42',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: elevenTestStatus === 'testing' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={11} fill="#FF9E42" />
                  <span>🇮🇳 Test Hindi (हिन्दी)</span>
                </button>

                {/* Test Kannada */}
                <button
                  type="button"
                  onClick={() => handleTestElevenLabs('ನಮಸ್ಕಾರ! ಪಲ್ಸ್ AI ಗೆ ಸುಸ್ವಾಗತ. ನಾನು ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ ಎರಡರಲ್ಲೂ ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡಬಲ್ಲೆ.', 'kn')}
                  disabled={elevenTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 199, 0, 0.12)',
                    border: '1px solid rgba(255, 199, 0, 0.3)',
                    color: '#FFC700',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: elevenTestStatus === 'testing' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={11} fill="#FFC700" />
                  <span>🇮🇳 Test Kannada (ಕನ್ನಡ)</span>
                </button>
              </div>

              {elevenTestStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: elevenTestStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : elevenTestStatus === 'testing' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: elevenTestStatus === 'success' ? '#00D68F' : elevenTestStatus === 'testing' ? '#38BDF8' : '#EF4444',
                  border: `1px solid ${elevenTestStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : elevenTestStatus === 'testing' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {elevenTestStatus === 'testing' ? <RefreshCw size={13} className="pulse-wave-anim" /> : elevenTestStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{elevenTestDetails}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: YouTube Data API v3 */}
        {activeTab === 'youtube' && (
          <div>
            {/* Header info card */}
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 0, 0, 0.08)', border: '1px solid rgba(255, 0, 0, 0.22)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Video size={16} style={{ color: '#FF4D4D' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
                  YouTube Data API v3
                </span>
                <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 0, 0, 0.15)', color: '#FF4D4D', fontWeight: 700 }}>
                  ACTIVE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Connected to Google YouTube Data API v3. Enables live search, educational video discovery, and multimedia context.
              </p>
            </div>

            {/* API Key input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                YouTube API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showYoutubeKey ? 'text' : 'password'}
                  value={youtubeKey}
                  onChange={(e) => {
                    setYoutubeKey(e.target.value);
                    handleSaveYoutube(e.target.value);
                  }}
                  placeholder="AIzaSy..."
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showYoutubeKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div style={{ marginBottom: '18px', padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: youtubeTestStatus ? '8px' : 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Validate YouTube v3 Key:
                </span>
                <button
                  type="button"
                  onClick={handleTestYoutube}
                  disabled={youtubeTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #FF0000 0%, #B30000 100%)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: youtubeTestStatus === 'testing' ? 'not-allowed' : 'pointer',
                    border: 'none',
                    boxShadow: '0 2px 10px rgba(255, 0, 0, 0.3)'
                  }}
                >
                  {youtubeTestStatus === 'testing' && <RefreshCw size={12} className="pulse-wave-anim" />}
                  <span>{youtubeTestStatus === 'testing' ? 'Verifying...' : 'Test YouTube Connection'}</span>
                </button>
              </div>

              {youtubeTestStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: youtubeTestStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: youtubeTestStatus === 'success' ? '#00D68F' : '#EF4444',
                  border: `1px solid ${youtubeTestStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {youtubeTestStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{youtubeTestDetails}</span>
                </div>
              )}
            </div>

            {/* Test Video Results if verified */}
            {testVideoResults && testVideoResults.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Live API Test Sample Videos:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {testVideoResults.map((v) => (
                    <a
                      key={v.id}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        textDecoration: 'none'
                      }}
                    >
                      {v.thumbnail && (
                        <img 
                          src={v.thumbnail} 
                          alt={v.title}
                          style={{ width: '60px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {v.channelTitle}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Web Research API */}
        {activeTab === 'web-api' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                Active Web Provider
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {SEARCH_PROVIDERS.map((p) => {
                  const isSelected = provider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProvider(p.id);
                        webResearchService.saveSettings({ provider: p.id });
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0, 112, 243, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'rgba(0, 112, 243, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{p.name}</span>
                        {!p.requiresKey && (
                          <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 214, 143, 0.15)', color: '#00D68F' }}>
                            Zero Config
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                        {p.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProviderObj.requiresKey && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  {selectedProviderObj.name} API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      handleSaveApi();
                    }}
                    placeholder="Enter API key..."
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {provider === 'custom' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  Custom Proxy Endpoint URL
                </label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => {
                    setCustomEndpoint(e.target.value);
                    handleSaveApi();
                  }}
                  placeholder="https://search.internal.corp/api/search"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            )}

            {/* Test Connection Button & Status */}
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: testStatus ? '8px' : 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Validate Provider Connection:
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: '#0070F3',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
                    border: 'none'
                  }}
                >
                  {testStatus === 'testing' && <RefreshCw size={12} className="pulse-wave-anim" />}
                  <span>{testStatus === 'testing' ? 'Testing...' : 'Test Search API'}</span>
                </button>
              </div>

              {testStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: testStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: testStatus === 'success' ? '#00D68F' : '#EF4444',
                  border: `1px solid ${testStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {testStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{testDetails}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Firebase Cloud Firestore & Auth */}
        {activeTab === 'firebase' && (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} style={{ color: '#FF7A00' }} />
                  Google Firebase Cloud Sync
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Real-time multi-device cloud chat synchronization and user account persistence.
                </p>
              </div>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isFirebaseConfigured(firebaseConfig) ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 122, 0, 0.15)',
                  color: isFirebaseConfigured(firebaseConfig) ? '#00D68F' : '#FF7A00',
                  border: `1px solid ${isFirebaseConfigured(firebaseConfig) ? 'rgba(0, 214, 143, 0.3)' : 'rgba(255, 122, 0, 0.3)'}`
                }}
              >
                {isFirebaseConfigured(firebaseConfig) ? 'Configured' : 'Setup Required'}
              </span>
            </div>

            {/* Cloud Sync Toggle Switch */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cloud size={18} style={{ color: cloudSyncActive ? '#00D68F' : 'var(--text-muted)' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Real-time Cloud Sync</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Automatically synchronize new messages and conversations with Cloud Firestore
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleCloudSync(!cloudSyncActive)}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '999px',
                  background: cloudSyncActive ? '#00D68F' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  padding: '2px'
                }}
              >
                <div 
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transform: cloudSyncActive ? 'translateX(18px)' : 'translateX(0px)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                  }}
                />
              </button>
            </div>

            {/* Batch Upload Local to Cloud */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 122, 0, 0.06)',
                border: '1px solid rgba(255, 122, 0, 0.2)',
                marginBottom: '18px'
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Backup All Local Chats</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Push all offline/localStorage conversations directly to your Firestore collection
                </p>
              </div>
              <button
                type="button"
                onClick={handleBatchSyncLocalToFirebase}
                disabled={syncBatchStatus === 'syncing'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: '#FF7A00',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: syncBatchStatus === 'syncing' ? 'wait' : 'pointer',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(255, 122, 0, 0.3)'
                }}
              >
                <RefreshCw size={12} className={syncBatchStatus === 'syncing' ? 'pulse-wave-anim' : ''} />
                <span>{syncBatchStatus === 'syncing' ? 'Uploading...' : 'Upload Now'}</span>
              </button>
            </div>

            {syncBatchStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                marginBottom: '16px',
                background: syncBatchStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: syncBatchStatus === 'success' ? '#00D68F' : '#EF4444',
                border: `1px solid ${syncBatchStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {syncBatchStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{syncBatchDetails}</span>
              </div>
            )}

            {/* Credentials Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px' }}>
                  Web API Key (apiKey)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showFirebaseKey ? 'text' : 'password'}
                    value={firebaseConfig.apiKey || ''}
                    onChange={(e) => {
                      const updated = { ...firebaseConfig, apiKey: e.target.value };
                      setFirebaseConfig(updated);
                      handleSaveFirebase(updated);
                    }}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFirebaseKey(!showFirebaseKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showFirebaseKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px' }}>
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.projectId || ''}
                    onChange={(e) => {
                      const updated = { ...firebaseConfig, projectId: e.target.value };
                      setFirebaseConfig(updated);
                      handleSaveFirebase(updated);
                    }}
                    placeholder="pulse-ai-project"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px' }}>
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.authDomain || ''}
                    onChange={(e) => {
                      const updated = { ...firebaseConfig, authDomain: e.target.value };
                      setFirebaseConfig(updated);
                      handleSaveFirebase(updated);
                    }}
                    placeholder="pulse-ai-project.firebaseapp.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px' }}>
                    App ID
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.appId || ''}
                    onChange={(e) => {
                      const updated = { ...firebaseConfig, appId: e.target.value };
                      setFirebaseConfig(updated);
                      handleSaveFirebase(updated);
                    }}
                    placeholder="1:123456789:web:abcdef..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '5px' }}>
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.storageBucket || ''}
                    onChange={(e) => {
                      const updated = { ...firebaseConfig, storageBucket: e.target.value };
                      setFirebaseConfig(updated);
                      handleSaveFirebase(updated);
                    }}
                    placeholder="pulse-ai-project.firebasestorage.app"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: firebaseTestStatus ? '8px' : 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Validate Firebase Connection:
                </span>
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={firebaseTestStatus === 'testing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#FF7A00',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: firebaseTestStatus === 'testing' ? 'not-allowed' : 'pointer',
                    border: 'none'
                  }}
                >
                  {firebaseTestStatus === 'testing' && <RefreshCw size={12} className="pulse-wave-anim" />}
                  <span>{firebaseTestStatus === 'testing' ? 'Testing...' : 'Test Firebase Connection'}</span>
                </button>
              </div>

              {firebaseTestStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: firebaseTestStatus === 'success' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: firebaseTestStatus === 'success' ? '#00D68F' : '#EF4444',
                  border: `1px solid ${firebaseTestStatus === 'success' ? 'rgba(0, 214, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {firebaseTestStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{firebaseTestDetails}</span>
                </div>
              )}
            </div>

            {/* Quick Setup Instructions */}
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600, color: '#FFFFFF', display: 'block', marginBottom: '4px' }}>
                Quick 2-Minute Firebase Setup:
              </span>
              <ol style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                <li>Open <strong style={{ color: '#FF7A00' }}>console.firebase.google.com</strong> &amp; create or open a project.</li>
                <li>Go to <em>Authentication &gt; Sign-in method</em>, enable <strong>Google</strong> and <strong>Email/Password</strong>.</li>
                <li>Go to <em>Firestore Database &gt; Create database</em> in Production or Test mode.</li>
                <li>In <em>Project Settings &gt; General &gt; Your apps</em>, register a Web App and paste the keys above or in <code>.env</code>.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 7: Edge NLP & Sentiment Analysis Laboratory */}
        {activeTab === 'nlp' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} style={{ color: '#A78BFA' }} />
                  <span>Edge NLP &amp; Sentiment Analysis Laboratory</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Zero-token, on-device lexical &amp; emotional intelligence engine.
                </div>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 214, 143, 0.15)', color: '#00D68F', border: '1px solid rgba(0, 214, 143, 0.3)', fontWeight: 600 }}>
                ⚡ 0 API Tokens
              </span>
            </div>

            {/* Quick Local Model Isolation Switch */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: (!localGeminiEnabled && !localGroqEnabled)
                ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 43, 226, 0.2) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${(!localGeminiEnabled && !localGroqEnabled) ? 'rgba(167, 139, 250, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧪 Test Local Model in Isolation</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: (!localGeminiEnabled && !localGroqEnabled) ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)',
                    color: (!localGeminiEnabled && !localGroqEnabled) ? '#0D1117' : 'var(--text-muted)',
                    fontWeight: 800
                  }}>
                    {(!localGeminiEnabled && !localGroqEnabled) ? 'APIs OFF' : 'APIs ON'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {(!localGeminiEnabled && !localGroqEnabled)
                    ? 'Both Gemini & Groq APIs are OFF. Chat responses run 100% on your trained local engine.'
                    : 'Turn off external cloud APIs to test your trained model and verify zero-token performance.'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const bothOff = !localGeminiEnabled && !localGroqEnabled;
                  const next = bothOff;
                  setLocalGeminiEnabled(next);
                  setLocalGroqEnabled(next);
                  if (onToggleAllApis) onToggleAllApis(next);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: (!localGeminiEnabled && !localGroqEnabled) ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)',
                  color: (!localGeminiEnabled && !localGroqEnabled) ? '#0D1117' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {(!localGeminiEnabled && !localGroqEnabled) ? 'Restore APIs' : 'Turn Off Both APIs'}
              </button>
            </div>

            {/* Token Savings Highlight Banner */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 43, 226, 0.12) 0%, rgba(0, 112, 243, 0.12) 100%)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#A78BFA', fontWeight: 700 }}>
                  Cumulative API Tokens Saved
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{nlpService.getTokensSaved().toLocaleString()}</span>
                  <span style={{ fontSize: '12px', color: '#00D68F', fontWeight: 600 }}>tokens preserved</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Via on-device NLP, context window compression &amp; persistent caching.
                </div>
              </div>
              <ShieldCheck size={32} style={{ color: '#00D68F', opacity: 0.85 }} />
            </div>

            {/* Quick Sample Selectors */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                Try Preset Text Samples:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleAnalyzeNLP("Pulse AI's speed and multimodal reasoning is truly phenomenal! It feels effortless, though I want to explore deeper proofs.")}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 214, 143, 0.1)',
                    border: '1px solid rgba(0, 214, 143, 0.25)',
                    color: '#00D68F',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  🌟 Rave Product Review
                </button>
                <button
                  type="button"
                  onClick={() => handleAnalyzeNLP("The checkout page is broken, payments are failing repeatedly, and customer support was terribly slow and very unhelpful.")}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#EF4444',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Critical / Adverse Issue
                </button>
                <button
                  type="button"
                  onClick={() => handleAnalyzeNLP("Quantum computing leverages linear superposition and entanglement of qubits in complex Hilbert space to achieve exponential computational speedup.")}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 112, 243, 0.1)',
                    border: '1px solid rgba(0, 112, 243, 0.25)',
                    color: '#0070F3',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  🔬 Academic / Technical
                </button>
              </div>
            </div>

            {/* Input Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <textarea
                rows={3}
                value={nlpInputText}
                onChange={(e) => {
                  setNlpInputText(e.target.value);
                  handleAnalyzeNLP(e.target.value);
                }}
                placeholder="Enter or paste any sentence, product review, or feedback to analyze..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {nlpInputText.length} characters • {nlpInputText.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={() => handleAnalyzeNLP()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#8B2BE2',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Activity size={13} />
                  <span>Analyze Sentiment</span>
                </button>
              </div>
            </div>

            {/* Live NLP Results Display */}
            {nlpResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Metric Row 1: Polarity & Tone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {/* Polarity Card */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Polarity &amp; Valence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: nlpResult.polarity === 'positive' ? '#00D68F' : nlpResult.polarity === 'negative' ? '#EF4444' : '#0070F3'
                      }}>
                        {nlpResult.label}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {nlpResult.score > 0 ? `+${nlpResult.score}` : nlpResult.score}
                      </span>
                    </div>
                    {/* Meter bar */}
                    <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, Math.round(((nlpResult.score + 1) / 2) * 100)))}%`,
                        background: nlpResult.polarity === 'positive' ? '#00D68F' : nlpResult.polarity === 'negative' ? '#EF4444' : '#0070F3',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Tone & Subjectivity Card */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Tone &amp; Subjectivity
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', marginTop: '6px' }}>
                      {nlpResult.tone}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {nlpResult.subjectivity}
                    </div>
                  </div>
                </div>

                {/* Metric Row 2: Emotion Distribution */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                    Multi-Spectrum Emotional Distribution
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px' }}>
                    {Object.entries(nlpResult.emotions).map(([emo, pct]) => (
                      <div key={emo}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                          <span style={{ color: emo === nlpResult.dominantEmotion ? '#FFFFFF' : 'var(--text-secondary)', fontWeight: emo === nlpResult.dominantEmotion ? 600 : 400 }}>
                            {emo} {emo === nlpResult.dominantEmotion && '★'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: emo === 'Joy' ? '#00D68F' : emo === 'Curiosity' ? '#0070F3' : emo === 'Confidence' ? '#FFC700' : emo === 'Anger' ? '#EF4444' : emo === 'Sadness' ? '#8B2BE2' : '#A78BFA'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metric Row 3: Readability & Key Terms */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {/* Readability Card */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Readability &amp; Difficulty
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '6px' }}>
                      {nlpResult.readability.score} / 100
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {nlpResult.readability.grade}
                    </div>
                  </div>

                  {/* Key Terms Card */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                      Extracted Key Terms
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {nlpResult.keywords.length > 0 ? (
                        nlpResult.keywords.map(k => (
                          <span key={k.word} style={{
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {k.word} ({k.count})
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>No major keywords</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} style={{ color: '#00D68F' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Groq LPU™ acceleration delivers real-time sub-second token generation across the VIBGYOR cognitive architecture.
          </span>
        </div>
      </div>
    </div>
  );
}

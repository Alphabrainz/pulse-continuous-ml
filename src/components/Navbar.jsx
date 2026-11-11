import { 
  Menu, 
  ChevronDown, 
  Sliders, 
  Volume2, 
  VolumeX, 
  PhoneCall,
  Flame,
  Brain,
  LogOut
} from 'lucide-react';
import PulseLogo from './PulseLogo';

export default function Navbar({ 
  onToggleSidebar, 
  isSidebarOpen,
  selectedModel,
  onOpenModelModal,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  onNewChat,
  onOpenVoiceCall,
  currentUser = null,
  onOpenAuthModal,
  onSignOut,
  cloudSyncStatus = 'offline',
  geminiApiEnabled = true,
  groqApiEnabled = true,
  onToggleGeminiApi,
  onToggleGroqApi,
  onToggleAllApis
}) {
  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        width: '100%',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(7, 8, 14, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
      }}
    >
      {/* Left Area: Toggle + Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-icon"
          title={isSidebarOpen ? 'Hide conversation sidebar' : 'Show conversation sidebar'}
        >
          <Menu size={18} />
        </button>

        <div onClick={onNewChat} style={{ cursor: 'pointer' }}>
          <PulseLogo size="medium" animated={true} showText={true} badge="2.5" />
        </div>
      </div>

      {/* Center Area: Model Switcher & API Gateway Status / Local Testing Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onOpenModelModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }}
        >
          <span 
            style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              backgroundColor: (!geminiApiEnabled && !groqApiEnabled) ? '#A78BFA' : (selectedModel?.color || '#8B2BE2'),
              boxShadow: `0 0 6px ${(!geminiApiEnabled && !groqApiEnabled) ? '#A78BFA' : (selectedModel?.color || '#8B2BE2')}` 
            }} 
          />
          <span>{(!geminiApiEnabled && !groqApiEnabled) ? 'Local Trained Model' : (selectedModel?.name || 'Pulse 2.5 Flash Flow')}</span>
          <ChevronDown size={13} style={{ opacity: 0.6 }} />
        </button>

        {/* API On/Off & Local Model Testing Pill */}
        <button
          type="button"
          onClick={() => {
            const bothOff = !geminiApiEnabled && !groqApiEnabled;
            if (onToggleAllApis) onToggleAllApis(bothOff);
          }}
          title={
            (!geminiApiEnabled && !groqApiEnabled)
              ? "Both APIs are OFF. Testing Local Trained Model. Click to re-enable both Cloud APIs."
              : (!geminiApiEnabled && groqApiEnabled)
              ? "Gemini API is OFF, Groq is ON. Click to toggle all APIs."
              : (geminiApiEnabled && !groqApiEnabled)
              ? "Groq API is OFF, Gemini is ON. Click to toggle all APIs."
              : "Both APIs (Gemini & Groq) are ON. Click to turn OFF both APIs and test your Local Trained Model."
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: (!geminiApiEnabled && !groqApiEnabled) 
              ? 'rgba(167, 139, 250, 0.16)' 
              : (!geminiApiEnabled || !groqApiEnabled)
              ? 'rgba(255, 199, 0, 0.12)'
              : 'rgba(0, 214, 143, 0.08)',
            border: `1px solid ${
              (!geminiApiEnabled && !groqApiEnabled)
                ? 'rgba(167, 139, 250, 0.45)'
                : (!geminiApiEnabled || !groqApiEnabled)
                ? 'rgba(255, 199, 0, 0.35)'
                : 'rgba(0, 214, 143, 0.25)'
            }`,
            color: (!geminiApiEnabled && !groqApiEnabled)
              ? '#A78BFA'
              : (!geminiApiEnabled || !groqApiEnabled)
              ? '#FFC700'
              : '#00D68F',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: (!geminiApiEnabled && !groqApiEnabled) ? '0 0 12px rgba(167, 139, 250, 0.25)' : 'none'
          }}
        >
          {(!geminiApiEnabled && !groqApiEnabled) ? (
            <>
              <Brain size={12} style={{ color: '#A78BFA' }} />
              <span>🧪 Trained Model (APIs OFF)</span>
            </>
          ) : (!geminiApiEnabled && groqApiEnabled) ? (
            <>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC700' }} />
              <span>Groq ON • Gemini OFF</span>
            </>
          ) : (geminiApiEnabled && !groqApiEnabled) ? (
            <>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC700' }} />
              <span>Gemini ON • Groq OFF</span>
            </>
          ) : (
            <>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D68F', boxShadow: '0 0 6px #00D68F' }} />
              <span>APIs: Online</span>
            </>
          )}
        </button>
      </div>

      {/* Right Area: Audio toggle, Settings, and Profile Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Live Voice Call Button */}
        <button
          type="button"
          onClick={onOpenVoiceCall}
          title="Start Live Voice Call with Pulse Flash"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: 'rgba(0, 214, 143, 0.1)',
            border: '1px solid rgba(0, 214, 143, 0.3)',
            color: '#00D68F',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 214, 143, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(0, 214, 143, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 214, 143, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 214, 143, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 214, 143, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <PhoneCall size={13} style={{ color: '#00D68F' }} />
          <span>Voice Call</span>
        </button>

        {/* Subtle Acoustic Feedback Toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={onToggleSound}
          title={soundEnabled ? 'Acoustic cues enabled' : 'Acoustic cues muted'}
          style={{ color: soundEnabled ? '#00D68F' : 'var(--text-muted)' }}
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={onOpenSettings}
          title="Optics & Accessibility Settings"
        >
          <Sliders size={17} />
        </button>

        {/* Firebase Authentication & Profile Status */}
        {currentUser ? (
          <>
            <button
              type="button"
              onClick={onOpenAuthModal}
              style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                padding: '1.8px',
                background: 'var(--spectral-conic)',
                marginLeft: '4px',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.18s ease'
              }}
              title={`${currentUser.displayName || currentUser.email || 'User'} (${cloudSyncStatus === 'synced' ? 'Cloud Synced' : cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Local'})`}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#0D101A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF'
                  }}
                >
                  {(currentUser.displayName || currentUser.email || 'P')[0].toUpperCase()}
                </div>
              )}

              {/* Cloud Sync Status Indicator Dot */}
              <span 
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: cloudSyncStatus === 'synced' ? '#00D68F' : cloudSyncStatus === 'syncing' ? '#FFB266' : '#71788E',
                  border: '2px solid #07080E',
                  boxShadow: cloudSyncStatus === 'synced' ? '0 0 6px #00D68F' : 'none'
                }}
              />
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out of Pulse Portal"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  color: 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '4px',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FF6B6B';
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.35)';
                  e.currentTarget.style.background = 'rgba(255, 107, 107, 0.09)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            title="Sign in with Firebase to sync your chats across devices"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '9999px',
              background: 'rgba(255, 122, 0, 0.12)',
              border: '1px solid rgba(255, 122, 0, 0.35)',
              color: '#FF9100',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '4px',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 122, 0, 0.22)';
              e.currentTarget.style.borderColor = 'rgba(255, 122, 0, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 122, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 122, 0, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 122, 0, 0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Flame size={13} style={{ color: '#FF7A00' }} />
            <span>Sign In</span>
          </button>
        )}

      </div>
    </header>
  );
}

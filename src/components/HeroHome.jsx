import React from 'react';
import Composer from './Composer';

export default function HeroHome({ 
  onSend, 
  isGenerating, 
  onStop, 
  onFocusChange,
  onOpenVoiceModal,
  onOpenSettings,
  selectedCapability,
  onSelectCapability
}) {
  return (
    <div className="hero-home-container" style={{ position: 'relative', width: '100%', maxWidth: '960px', margin: '0 auto', padding: '60px 20px 100px', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Diffused Multi-Color Aura Glow behind headline and composer (VIBGYOR blend) */}
      <div 
        className="diffused-spectral-backdrop" 
        style={{
          top: '100px',
          height: '420px',
          width: '740px',
          opacity: 0.55
        }} 
      />


      {/* Spacious Centered Prompt Composer */}
      <div style={{ width: '100%', maxWidth: '820px' }}>
        <Composer 
          onSend={onSend}
          isGenerating={isGenerating}
          onStop={onStop}
          onFocusChange={onFocusChange}
          onOpenVoiceModal={onOpenVoiceModal}
          onOpenSettings={onOpenSettings}
          selectedCapability={selectedCapability}
          onSelectCapability={onSelectCapability}
        />
      </div>

    </div>
  );
}


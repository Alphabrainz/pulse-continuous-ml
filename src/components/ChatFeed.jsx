import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import Composer from './Composer';

export default function ChatFeed({ 
  messages, 
  onSend, 
  isGenerating, 
  onStop, 
  onRegenerate, 
  onFocusChange,
  onOpenVoiceModal,
  onOpenSettings,
  selectedCapability,
  onSelectCapability,
  onSpeak,
  isSpeaking,
  speakingMessageId
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div 
      className="chat-feed-container" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Scrollable Messages Area */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 140px',
          width: '100%'
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          {messages.map((msg, index) => (
            <MessageItem 
              key={msg.id || index}
              message={msg}
              onRegenerate={onRegenerate}
              onSpeak={onSpeak}
              isSpeaking={speakingMessageId === msg.id}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Docked Floating Bottom Composer */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px 24px',
          background: 'linear-gradient(to top, var(--bg-midnight) 60%, rgba(7, 8, 14, 0.8) 85%, transparent 100%)',
          zIndex: 20
        }}
      >
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
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            Pulse AI may produce comprehensive insights. Verify statutory citations and critical system implementations.
          </span>
        </div>
      </div>
    </div>
  );
}

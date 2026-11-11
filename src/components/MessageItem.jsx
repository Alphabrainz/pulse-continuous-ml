import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileText, 
  Image as ImageIcon,
  Film,
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  Activity
} from 'lucide-react';
import PulseLogo from './PulseLogo';
import MarkdownRenderer from './MarkdownRenderer';
import YouTubeVideoGrid from './YouTubeVideoCard';
import { copyToClipboard } from '../utils/clipboard';
import { nlpService } from '../services/nlpService';

function MessageItem({ message, onRegenerate, onSpeak, isSpeaking }) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [showNLP, setShowNLP] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async (codeText, id) => {
    const success = await copyToClipboard(codeText);
    if (success) {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  if (isUser) {
    return (
      <div 
        className="message-row user-row" 
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '20px 0',
          width: '100%'
        }}
      >
        <div 
          style={{
            maxWidth: '75%',
            background: 'rgba(23, 27, 41, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            borderBottomRightRadius: '4px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}
        >
          {message.attachment && (
            <div style={{ marginBottom: '10px' }}>
              {/* Photo / Image Attachment */}
              {(message.attachment.kind === 'image' || message.attachment.type?.startsWith('image/') || (message.attachment.previewUrl && message.attachment.previewUrl.startsWith('data:image'))) && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#000', marginBottom: '8px', maxWidth: '360px' }}>
                  <img 
                    src={message.attachment.previewUrl || message.attachment.dataUrl} 
                    alt={message.attachment.name}
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(15, 18, 28, 0.95)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ImageIcon size={13} style={{ color: '#00D68F' }} />
                      <strong style={{ color: '#FFFFFF' }}>{message.attachment.name}</strong>
                    </span>
                    <span>{message.attachment.size}</span>
                  </div>
                </div>
              )}

              {/* Video Attachment */}
              {(message.attachment.kind === 'video' || message.attachment.type?.startsWith('video/')) && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#000', marginBottom: '8px', maxWidth: '400px' }}>
                  <video 
                    src={message.attachment.previewUrl || message.attachment.dataUrl} 
                    controls
                    playsInline
                    style={{ width: '100%', maxHeight: '260px', display: 'block', background: '#000' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(15, 18, 28, 0.95)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Film size={13} style={{ color: '#FF7A00' }} />
                      <strong style={{ color: '#FFFFFF' }}>{message.attachment.name}</strong>
                    </span>
                    <span>{message.attachment.size}</span>
                  </div>
                </div>
              )}

              {/* Document / Code / Other File Attachment */}
              {!message.attachment.type?.startsWith('image/') && !message.attachment.type?.startsWith('video/') && message.attachment.kind !== 'image' && message.attachment.kind !== 'video' && (
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <FileText size={15} style={{ color: '#00D68F' }} />
                  <span style={{ fontWeight: 600 }}>{message.attachment.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({message.attachment.size})</span>
                </div>
              )}
            </div>
          )}

          <p style={{ color: '#FFFFFF', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
            {message.content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              {message.timestamp || 'Just now'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Response: Clean, natural, readable Markdown surface
  return (
    <div 
      className="message-row assistant-row" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '24px 0',
        width: '100%',
        maxWidth: '840px',
        marginInline: 'auto'
      }}
    >
      {/* Header bar: Pulse AI Identity & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PulseLogo size="small" animated={message.isStreaming} showText={false} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#FFFFFF' }}>Pulse</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {message.model || 'Pulse'}
            </span>
          </div>
        </div>

        {/* Elegant subtle active indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: message.isStreaming ? 'var(--spectral-gradient-horizontal)' : '#00D68F',
              boxShadow: message.isStreaming ? '0 0 8px #8B2BE2' : 'none'
            }} 
          />
        </div>
      </div>

      {/* Main Reading Container */}
      <div 
        className="calm-surface" 
        style={{
          background: 'rgba(14, 17, 27, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.7)',
          padding: '20px 24px',
          position: 'relative'
        }}
      >
        {/* Streaming indicator line */}
        {message.isStreaming && (
          <div 
            className="spectral-line-loader" 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }} 
          />
        )}

        {/* Optional Thought Process Toggle (only if genuine reasoning steps exist) */}
        {message.reasoning && message.reasoning.steps && message.reasoning.steps.length > 0 && (
          <div 
            style={{
              marginBottom: '16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              overflow: 'hidden'
            }}
          >
            <button
              type="button"
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={13} style={{ color: '#8B2BE2' }} />
                <span>Thinking process ({message.reasoning.duration || '0.8s'})</span>
              </div>
              {showReasoning ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {showReasoning && (
              <div style={{ padding: '0 12px 10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
                  {message.reasoning.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                      <span 
                        style={{ 
                          width: '5px', 
                          height: '5px', 
                          borderRadius: '50%', 
                          marginTop: '6px', 
                          backgroundColor: step.color || '#0070F3' 
                        }} 
                      />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Natural Markdown Content Body */}
        <div className="message-content-body">
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Dedicated YouTube Video Cards (Pressable with Thumbnails & In-App Playback on localhost:5173) */}
        {message.videos && message.videos.length > 0 && (
          <YouTubeVideoGrid videos={message.videos} />
        )}

        {/* Structured Legal Risk Table (only rendered if present in loaded sample thread) */}
        {message.legalMatrix && message.legalMatrix.length > 0 && (
          <div style={{ marginTop: '20px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC', marginBottom: '10px' }}>
              Risk Assessment Matrix
            </h4>
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Clause</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Risk</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Severity</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {message.legalMatrix.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < message.legalMatrix.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: '#FFFFFF' }}>{row.clause}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{row.risk}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: row.severity === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: row.severity === 'Critical' ? '#EF4444' : '#F59E0B'
                        }}>
                          {row.severity}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{row.remediation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Standalone Code Snippet (if explicitly attached to message) */}
        {message.codeSnippet && (
          <div style={{ marginTop: '16px', marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#090b14' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {message.codeSnippet.language || 'code'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(message.codeSnippet.code, 'main-code')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  color: copiedCodeId === 'main-code' ? '#00D68F' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                {copiedCodeId === 'main-code' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCodeId === 'main-code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre style={{ margin: 0, padding: '14px 16px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, color: '#E2E8F0' }}>
              <code>{message.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* On-Demand NLP & Sentiment Analysis Panel */}
        {showNLP && message.content && (() => {
          const sentiment = nlpService.analyzeSentiment(message.content);
          return (
            <div style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(15, 18, 28, 0.95)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: sentiment.polarity === 'positive' ? 'rgba(0, 214, 143, 0.15)' : sentiment.polarity === 'negative' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 112, 243, 0.15)',
                    color: sentiment.polarity === 'positive' ? '#00D68F' : sentiment.polarity === 'negative' ? '#EF4444' : '#0070F3'
                  }}>
                    {sentiment.label} ({sentiment.score > 0 ? `+${sentiment.score}` : sentiment.score})
                  </span>
                  <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                    {sentiment.tone}
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#00D68F', fontWeight: 600 }}>
                  ⚡ 0 Tokens (Edge NLP)
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span>Dominant: <strong style={{ color: '#FFFFFF' }}>{sentiment.dominantEmotion} ({sentiment.emotions[sentiment.dominantEmotion]}%)</strong></span>
                <span>•</span>
                <span>Readability: <strong style={{ color: '#FFFFFF' }}>{sentiment.readability.grade}</strong> ({sentiment.readability.score}/100)</span>
                <span>•</span>
                <span>Subjectivity: <strong style={{ color: '#FFFFFF' }}>{sentiment.subjectivity}</strong></span>
              </div>
            </div>
          );
        })()}

        {/* Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            
            <button 
              type="button" 
              className="btn-icon" 
              title="Copy response"
              onClick={handleCopy}
              style={{ color: copied ? '#00D68F' : 'var(--text-muted)' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>

            <button 
              type="button" 
              className="btn-icon" 
              title="Regenerate"
              onClick={() => onRegenerate && onRegenerate(message)}
            >
              <RotateCcw size={14} />
            </button>

            <button 
              type="button" 
              className="btn-icon" 
              title={showNLP ? 'Hide sentiment' : 'Inspect sentiment & tone (0 tokens)'}
              onClick={() => setShowNLP(!showNLP)}
              style={{ 
                color: showNLP ? '#A78BFA' : 'var(--text-muted)',
                background: showNLP ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                borderColor: showNLP ? 'rgba(167, 139, 250, 0.35)' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                padding: '4px 8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Activity size={13} style={{ color: showNLP ? '#A78BFA' : 'inherit' }} />
              <span style={{ fontSize: '11px', color: showNLP ? '#A78BFA' : 'var(--text-muted)' }}>Sentiment</span>
            </button>

            <button 
              type="button" 
              className="btn-icon" 
              title={isSpeaking ? 'Stop voice reading' : 'Listen with ElevenLabs Neural Voice'}
              onClick={() => onSpeak && onSpeak(message.content, message.id)}
              style={{ 
                color: isSpeaking ? '#00D68F' : 'var(--text-muted)',
                background: isSpeaking ? 'rgba(0, 214, 143, 0.15)' : 'transparent',
                borderColor: isSpeaking ? 'rgba(0, 214, 143, 0.35)' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                padding: '4px 8px',
                boxShadow: isSpeaking ? '0 0 14px rgba(0, 214, 143, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} />
                  <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
                    <span className="pulse-eq-bar pulse-eq-1" />
                    <span className="pulse-eq-bar pulse-eq-2" />
                    <span className="pulse-eq-bar pulse-eq-3" />
                    <span className="pulse-eq-bar pulse-eq-4" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#00D68F' }}>Reading</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Read</span>
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              {message.latency || '0.8s'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default React.memo(MessageItem, (prevProps, nextProps) => {
  return (
    prevProps.isSpeaking === nextProps.isSpeaking &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.latency === nextProps.message.latency &&
    prevProps.message.videos === nextProps.message.videos
  );
});

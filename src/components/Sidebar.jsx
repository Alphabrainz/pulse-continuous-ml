import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Star,
  Trash2,
  ChevronLeft, 
  Sliders,
  Sparkles,
  Bookmark,
  Flame,
  Cloud,
  LogOut
} from 'lucide-react';
import PulseLogo from './PulseLogo';

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  onOpenSettings,
  onSelectThread,
  currentThreadId,
  conversations = [],
  onDeleteThread,
  onTogglePinThread,
  pinnedThreadIds = [],
  importantNotes = [],
  currentUser = null,
  onOpenAuthModal,
  onSignOut,
  cloudSyncStatus = 'offline'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  const filteredThreads = conversations.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedThreads = filteredThreads.filter(t => 
    pinnedThreadIds.includes(t.id) || t.isPinned
  );

  const regularThreads = filteredThreads.filter(t => 
    !pinnedThreadIds.includes(t.id) && !t.isPinned
  );

  const formatThreadTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 5) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <aside 
      className={`pulse-sidebar ${isOpen ? 'open' : 'closed'}`}
      style={{
        width: isOpen ? '290px' : '0px',
        minWidth: isOpen ? '290px' : '0px',
        height: 'calc(100vh - 60px)',
        background: 'rgba(11, 13, 21, 0.96)',
        borderRight: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 40,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
          
          {/* Header & Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <PulseLogo size="medium" showText={true} badge="2.5" />
            <button 
              type="button" 
              onClick={onToggle}
              className="btn-icon"
              title="Collapse sidebar"
              style={{ width: '28px', height: '28px' }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={onNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '14px',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <Plus size={16} />
            <span>New Conversation</span>
          </button>

          {/* Search Bar */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '16px'
            }}
          >
            <Search size={14} style={{ color: 'var(--text-faint)' }} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12.5px'
              }}
            />
          </div>

          {/* Scrollable Conversation Sections */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '2px' }}>
            
            {/* ⭐ IMPORTANT / PINNED SECTION */}
            {pinnedThreads.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#FFC700', padding: '0 8px 6px' }}>
                  <Star size={12} fill="#FFC700" />
                  <span>Important & Pinned</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pinnedThreads.map((thread) => {
                    const isSelected = thread.id === currentThreadId;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => onSelectThread(thread)}
                        className="sidebar-thread-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255, 199, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isSelected ? 'rgba(255, 199, 0, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.16s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                          <Star size={13} fill="#FFC700" color="#FFC700" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FFFFFF' : '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {thread.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            title="Unpin"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onTogglePinThread) onTogglePinThread(thread.id);
                            }}
                            style={{ background: 'none', border: 'none', color: '#FFC700', cursor: 'pointer', padding: '2px', display: 'flex' }}
                          >
                            <Star size={12} fill="#FFC700" />
                          </button>
                          {onDeleteThread && (
                            <button
                              type="button"
                              title="Delete conversation"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThread(thread.id);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECENT CONVERSATIONS */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)', padding: '0 8px 6px' }}>
                Recent Conversations
              </div>

              {regularThreads.length === 0 && pinnedThreads.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                  No conversations yet.<br />Start by sending a prompt!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {regularThreads.map((thread) => {
                    const isSelected = thread.id === currentThreadId;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => onSelectThread(thread)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          border: isSelected ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.16s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                          <span 
                            style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              flexShrink: 0,
                              backgroundColor: thread.color || '#0070F3',
                              boxShadow: `0 0 6px ${thread.color || '#0070F3'}`
                            }} 
                          />
                          <span style={{ fontSize: '13px', color: isSelected ? '#FFFFFF' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {thread.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                            {formatThreadTime(thread.updatedAt || thread.createdAt)}
                          </span>

                          <button
                            type="button"
                            title="Mark as Important (Pin to sidebar)"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onTogglePinThread) onTogglePinThread(thread.id);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                          >
                            <Star size={12} />
                          </button>

                          {onDeleteThread && (
                            <button
                              type="button"
                              title="Delete conversation"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThread(thread.id);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Settings & Workspace Info */}
          <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              type="button"
              onClick={onOpenSettings}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Sliders size={15} />
              <span>Settings & Keys</span>
            </button>

            {/* Firebase Cloud Sync Status Button */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              title={currentUser ? "Connected to Cloud Firestore" : "Sign in to enable cloud conversation sync"}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                background: currentUser ? 'rgba(0, 214, 143, 0.06)' : 'rgba(255, 122, 0, 0.06)',
                border: `1px solid ${currentUser ? 'rgba(0, 214, 143, 0.18)' : 'rgba(255, 122, 0, 0.18)'}`,
                color: currentUser ? '#00D68F' : '#FF9100',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentUser ? (
                  <Cloud size={13} style={{ color: '#00D68F' }} />
                ) : (
                  <Flame size={13} style={{ color: '#FF7A00' }} />
                )}
                <span>
                  {currentUser 
                    ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Cloud Synced') 
                    : 'Sync to Firebase'}
                </span>
              </div>
              <span 
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: currentUser ? (cloudSyncStatus === 'synced' ? '#00D68F' : '#FFB266') : '#FF7A00',
                  boxShadow: currentUser && cloudSyncStatus === 'synced' ? '0 0 6px #00D68F' : 'none' 
                }} 
              />
            </button>

            {/* Direct Sign Out Button */}
            {currentUser && onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out of Pulse Portal"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)';
                  e.currentTarget.style.color = '#FF6B6B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 0', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D68F' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pulse AI</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>v2.5 Flow</span>
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}

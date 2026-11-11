import React, { useState } from 'react';
import { Play, ExternalLink, X, Maximize2, Minimize2, Tv } from 'lucide-react';

export function YouTubeVideoCard({ video, onPlay, isPlaying, onStop, onExpandTheater }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!video) return null;

  const isSearchLink = Boolean(video.isSearchLink || !video.id || video.id.startsWith('search-fallback'));

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        overflow: 'hidden',
        background: isPlaying 
          ? 'rgba(12, 14, 24, 0.98)' 
          : 'rgba(16, 20, 32, 0.92)',
        border: isPlaying 
          ? '1px solid rgba(255, 68, 68, 0.6)' 
          : isHovered 
            ? '1px solid rgba(255, 68, 68, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isPlaying 
          ? '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 24px rgba(255, 0, 0, 0.25)' 
          : isHovered 
            ? '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 68, 68, 0.15)' 
            : '0 8px 24px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}
    >
      {/* Active Embedded Player Running Right on localhost:5173 */}
      {isPlaying ? (
        <div style={{ position: 'relative', width: '100%', background: '#000' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </div>

          {/* Player Controls Bar */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '8px 12px', 
              background: 'rgba(10, 12, 20, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  background: '#FF0000', 
                  color: '#FFFFFF', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  letterSpacing: '0.4px' 
                }}
              >
                PLAYING ON PULSE
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {video.channelTitle}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onExpandTheater && (
                <button
                  type="button"
                  onClick={() => onExpandTheater(video)}
                  title="Expand to Theater View"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  <Maximize2 size={12} />
                  <span>Theater</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={onStop}
                title="Stop video and return to thumbnail"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <X size={12} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Pressable Thumbnail Container */
        <div
          onClick={() => {
            if (isSearchLink) {
              window.open(video.url, '_blank', 'noopener,noreferrer');
            } else {
              onPlay(video);
            }
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '175px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: '#090B14'
          }}
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />

          {/* Gradient Overlay for Text Legibility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)'
            }}
          />

          {/* Top Badges */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              left: '10px', 
              right: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              pointerEvents: 'none' 
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 0, 0, 0.92)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
            >
              <Tv size={12} />
              YouTube
            </span>

            {video.publishedAt && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '10.5px',
                  fontWeight: 500
                }}
              >
                {video.publishedAt}
              </span>
            )}
          </div>

          {/* Center Play Button Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${isHovered ? 1.12 : 1})`,
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(255, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isHovered 
                ? '0 0 25px rgba(255, 0, 0, 0.8), 0 4px 15px rgba(0, 0, 0, 0.6)' 
                : '0 4px 15px rgba(0, 0, 0, 0.6)',
              color: '#FFFFFF'
            }}
          >
            <Play size={22} fill="#FFFFFF" style={{ marginLeft: '3px' }} />
          </div>

          {/* Bottom quick badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 214, 143, 0.9)',
              color: '#080A12',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span>▶ CLICK TO PLAY</span>
          </div>
        </div>
      )}

      {/* Video Details & Meta Section */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <h4
          title={video.title}
          style={{
            margin: 0,
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {video.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px'
              }}
            >
              {video.channelTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Watch on Pulse Action Button */}
            {!isPlaying && !isSearchLink && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(video);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(255, 0, 0, 0.3)'
                }}
              >
                <Play size={11} fill="#FFF" />
                <span>Play Here</span>
              </button>
            )}

            {/* External link to YouTube */}
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open video on YouTube.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive Grid of Pressable YouTube Video Cards
 */
export default function YouTubeVideoGrid({ videos = [], title = 'Recommended YouTube Videos' }) {
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [theaterVideo, setTheaterVideo] = useState(null);

  if (!Array.isArray(videos) || videos.length === 0) return null;

  return (
    <div style={{ margin: '18px 0', width: '100%' }}>
      {/* Section Header */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: '26px', 
              height: '26px', 
              borderRadius: '7px', 
              background: 'rgba(255, 0, 0, 0.15)', 
              border: '1px solid rgba(255, 0, 0, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FF4D4D'
            }}
          >
            <Tv size={15} />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.2px' }}>
              {title}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              ({videos.length} {videos.length === 1 ? 'video' : 'videos'})
            </span>
          </div>
        </div>

        <span 
          style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            borderRadius: '9999px', 
            background: 'rgba(0, 214, 143, 0.12)', 
            color: '#00D68F',
            fontWeight: 600 
          }}
        >
          ⚡ Plays Directly on Pulse (localhost:5173)
        </span>
      </div>

      {/* Grid Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: videos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          width: '100%'
        }}
      >
        {videos.map((vid, idx) => (
          <YouTubeVideoCard
            key={vid.id || idx}
            video={vid}
            isPlaying={activeVideoId === vid.id}
            onPlay={(v) => setActiveVideoId(v.id)}
            onStop={() => setActiveVideoId(null)}
            onExpandTheater={(v) => setTheaterVideo(v)}
          />
        ))}
      </div>

      {/* Theater View Modal for Full Immersion */}
      {theaterVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(3, 5, 10, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '20px'
          }}
          onClick={() => setTheaterVideo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '920px',
              background: '#0B0D16',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 0, 0, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#FF0000', color: '#FFF', fontSize: '10px', fontWeight: 700 }}>
                  THEATER
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                  {theaterVideo.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTheaterVideo(null)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Video Frame */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${theaterVideo.id}?autoplay=1&rel=0`}
                title={theaterVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            >
              <span>Channel: <strong style={{ color: '#FFFFFF' }}>{theaterVideo.channelTitle}</strong></span>
              <a
                href={theaterVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00D68F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Open full video on YouTube</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

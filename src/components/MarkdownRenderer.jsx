import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import katex from 'katex';
import { extractYouTubeId } from '../services/youtubeService';
import { YouTubeVideoCard } from './YouTubeVideoCard';

function InlineVideoEmbed({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div style={{ margin: '10px 0', maxWidth: '420px' }}>
      <YouTubeVideoCard
        video={video}
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onStop={() => setIsPlaying(false)}
      />
    </div>
  );
}

const katexCache = new Map();

function renderKaTeX(math, displayMode = false) {
  const cacheKey = `${displayMode ? 'D:' : 'I:'}${math}`;
  if (katexCache.has(cacheKey)) {
    return katexCache.get(cacheKey);
  }
  try {
    const rendered = katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false
    });
    if (katexCache.size > 400) {
      const first = katexCache.keys().next().value;
      katexCache.delete(first);
    }
    katexCache.set(cacheKey, rendered);
    return rendered;
  } catch (err) {
    return math;
  }
}

import { copyToClipboard } from '../utils/clipboard';

const codeHighlightCache = new Map();

function highlightCodeAntigravity(code) {
  if (!code) return '';
  if (codeHighlightCache.has(code)) {
    return codeHighlightCache.get(code);
  }

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'from', 'default',
    'class', 'extends', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
    'continue', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof',
    'async', 'await', 'def', 'elif', 'pass', 'lambda', 'in', 'is', 'not', 'and', 'or',
    'yield', 'with', 'as', 'self', 'public', 'private', 'protected', 'void', 'int',
    'float', 'double', 'char', 'bool', 'true', 'false', 'null', 'undefined', 'None',
    'interface', 'type', 'enum', 'namespace', 'struct'
  ]);

  const builtins = new Set([
    'console', 'window', 'document', 'Math', 'JSON', 'Promise', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Map', 'Set', 'React', 'useState',
    'useEffect', 'useRef', 'useMemo', 'useCallback', 'print', 'len', 'range', 'enumerate',
    'zip', 'np', 'pd', 'plt', 'torch', 'nn', 'qiskit'
  ]);

  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_$][\w$]*\b|[^\s\w$]+|\s+)/g;

  let html = '';
  let match;

  while ((match = tokenRegex.exec(code)) !== null) {
    const token = match[0];

    // Comments -> Muted Slate (Italic)
    if (token.startsWith('//') || token.startsWith('/*') || (token.startsWith('#') && !token.startsWith('#include'))) {
      html += `<span style="color: #64748B; font-style: italic;">${escapeHtml(token)}</span>`;
    }
    // Strings -> Electric Mint / Emerald
    else if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")) || (token.startsWith('`') && token.endsWith('`'))) {
      html += `<span style="color: #00D68F;">${escapeHtml(token)}</span>`;
    }
    // Numbers -> Warm Golden Amber
    else if (/^\d+(?:\.\d+)?$/.test(token)) {
      html += `<span style="color: #FFC700;">${escapeHtml(token)}</span>`;
    }
    // Keywords -> Vibrant Neon Violet
    else if (keywords.has(token)) {
      html += `<span style="color: #A78BFA; font-weight: 600;">${escapeHtml(token)}</span>`;
    }
    // Built-ins -> Rose
    else if (builtins.has(token)) {
      html += `<span style="color: #F43F5E; font-weight: 500;">${escapeHtml(token)}</span>`;
    }
    // Functions (word followed by parenthesis) -> Vibrant Electric Cyan
    else if (/^[a-zA-Z_$][\w$]*$/.test(token)) {
      const nextIdx = tokenRegex.lastIndex;
      const lookahead = code.slice(nextIdx, nextIdx + 20);
      if (/^\s*\(/.test(lookahead)) {
        html += `<span style="color: #38BDF8; font-weight: 500;">${escapeHtml(token)}</span>`;
      } else if (/^[A-Z]/.test(token)) {
        html += `<span style="color: #818CF8;">${escapeHtml(token)}</span>`;
      } else {
        html += `<span style="color: #E2E8F0;">${escapeHtml(token)}</span>`;
      }
    }
    // Symbols / Operators -> Silver
    else {
      html += `<span style="color: #94A3B8;">${escapeHtml(token)}</span>`;
    }
  }

  if (codeHighlightCache.size > 300) {
    const first = codeHighlightCache.keys().next().value;
    codeHighlightCache.delete(first);
  }
  codeHighlightCache.set(code, html);
  return html;
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlightedHtml = highlightCodeAntigravity(code);

  return (
    <div 
      className="antigravity-code-container"
      style={{
        margin: '18px 0',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        background: 'linear-gradient(180deg, #0e121f 0%, #080a13 100%)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px -6px rgba(56, 189, 248, 0.15)'
      }}
    >
      {/* Antigravity RGB Window Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Traffic light RGB control dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FF5F56', display: 'inline-block', boxShadow: '0 0 6px rgba(255, 95, 86, 0.4)' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FFBD2E', display: 'inline-block', boxShadow: '0 0 6px rgba(255, 189, 46, 0.4)' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27C93F', display: 'inline-block', boxShadow: '0 0 6px rgba(39, 201, 63, 0.4)' }} />
          </div>
          <span style={{ color: '#38BDF8', fontWeight: 600, fontSize: '11.5px', textTransform: 'lowercase', letterSpacing: '0.04em' }}>
            {language || 'code'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '3px 8px',
            color: copied ? '#00D68F' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = copied ? '#00D68F' : 'var(--text-secondary)';
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre 
        style={{
          margin: 0,
          padding: '16px',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: 1.65,
          color: '#E2E8F0',
          whiteSpace: 'pre'
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
}

function parseInlineTokens(text) {
  if (!text) return null;

  const tokens = [];
  let keyIdx = 0;

  // Regex matches:
  // 1. Markdown Images: ![alt](url)
  // 2. Inline KaTeX Math: $...$ or \(...\)
  // 3. Inline code: `...`
  // 4. Bold: **...**
  // 5. Italic: *...*
  // 6. Links: [text](url)
  const regex = /(!\[[^\]]*\]\([^)]+\)|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Markdown Image: ![alt](url)
    if (token.startsWith('![') && token.includes('](')) {
      const altText = token.slice(2, token.indexOf(']('));
      const imgUrl = token.slice(token.indexOf('](') + 2, -1);
      tokens.push(
        <div 
          key={keyIdx++} 
          style={{ 
            margin: '14px 0', 
            borderRadius: '14px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 255, 255, 0.14)', 
            background: 'rgba(10, 13, 24, 0.95)', 
            maxWidth: '560px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          <img 
            src={imgUrl} 
            alt={altText} 
            loading="lazy" 
            style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} 
          />
          {altText && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: '11.5px', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span>{altText}</span>
              <a 
                href={imgUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download={`pulse-${Date.now()}.jpg`}
                style={{ color: '#00D68F', textDecoration: 'none', fontWeight: 500 }}
              >
                Download
              </a>
            </div>
          )}
        </div>
      );
    }
    // Inline LaTeX / KaTeX math: $...$ or \(...\)
    else if ((token.startsWith('$') && token.endsWith('$')) || (token.startsWith('\\(') && token.endsWith('\\)'))) {
      const mathInner = token.startsWith('$') ? token.slice(1, -1) : token.slice(2, -2);
      const html = renderKaTeX(mathInner, false);
      tokens.push(
        <span 
          key={keyIdx++}
          className="katex-inline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code 
          key={keyIdx++} 
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#38BDF8',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9em'
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={keyIdx++} style={{ color: '#FFFFFF', fontWeight: 600 }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={keyIdx++} style={{ color: 'var(--text-secondary)' }}>
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkText = token.slice(1, token.indexOf(']('));
      const linkUrl = token.slice(token.indexOf('](') + 2, -1);
      const ytId = extractYouTubeId(linkUrl);

      if (ytId) {
        const vidObj = {
          id: ytId,
          title: linkText || 'YouTube Video',
          channelTitle: 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          url: linkUrl,
          embedUrl: `https://www.youtube.com/embed/${ytId}`
        };
        tokens.push(<InlineVideoEmbed key={keyIdx++} video={vidObj} />);
      } else {
        tokens.push(
          <a 
            key={keyIdx++} 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0070F3', textDecoration: 'underline' }}
          >
            {linkText}
          </a>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Split by code blocks and display math blocks
  // Regex identifies:
  // 1. Triple-backtick Code: ```lang ... ```
  // 2. Block KaTeX Math: $$ ... $$ or \[ ... \]
  const parts = [];
  const blockRegex = /(```(\w*)\n([\s\S]*?)(?:```|$))|(\$\$([\s\S]*?)\$\$)|(\\\[([\s\S]*?)\\\])/g;
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Code block
      parts.push({
        type: 'code',
        language: match[2] || '',
        code: match[3].trimEnd()
      });
    } else if (match[4]) {
      // Block Math $$...$$
      parts.push({
        type: 'math',
        math: match[5]
      });
    } else if (match[6]) {
      // Block Math \[...\]
      parts.push({
        type: 'math',
        math: match[7]
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <div className="pulse-markdown-body" style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.7 }}>
      {parts.map((part, partIdx) => {
        if (part.type === 'code') {
          return <CodeBlock key={partIdx} language={part.language} code={part.code} />;
        }

        if (part.type === 'math') {
          const html = renderKaTeX(part.math, true);
          return (
            <div 
              key={partIdx}
              className="katex-display-wrapper"
              style={{ overflowX: 'auto', margin: '14px 0', padding: '6px 0', textAlign: 'center' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Parse regular text into blocks (paragraphs, headers, lists)
        const blocks = part.content.split(/\n{2,}/);

        return blocks.map((block, blockIdx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // Headers
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={`${partIdx}-${blockIdx}`} style={{ fontSize: '20px', fontWeight: 700, margin: '20px 0 10px', color: '#FFFFFF' }}>
                {parseInlineTokens(trimmed.slice(2))}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={`${partIdx}-${blockIdx}`} style={{ fontSize: '17px', fontWeight: 600, margin: '18px 0 8px', color: '#FFFFFF' }}>
                {parseInlineTokens(trimmed.slice(3))}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={`${partIdx}-${blockIdx}`} style={{ fontSize: '15px', fontWeight: 600, margin: '14px 0 6px', color: '#FFFFFF' }}>
                {parseInlineTokens(trimmed.slice(4))}
              </h3>
            );
          }

          // Horizontal Rule
          if (trimmed === '---' || trimmed === '***') {
            return (
              <hr 
                key={`${partIdx}-${blockIdx}`} 
                style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '18px 0' }} 
              />
            );
          }

          // Lists (bulleted or numbered)
          const lines = trimmed.split('\n');
          const isBulletList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || l.trim().startsWith('• '));
          const isNumList = lines.every(l => /^\d+\.\s/.test(l.trim()));

          if (isBulletList) {
            return (
              <ul key={`${partIdx}-${blockIdx}`} style={{ margin: '10px 0 14px 20px', padding: 0 }}>
                {lines.map((line, lIdx) => (
                  <li key={lIdx} style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {parseInlineTokens(line.trim().replace(/^[-*•]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }

          if (isNumList) {
            return (
              <ol key={`${partIdx}-${blockIdx}`} style={{ margin: '10px 0 14px 20px', padding: 0 }}>
                {lines.map((line, lIdx) => (
                  <li key={lIdx} style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {parseInlineTokens(line.trim().replace(/^\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }

          // Regular paragraph (respect single line breaks)
          return (
            <p key={`${partIdx}-${blockIdx}`} style={{ margin: '0 0 14px 0', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {lines.map((l, lIdx) => (
                <React.Fragment key={lIdx}>
                  {parseInlineTokens(l)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        });
      })}
    </div>
  );
}

export default React.memo(MarkdownRenderer);

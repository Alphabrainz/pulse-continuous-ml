/**
 * Pulse AI Robust Clipboard Utility
 * Ensures copying works reliably across all environments:
 * HTTPS, HTTP localhost, iframes, and browser permission restrictions.
 */

export async function copyToClipboard(text) {
  if (!text && text !== '') return false;
  
  const textToCopy = String(text);

  // Strategy 1: Modern asynchronous clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (apiErr) {
      console.warn('navigator.clipboard.writeText was rejected, attempting fallback:', apiErr);
    }
  }

  // Strategy 2: Reliable hidden textarea execCommand fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    
    // Position out of sight without hiding completely (iOS/Safari requires visibility)
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, textToCopy.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) return true;
  } catch (fallbackErr) {
    console.error('Fallback execCommand failed:', fallbackErr);
  }

  return false;
}

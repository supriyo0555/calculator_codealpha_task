import React, { useState, useEffect, useRef } from 'react';
import { formatDisplayNumber } from '../utils/calculatorLogic';

/**
 * Display Component
 * Apple-inspired dual-line calculator display featuring:
 * - Mathematical expression line with clean operator typography
 * - Dynamic font-size scaling for large numbers
 * - Real-time calculation preview badge
 * - Error state formatting
 * - Copy result to clipboard with visual toast
 */
const Display = ({ expression, currentValue, result, livePreview, error }) => {
  const [copied, setCopied] = useState(false);
  const mainDisplayRef = useRef(null);

  // Format expression operators for beautiful rendering
  const formattedExpression = (expression || '')
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/(?<=\d|\))\-(?=\d)/g, ' − ');

  // Determine what to show on main line
  const displayValue = error 
    ? error 
    : currentValue !== '' 
      ? formatDisplayNumber(currentValue) 
      : result !== null 
        ? formatDisplayNumber(result) 
        : '0';

  // Calculate dynamic font scale depending on number of characters
  const getFontSize = (str) => {
    const len = String(str).length;
    if (len <= 7) return '3.25rem';
    if (len <= 9) return '2.75rem';
    if (len <= 12) return '2.25rem';
    if (len <= 15) return '1.8rem';
    return '1.4rem';
  };

  // Copy result to clipboard
  const handleCopy = async () => {
    if (error || displayValue === '0') return;
    try {
      const rawText = currentValue !== '' ? currentValue : String(result);
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div className={`calculator-display ${error ? 'display-error' : ''}`}>
      {/* Top Header bar with status indicators & Copy */}
      <div className="display-top-bar">
        <div className="display-indicators">
          {error && <span className="error-pill">Error</span>}
          {livePreview !== null && !error && (
            <span className="live-preview-pill" title="Live preview">
              = {formatDisplayNumber(livePreview)}
            </span>
          )}
        </div>

        {/* Copy Result Button */}
        <button
          type="button"
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy result to clipboard"
          aria-label="Copy result"
        >
          {copied ? (
            <>
              <svg className="copy-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Expression line (History / Current Operation) */}
      <div className="display-expression" title={expression}>
        {formattedExpression || <span>&nbsp;</span>}
      </div>

      {/* Main primary value line with responsive font size */}
      <div
        ref={mainDisplayRef}
        className="display-main-value"
        style={{ fontSize: getFontSize(displayValue) }}
      >
        {displayValue}
      </div>
    </div>
  );
};

export default React.memo(Display);

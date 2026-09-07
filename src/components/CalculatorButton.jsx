import React, { useState } from 'react';

/**
 * CalculatorButton Component
 * Renders an Apple-inspired glassmorphic button with micro-interactions,
 * active keyboard flash support, ripple feedback, and distinct variant styling.
 * 
 * Props:
 * - label: string | ReactNode
 * - value: string
 * - type: 'number' | 'operator' | 'action' | 'equals'
 * - isActive: boolean (e.g. active operator or triggered via keyboard)
 * - isDouble: boolean (spans 2 columns if needed)
 * - onClick: (value: string, type: string) => void
 * - ariaLabel: string
 */
const CalculatorButton = ({
  label,
  value,
  type = 'number',
  isActive = false,
  isDouble = false,
  onClick,
  ariaLabel
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    // Create subtle tactile button feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 140);
    if (onClick) {
      onClick(value, type);
    }
  };

  const buttonClasses = [
    'calc-btn',
    `btn-${type}`,
    isActive ? 'btn-active' : '',
    isPressed ? 'btn-pressed' : '',
    isDouble ? 'btn-double' : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      aria-label={ariaLabel || (typeof label === 'string' ? label : value)}
      data-key={value}
    >
      <span className="btn-content">{label}</span>
      <span className="btn-glow-ring" />
    </button>
  );
};

export default React.memo(CalculatorButton);

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Display from './Display';
import CalculatorButton from './CalculatorButton';
import {
  calculateExpression,
  isOperator,
  OPERATORS,
  cleanFloat
} from '../utils/calculatorLogic';
import { soundEffects } from '../utils/soundEffects';

/**
 * Calculator Component
 * Core state orchestrator and UI coordinator for the Glassmorphic Calculator.
 */
const Calculator = () => {
  // Calculator States
  const [expression, setExpression] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [result, setResult] = useState(null);
  const [livePreview, setLivePreview] = useState(null);
  const [error, setError] = useState(null);
  const [activeOp, setActiveOp] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // History & Sound State
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('glasscalc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('glasscalc_history', JSON.stringify(history));
    } catch {
      // Ignore if localStorage quota exceeded
    }
  }, [history]);

  // Flash key feedback for physical keyboard
  const triggerKeyFlash = useCallback((keyVal) => {
    setActiveKey(keyVal);
    setTimeout(() => {
      setActiveKey((prev) => (prev === keyVal ? null : prev));
    }, 150);
  }, []);

  // Update live calculation preview whenever expression changes
  useEffect(() => {
    if (!expression || error) {
      setLivePreview(null);
      return;
    }

    // Check if expression has at least one operator and ends with a digit
    const hasOp = /[\+\-\*\/]/.test(expression);
    const endsWithDigit = /\d$/.test(expression.trim());

    if (hasOp && endsWithDigit) {
      try {
        const preview = calculateExpression(expression);
        if (typeof preview === 'number' && !isNaN(preview)) {
          setLivePreview(preview);
        } else {
          setLivePreview(null);
        }
      } catch {
        setLivePreview(null);
      }
    } else {
      setLivePreview(null);
    }
  }, [expression, error]);

  // Handle Number Input
  const handleDigit = useCallback((digit) => {
    soundEffects.playClick('number');
    triggerKeyFlash(digit);

    if (error) {
      // Clear error and reset
      setError(null);
      setExpression(digit);
      setCurrentValue(digit);
      setResult(null);
      setIsCalculated(false);
      setActiveOp(null);
      return;
    }

    if (isCalculated) {
      // Start a fresh calculation after previous '='
      setExpression(digit);
      setCurrentValue(digit);
      setResult(null);
      setIsCalculated(false);
      setActiveOp(null);
      return;
    }

    // Normal digit entry
    setCurrentValue((prev) => {
      if (prev === '0' && digit !== '0') return digit;
      if (prev === '0' && digit === '0') return '0';
      return prev + digit;
    });

    setExpression((prev) => {
      if (prev === '0' && digit !== '0') return digit;
      return prev + digit;
    });

    setActiveOp(null);
  }, [error, isCalculated, triggerKeyFlash]);

  // Handle Decimal Point
  const handleDecimal = useCallback(() => {
    soundEffects.playClick('number');
    triggerKeyFlash('.');

    if (error || isCalculated) {
      setError(null);
      setExpression('0.');
      setCurrentValue('0.');
      setResult(null);
      setIsCalculated(false);
      setActiveOp(null);
      return;
    }

    // If current value already contains decimal, ignore
    if (currentValue.includes('.')) return;

    if (!currentValue || isOperator(expression.slice(-1))) {
      setCurrentValue('0.');
      setExpression((prev) => prev + '0.');
    } else {
      setCurrentValue((prev) => prev + '.');
      setExpression((prev) => prev + '.');
    }
    setActiveOp(null);
  }, [error, isCalculated, currentValue, expression, triggerKeyFlash]);

  // Handle Arithmetic Operators (+, -, *, /)
  const handleOperator = useCallback((op) => {
    soundEffects.playClick('operator');
    triggerKeyFlash(op);

    if (error) {
      setError(null);
      setExpression('0' + op);
      setCurrentValue('');
      setResult(null);
      setIsCalculated(false);
      setActiveOp(op);
      return;
    }

    if (isCalculated && result !== null) {
      // Chain from previous result
      setExpression(String(result) + op);
      setCurrentValue('');
      setIsCalculated(false);
      setActiveOp(op);
      return;
    }

    if (!expression) {
      // If user starts with minus, treat as negative number
      if (op === '-') {
        setExpression('-');
        setCurrentValue('-');
      } else {
        setExpression('0' + op);
        setCurrentValue('');
        setActiveOp(op);
      }
      return;
    }

    const lastChar = expression.slice(-1);

    // If last character was already an operator
    if (isOperator(lastChar)) {
      // Allow minus as negative number after * or /
      if ((lastChar === '*' || lastChar === '/') && op === '-') {
        setExpression((prev) => prev + '-');
        setCurrentValue('-');
        return;
      }
      // Otherwise replace previous operator
      setExpression((prev) => prev.slice(0, -1) + op);
      setActiveOp(op);
      return;
    }

    setExpression((prev) => prev + op);
    setCurrentValue('');
    setActiveOp(op);
  }, [error, isCalculated, result, expression, triggerKeyFlash]);

  // Handle Percentage (%)
  const handlePercentage = useCallback(() => {
    soundEffects.playClick('action');
    triggerKeyFlash('%');

    if (error || !expression) return;

    const lastChar = expression.slice(-1);
    if (isOperator(lastChar)) return;

    setExpression((prev) => prev + '%');
    setCurrentValue((prev) => (prev ? String(parseFloat(prev) / 100) : ''));
    setActiveOp(null);
  }, [error, expression, triggerKeyFlash]);

  // Handle Plus/Minus Toggle (±)
  const handleToggleSign = useCallback(() => {
    soundEffects.playClick('action');
    triggerKeyFlash('±');

    if (error) return;

    if (isCalculated && result !== null) {
      const negated = cleanFloat(-result);
      setResult(negated);
      setExpression(String(negated));
      setCurrentValue(String(negated));
      return;
    }

    if (!currentValue || currentValue === '0') return;

    const val = parseFloat(currentValue);
    const negated = String(cleanFloat(-val));
    setCurrentValue(negated);

    // Replace the last number in expression
    setExpression((prev) => {
      const regex = new RegExp(`${currentValue.replace('.', '\\.')}$`);
      return prev.replace(regex, negated);
    });
  }, [error, isCalculated, result, currentValue, triggerKeyFlash]);

  // Handle Equals (=)
  const handleEquals = useCallback(() => {
    soundEffects.playClick('equals');
    triggerKeyFlash('=');

    if (!expression || error) return;

    try {
      const calcResult = calculateExpression(expression);

      if (calcResult === 'Cannot divide by zero') {
        setError('Cannot divide by zero');
        setResult(null);
        setCurrentValue('');
        setLivePreview(null);
        setIsCalculated(true);
        setActiveOp(null);
        return;
      }

      if (typeof calcResult === 'number' && !isNaN(calcResult)) {
        setResult(calcResult);
        setCurrentValue('');
        setLivePreview(null);
        setIsCalculated(true);
        setActiveOp(null);

        // Add to history
        const historyItem = {
          id: Date.now() + Math.random(),
          expression,
          result: calcResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setHistory((prev) => [historyItem, ...prev.slice(0, 24)]);
      }
    } catch {
      setError('Error');
    }
  }, [expression, error, triggerKeyFlash]);

  // Handle Clear (AC)
  const handleClear = useCallback(() => {
    soundEffects.playClick('clear');
    triggerKeyFlash('Escape');
    setExpression('');
    setCurrentValue('');
    setResult(null);
    setLivePreview(null);
    setError(null);
    setActiveOp(null);
    setIsCalculated(false);
  }, [triggerKeyFlash]);

  // Handle Backspace / Delete (DEL)
  const handleBackspace = useCallback(() => {
    soundEffects.playClick('action');
    triggerKeyFlash('Backspace');

    if (error) {
      handleClear();
      return;
    }

    if (isCalculated) {
      handleClear();
      return;
    }

    if (!expression) return;

    const newExpr = expression.slice(0, -1);
    setExpression(newExpr);

    if (currentValue) {
      setCurrentValue((prev) => prev.slice(0, -1));
    } else {
      // Reconstruct currentValue from the end of the new expression
      const match = newExpr.match(/(\d+\.?\d*)$/);
      setCurrentValue(match ? match[1] : '');
    }

    setActiveOp(null);
  }, [error, isCalculated, expression, currentValue, handleClear, triggerKeyFlash]);

  // Global Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling for Space/Slash
      if (e.key === '/' || e.key === ' ') {
        e.preventDefault();
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        handleDigit(key);
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        handleOperator(key);
      } else if (key === 'x' || key === 'X') {
        handleOperator('*');
      } else if (key === '.' || key === ',') {
        handleDecimal();
      } else if (key === '%') {
        handlePercentage();
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleDigit,
    handleOperator,
    handleDecimal,
    handlePercentage,
    handleEquals,
    handleBackspace,
    handleClear
  ]);

  // Toggle Sound
  const toggleSound = () => {
    const nextState = soundEffects.toggle();
    setSoundOn(nextState);
  };

  // Restore calculation from history
  const restoreHistoryItem = (item) => {
    soundEffects.playClick('action');
    setExpression(String(item.result));
    setResult(item.result);
    setCurrentValue(String(item.result));
    setIsCalculated(true);
    setError(null);
    setShowHistory(false);
  };

  // Clear all history
  const clearHistory = () => {
    soundEffects.playClick('clear');
    setHistory([]);
  };

  // Button layout configuration
  const buttonLayout = useMemo(() => [
    { label: expression || currentValue || result !== null ? 'C' : 'AC', value: 'clear', type: 'action', action: handleClear, ariaLabel: 'Clear All' },
    { label: '⌫', value: 'Backspace', type: 'action', action: handleBackspace, ariaLabel: 'Backspace' },
    { label: '%', value: '%', type: 'action', action: handlePercentage, ariaLabel: 'Percent' },
    { label: '÷', value: '/', type: 'operator', action: () => handleOperator('/'), ariaLabel: 'Divide' },

    { label: '7', value: '7', type: 'number', action: () => handleDigit('7') },
    { label: '8', value: '8', type: 'number', action: () => handleDigit('8') },
    { label: '9', value: '9', type: 'number', action: () => handleDigit('9') },
    { label: '×', value: '*', type: 'operator', action: () => handleOperator('*'), ariaLabel: 'Multiply' },

    { label: '4', value: '4', type: 'number', action: () => handleDigit('4') },
    { label: '5', value: '5', type: 'number', action: () => handleDigit('5') },
    { label: '6', value: '6', type: 'number', action: () => handleDigit('6') },
    { label: '−', value: '-', type: 'operator', action: () => handleOperator('-'), ariaLabel: 'Subtract' },

    { label: '1', value: '1', type: 'number', action: () => handleDigit('1') },
    { label: '2', value: '2', type: 'number', action: () => handleDigit('2') },
    { label: '3', value: '3', type: 'number', action: () => handleDigit('3') },
    { label: '+', value: '+', type: 'operator', action: () => handleOperator('+'), ariaLabel: 'Add' },

    { label: '±', value: '±', type: 'action', action: handleToggleSign, ariaLabel: 'Negate number' },
    { label: '0', value: '0', type: 'number', action: () => handleDigit('0') },
    { label: '.', value: '.', type: 'number', action: handleDecimal, ariaLabel: 'Decimal point' },
    { label: '=', value: '=', type: 'equals', action: handleEquals, ariaLabel: 'Equals' },
  ], [
    expression,
    currentValue,
    result,
    handleClear,
    handleBackspace,
    handlePercentage,
    handleOperator,
    handleDigit,
    handleToggleSign,
    handleDecimal,
    handleEquals
  ]);

  return (
    <div className="calculator-wrapper">
      {/* Glassmorphic Calculator Chassis */}
      <div className="calculator-chassis">
        {/* macOS Style Window Controls & Header Bar */}
        <div className="calculator-header">
          <div className="window-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>

          <div className="header-actions">
            {/* Audio Toggle */}
            <button
              type="button"
              className={`header-btn ${soundOn ? 'active' : ''}`}
              onClick={toggleSound}
              title={soundOn ? 'Mute click sounds' : 'Enable click sounds'}
              aria-label="Toggle sound"
            >
              {soundOn ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            {/* History Toggle */}
            <button
              type="button"
              className={`header-btn ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="Calculation History"
              aria-label="Toggle history"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
            </button>
          </div>
        </div>

        {/* Dynamic Display Component */}
        <Display
          expression={expression}
          currentValue={currentValue}
          result={result}
          livePreview={livePreview}
          error={error}
        />

        {/* Buttons Grid */}
        <div className="calculator-grid">
          {buttonLayout.map((btn) => (
            <CalculatorButton
              key={btn.value + btn.label}
              label={btn.label}
              value={btn.value}
              type={btn.type}
              isActive={
                (btn.type === 'operator' && activeOp === btn.value) ||
                activeKey === btn.value ||
                (btn.value === 'Escape' && activeKey === 'Escape') ||
                (btn.value === 'clear' && activeKey === 'Escape')
              }
              onClick={btn.action}
              ariaLabel={btn.ariaLabel}
            />
          ))}
        </div>

        {/* History Flyout Drawer */}
        {showHistory && (
          <div className="history-panel">
            <div className="history-header">
              <h3>History</h3>
              {history.length > 0 && (
                <button type="button" className="clear-history-btn" onClick={clearHistory}>
                  Clear
                </button>
              )}
            </div>

            <div className="history-list">
              {history.length === 0 ? (
                <div className="history-empty">No calculations yet</div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => restoreHistoryItem(item)}
                    role="button"
                    tabIndex={0}
                    title="Click to reuse result"
                  >
                    <div className="history-item-top">
                      <span className="history-item-expr">{item.expression} =</span>
                      <span className="history-item-time">{item.timestamp}</span>
                    </div>
                    <div className="history-item-res">{item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;

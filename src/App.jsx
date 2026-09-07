import React from 'react';
import Calculator from './components/Calculator';
import './App.css';

/**
 * App Component
 * Host container with ambient glassmorphism scene, floating neon gradient orbs,
 * and keyboard shortcut hints.
 */
function App() {
  return (
    <div className="app-container">
      {/* Dynamic Animated Ambient Orbs Background */}
      <div className="ambient-scene" aria-hidden="true">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div className="ambient-orb orb-4" />
        <div className="bg-grid-pattern" />
      </div>

      {/* Modern Portfolio Header */}
      <header className="app-header">
        <div className="brand-badge">
          <span className="brand-dot" />
          <span>React + Vite • Glassmorphism</span>
        </div>
        <h1 className="app-title">Calculator</h1>
      </header>

      {/* Main Calculator Component */}
      <main>
        <Calculator />
      </main>

      {/* Keyboard Shortcut Hints for Desktop Users */}
      <footer className="keyboard-hints" aria-label="Keyboard Shortcuts">
        <span className="hint-pill">
          <kbd>0-9</kbd> Digits
        </span>
        <span className="hint-pill">
          <kbd>+ - * /</kbd> Ops
        </span>
        <span className="hint-pill">
          <kbd>Enter</kbd> / <kbd>=</kbd> Equals
        </span>
        <span className="hint-pill">
          <kbd>⌫</kbd> Del
        </span>
        <span className="hint-pill">
          <kbd>Esc</kbd> Clear
        </span>
      </footer>
    </div>
  );
}

export default App;

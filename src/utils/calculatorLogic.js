/**
 * Pure JavaScript Calculator Logic Engine
 * Implements tokenization, operator precedence (PEMDAS), percentage resolution,
 * float precision correction, and division by zero protection.
 * No external libraries used.
 */

// Operator definition and precedence
export const OPERATORS = {
  '+': { precedence: 1, symbol: '+', display: '+' },
  '-': { precedence: 1, symbol: '-', display: '−' },
  '*': { precedence: 2, symbol: '*', display: '×' },
  '/': { precedence: 2, symbol: '/', display: '÷' }
};

export const isOperator = (char) => Object.prototype.hasOwnProperty.call(OPERATORS, char);

/**
 * Corrects JavaScript floating point inaccuracies (e.g. 0.1 + 0.2 -> 0.3)
 */
export const cleanFloat = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return num;
  if (!isFinite(num)) return num;
  
  // Format with high precision and strip trailing floating rounding artifacts
  const rounded = parseFloat(num.toPrecision(12));
  return rounded;
};

/**
 * Formats a number with thousands separators for display while preserving decimals.
 * Examples:
 *   "1234.56" -> "1,234.56"
 *   "-987654321" -> "-987,654,321"
 *   "12." -> "12."
 */
export const formatDisplayNumber = (numStr) => {
  if (!numStr && numStr !== 0) return '0';
  const str = String(numStr);

  // If error message or scientific notation, return as is
  if (str === 'Cannot divide by zero' || str.includes('e') || str.includes('E')) {
    return str;
  }

  const isNegative = str.startsWith('-');
  const unsignedStr = isNegative ? str.slice(1) : str;

  const parts = unsignedStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  // Add commas to integer portion
  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (isNegative ? '-' : '') + formattedInt + decimalPart;
};

/**
 * Tokenizes a math expression string into numbers and operators.
 * Handles negative numbers like "-5" or "5 * -3".
 */
export const tokenize = (expr) => {
  const tokens = [];
  let currentNum = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    // Check if '-' is a negative sign for a number or a subtraction operator
    if (char === '-') {
      const prevToken = tokens[tokens.length - 1];
      const isStart = tokens.length === 0 && currentNum === '';
      const isAfterOperator = currentNum === '' && prevToken && isOperator(prevToken);

      if (isStart || isAfterOperator) {
        currentNum += '-';
        continue;
      }
    }

    if (isOperator(char)) {
      if (currentNum !== '') {
        tokens.push(currentNum);
        currentNum = '';
      }
      tokens.push(char);
    } else if (char === '%') {
      if (currentNum !== '') {
        tokens.push(currentNum);
        currentNum = '';
      }
      tokens.push('%');
    } else if (!/\s/.test(char)) {
      // Digit or decimal point
      currentNum += char;
    }
  }

  if (currentNum !== '') {
    tokens.push(currentNum);
  }

  return tokens;
};

/**
 * Resolves percentages in token array.
 * Context-aware:
 * - In "a + b%", b% is evaluated as (a * b / 100)
 * - In "a - b%", b% is evaluated as (a * b / 100)
 * - In "a * b%", b% is evaluated as (b / 100)
 * - In "a / b%", b% is evaluated as (b / 100)
 * - In standalone "b%", is (b / 100)
 */
export const resolvePercentages = (tokens) => {
  const resolved = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '%') {
      const prevNumStr = resolved.pop();
      const prevNum = parseFloat(prevNumStr);
      if (isNaN(prevNum)) continue;

      const operatorBefore = resolved.length > 0 ? resolved[resolved.length - 1] : null;
      const baseNumStr = resolved.length > 1 ? resolved[resolved.length - 2] : null;
      const baseNum = baseNumStr ? parseFloat(baseNumStr) : null;

      if ((operatorBefore === '+' || operatorBefore === '-') && baseNum !== null && !isNaN(baseNum)) {
        const percentVal = (baseNum * prevNum) / 100;
        resolved.push(String(percentVal));
      } else {
        const percentVal = prevNum / 100;
        resolved.push(String(percentVal));
      }
    } else {
      resolved.push(token);
    }
  }

  return resolved;
};

/**
 * Evaluates a sequence of tokens with standard operator precedence.
 * Returns the numerical result or 'Cannot divide by zero'.
 */
export const evaluateTokens = (rawTokens) => {
  if (!rawTokens || rawTokens.length === 0) return 0;

  // Resolve percentages first
  const tokens = resolvePercentages(rawTokens);

  // If the last token is an operator, ignore it for evaluation (or live preview)
  while (tokens.length > 0 && isOperator(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  if (tokens.length === 0) return 0;
  if (tokens.length === 1) {
    const single = parseFloat(tokens[0]);
    return isNaN(single) ? 0 : cleanFloat(single);
  }

  // Pass 1: Handle * and /
  const pass1 = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '*' || token === '/') {
      const prev = parseFloat(pass1.pop());
      const nextStr = tokens[i + 1];
      if (nextStr === undefined) {
        pass1.push(prev);
        break;
      }
      const next = parseFloat(nextStr);

      if (token === '/') {
        if (next === 0) {
          return 'Cannot divide by zero';
        }
        pass1.push(prev / next);
      } else {
        pass1.push(prev * next);
      }
      i += 2;
    } else {
      pass1.push(token);
      i++;
    }
  }

  // Pass 2: Handle + and -
  let result = parseFloat(pass1[0]);
  if (isNaN(result)) return 0;

  for (let j = 1; j < pass1.length; j += 2) {
    const op = pass1[j];
    const nextVal = parseFloat(pass1[j + 1]);
    if (isNaN(nextVal)) break;

    if (op === '+') {
      result += nextVal;
    } else if (op === '-') {
      result -= nextVal;
    }
  }

  return cleanFloat(result);
};

/**
 * Evaluates a full expression string safely.
 */
export const calculateExpression = (expressionStr) => {
  if (!expressionStr || expressionStr.trim() === '') return 0;
  const tokens = tokenize(expressionStr);
  return evaluateTokens(tokens);
};

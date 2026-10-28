import { useState } from 'react';
import { Delete } from 'lucide-react';
import './CalculatorApp.css';

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = (d: string) => {
    if (fresh) {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    setDisplay(display.length > 14 ? display : display + d);
  };

  const compute = (a: number, b: number, o: string): number => {
    switch (o) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const chooseOp = (next: string) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = compute(prev, cur, op);
      setHistory((h) => [`${prev} ${op} ${cur} = ${result}`, ...h].slice(0, 30));
      setPrev(result);
      setDisplay(String(Number(result.toFixed(10))));
    } else {
      setPrev(cur);
    }
    setOp(next);
    setFresh(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const result = compute(prev, cur, op);
    setHistory((h) => [`${prev} ${op} ${cur} = ${result}`, ...h].slice(0, 30));
    setDisplay(Number.isNaN(result) ? 'Error' : String(Number(result.toFixed(10))));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const pct = () => setDisplay(String(parseFloat(display) / 100));
  const negate = () => setDisplay(String(-parseFloat(display)));
  const backspace = () =>
    setDisplay((d) => (d.length <= 1 || (d.length === 2 && d.startsWith('-')) ? '0' : d.slice(0, -1)));

  const keys: { label: string; fn: () => void; kind?: string }[] = [
    { label: 'AC', fn: clear, kind: 'fn' },
    { label: '+/−', fn: negate, kind: 'fn' },
    { label: '%', fn: pct, kind: 'fn' },
    { label: '÷', fn: () => chooseOp('÷'), kind: 'op' },
    { label: '7', fn: () => inputDigit('7') },
    { label: '8', fn: () => inputDigit('8') },
    { label: '9', fn: () => inputDigit('9') },
    { label: '×', fn: () => chooseOp('×'), kind: 'op' },
    { label: '4', fn: () => inputDigit('4') },
    { label: '5', fn: () => inputDigit('5') },
    { label: '6', fn: () => inputDigit('6') },
    { label: '−', fn: () => chooseOp('−'), kind: 'op' },
    { label: '1', fn: () => inputDigit('1') },
    { label: '2', fn: () => inputDigit('2') },
    { label: '3', fn: () => inputDigit('3') },
    { label: '+', fn: () => chooseOp('+'), kind: 'op' },
    { label: '0', fn: () => inputDigit('0') },
    { label: '.', fn: () => inputDigit('.') },
    { label: '=', fn: equals, kind: 'accent' },
  ];

  return (
    <div className="calc-app">
      <header className="calc-header">
        <h1>Calculator</h1>
      </header>
      <div className="calc-history app-scroll">
        {history.slice(0, 3).map((h, i) => (
          <p key={i}>{h}</p>
        ))}
      </div>
      <div className="calc-display">
        <small>{prev !== null && op ? `${prev} ${op}` : ''}</small>
        <strong>{display}</strong>
        <button className="calc-back" onClick={backspace} aria-label="Backspace">
          <Delete size={20} />
        </button>
      </div>
      <div className="calc-grid">
        {keys.map((k) => (
          <button
            key={k.label}
            className={`calc-key ${k.kind ?? ''} ${op === k.label && fresh ? 'active-op' : ''}`}
            onClick={k.fn}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

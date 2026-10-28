import { useMemo } from 'react';
import './DotClock.css';

// Authentic Nothing-style 3×5 dot-matrix digit patterns
const DIGITS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};

interface Props {
  value: string; // e.g. "07:51"
  size?: number; // total height in px
  activeColor?: string;
  dimOpacity?: number;
}

/** LED dot-matrix clock like the real Nothing lock screen. */
export default function DotClock({ value, size = 92, activeColor = '#f5f5f7', dimOpacity = 0.1 }: Props) {
  const chars = useMemo(() => value.split(''), [value]);
  // 5 dot rows + 4 gaps (0.55·dot) fill the requested height exactly
  const dot = size / 7.2;
  const gap = dot * 0.55;

  return (
    <div className="dot-clock" style={{ height: size, gap: gap * 1.4 }} aria-label={value}>
      {chars.map((ch, i) =>
        ch === ':' ? (
          <div key={i} className="dot-colon" style={{ gap: dot * 1.4 }}>
            <span style={{ width: dot, height: dot, background: activeColor }} />
            <span style={{ width: dot, height: dot, background: activeColor }} />
          </div>
        ) : (
          <div
            key={i}
            className="dot-digit"
            style={{ gridTemplateColumns: `repeat(3, ${dot}px)`, gap }}
          >
            {DIGITS[ch]?.flatMap((row, r) =>
              row.split('').map((on, c) => (
                <span
                  key={`${r}-${c}`}
                  className="dot-cell"
                  style={{
                    width: dot,
                    height: dot,
                    background: activeColor,
                    opacity: on === '1' ? 1 : dimOpacity,
                  }}
                />
              )),
            )}
          </div>
        ),
      )}
    </div>
  );
}

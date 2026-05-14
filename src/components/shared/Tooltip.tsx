import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  shortcut?: string;
}

export function Tooltip({ text, children, side = 'top', delay = 400, shortcut }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords]   = useState({ x: 0, y: 0 });
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      const el = wrapperRef.current?.firstElementChild as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const GAP = 8;
      let x = 0, y = 0;
      if (side === 'top')    { x = r.left + r.width / 2;  y = r.top - GAP; }
      if (side === 'bottom') { x = r.left + r.width / 2;  y = r.bottom + GAP; }
      if (side === 'left')   { x = r.left - GAP;          y = r.top + r.height / 2; }
      if (side === 'right')  { x = r.right + GAP;         y = r.top + r.height / 2; }
      setCoords({ x, y });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const transform = {
    top:    'translateX(-50%) translateY(-100%)',
    bottom: 'translateX(-50%)',
    left:   'translateX(-100%) translateY(-50%)',
    right:  'translateY(-50%)',
  }[side];

  return (
    <>
      <span
        ref={wrapperRef}
        style={{ display: 'contents' }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>

      {visible && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            transform,
            zIndex: 9999,
            pointerEvents: 'none',
            background: 'rgba(10,10,24,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            color: '#e2e4ea',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
          {shortcut && (
            <kbd style={{
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'monospace',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#a5b4fc',
            }}>
              {shortcut}
            </kbd>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

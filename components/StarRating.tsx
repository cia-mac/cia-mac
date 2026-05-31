'use client';

import { useState } from 'react';

export default function StarRating({ name = 'rating' }: { name?: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            type="button"
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(n === value ? 0 : n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={value === n}
            className={'text-2xl transition ' + (active ? 'text-tomato' : 'text-ink/20')}
          >
            ★
          </button>
        );
      })}
      {value > 0 && (
        <button type="button" onClick={() => setValue(0)} className="ml-2 text-xs text-ink/40 hover:underline">
          clear
        </button>
      )}
    </div>
  );
}

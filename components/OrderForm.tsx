'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';
import { placeOrderAction } from '@/app/actions/orders';
import type { OptionGroup } from '@/lib/queries';

export default function OrderForm({
  dropId,
  groups,
}: {
  dropId: number;
  groups: OptionGroup[];
}) {
  // group id -> set of selected option ids
  const [selected, setSelected] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {};
    for (const g of groups) {
      // Pre-select the first option of a required single-select group.
      if (g.required && !g.multi && g.options[0]) init[g.id] = [g.options[0].id];
      else init[g.id] = [];
    }
    return init;
  });
  const [quantity, setQuantity] = useState(1);

  function toggle(group: OptionGroup, optionId: number) {
    setSelected((prev) => {
      const current = prev[group.id] || [];
      if (group.multi) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [group.id]: next };
      }
      // single-select: required groups can't be unset, optional ones can toggle off
      if (current.includes(optionId) && !group.required) {
        return { ...prev, [group.id]: [] };
      }
      return { ...prev, [group.id]: [optionId] };
    });
  }

  const allSelectedIds = Object.values(selected).flat();

  return (
    <form action={placeOrderAction} className="space-y-6">
      <input type="hidden" name="drop_id" value={dropId} />
      {allSelectedIds.map((id) => (
        <input key={id} type="hidden" name="option" value={id} />
      ))}

      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend className="mb-2 flex items-center gap-2 font-semibold">
            {group.name}
            {group.required ? (
              <span className="text-xs font-normal text-tomato">required</span>
            ) : (
              <span className="text-xs font-normal text-ink/40">
                optional{group.multi ? ' · pick any' : ''}
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {group.options.map((opt) => {
              const isOn = (selected[group.id] || []).includes(opt.id);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggle(group, opt.id)}
                  aria-pressed={isOn}
                  className={
                    'rounded-full border px-4 py-2 text-sm font-medium transition ' +
                    (isOn
                      ? 'border-tomato bg-tomato text-white'
                      : 'border-ink/15 bg-white text-ink hover:border-ink/30')
                  }
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div>
        <label className="label" htmlFor="special_requests">
          Special requests <span className="font-normal text-ink/40">— e.g. “no onion”, “no mayo”</span>
        </label>
        <textarea
          id="special_requests"
          name="special_requests"
          rows={2}
          className="input resize-none"
          placeholder="Anything I should leave out or go easy on?"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="label mb-0">How many?</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-full border border-ink/15 text-lg leading-none hover:bg-ink/5"
            aria-label="Decrease"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            className="h-9 w-9 rounded-full border border-ink/15 text-lg leading-none hover:bg-ink/5"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </div>
      <input type="hidden" name="quantity" value={quantity} />

      <SubmitButton pendingText="Placing order…">
        Place order{quantity > 1 ? ` (${quantity})` : ''}
      </SubmitButton>
    </form>
  );
}

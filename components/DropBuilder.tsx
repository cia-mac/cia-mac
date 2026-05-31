'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';
import { createDropAction } from '@/app/actions/drops';

type Group = {
  name: string;
  required: boolean;
  multi: boolean;
  options: string[];
};

const STARTER: Group[] = [
  { name: 'Protein', required: true, multi: false, options: ['Chicken', 'Shrimp', 'Mix'] },
];

export default function DropBuilder() {
  const [groups, setGroups] = useState<Group[]>(STARTER);

  function updateGroup(i: number, patch: Partial<Group>) {
    setGroups((g) => g.map((grp, idx) => (idx === i ? { ...grp, ...patch } : grp)));
  }
  function removeGroup(i: number) {
    setGroups((g) => g.filter((_, idx) => idx !== i));
  }
  function addGroup() {
    setGroups((g) => [...g, { name: '', required: true, multi: false, options: [''] }]);
  }
  function updateOption(gi: number, oi: number, value: string) {
    setGroups((g) =>
      g.map((grp, idx) =>
        idx === gi ? { ...grp, options: grp.options.map((o, j) => (j === oi ? value : o)) } : grp
      )
    );
  }
  function addOption(gi: number) {
    setGroups((g) => g.map((grp, idx) => (idx === gi ? { ...grp, options: [...grp.options, ''] } : grp)));
  }
  function removeOption(gi: number, oi: number) {
    setGroups((g) =>
      g.map((grp, idx) => (idx === gi ? { ...grp, options: grp.options.filter((_, j) => j !== oi) } : grp))
    );
  }

  return (
    <form action={createDropAction} className="space-y-6">
      <input type="hidden" name="groups" value={JSON.stringify(groups)} />

      <div>
        <label className="label" htmlFor="title">What are you making?</label>
        <input id="title" name="title" className="input" placeholder="Chicken Pesto Sandwiches" required />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2} className="input resize-none"
          placeholder="Toasted ciabatta, basil pesto, mozzarella, roasted chicken." />
      </div>

      <div>
        <label className="label" htmlFor="image">Photo</label>
        <input id="image" name="image" type="file" accept="image/*"
          className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink/90" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="delivery_date">Delivery date</label>
          <input id="delivery_date" name="delivery_date" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="window_start">Window from</label>
          <input id="window_start" name="window_start" className="input" placeholder="12:30 PM" />
        </div>
        <div>
          <label className="label" htmlFor="window_end">Window to</label>
          <input id="window_end" name="window_end" className="input" placeholder="1:30 PM" />
        </div>
      </div>

      {/* Option groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold tracking-tight">Options</h3>
          <button type="button" onClick={addGroup} className="btn-ghost px-3 py-1.5 text-xs">
            + Add option group
          </button>
        </div>
        <p className="-mt-2 text-xs text-ink/50">
          A group is a choice the crew makes — e.g. <em>Protein</em> (Chicken / Shrimp / Mix) or{' '}
          <em>Egg</em> (With egg / No egg). Turn on “pick any” for add-ons like hold-the-onion.
        </p>

        {groups.map((group, gi) => (
          <div key={gi} className="rounded-2xl border border-ink/10 bg-cream p-4">
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Group name (e.g. Protein, Egg)"
                value={group.name}
                onChange={(e) => updateGroup(gi, { name: e.target.value })}
              />
              <button type="button" onClick={() => removeGroup(gi)}
                className="text-sm text-tomato hover:underline" aria-label="Remove group">
                Remove
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={group.required}
                  onChange={(e) => updateGroup(gi, { required: e.target.checked })} />
                Required
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={group.multi}
                  onChange={(e) => updateGroup(gi, { multi: e.target.checked })} />
                Pick any (multiple)
              </label>
            </div>

            <div className="mt-3 space-y-2">
              {group.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    className="input"
                    placeholder={`Choice ${oi + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(gi, oi, e.target.value)}
                  />
                  <button type="button" onClick={() => removeOption(gi, oi)}
                    className="text-ink/40 hover:text-tomato" aria-label="Remove choice">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addOption(gi)}
                className="text-xs font-medium text-olive hover:underline">+ Add choice</button>
            </div>
          </div>
        ))}
      </div>

      <SubmitButton className="btn-primary w-full" pendingText="Posting drop…">Post drop</SubmitButton>
    </form>
  );
}

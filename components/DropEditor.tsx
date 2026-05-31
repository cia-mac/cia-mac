'use client';

import SubmitButton from './SubmitButton';
import { updateDropAction } from '@/app/actions/drops';
import type { Drop } from '@/lib/queries';

export default function DropEditor({ drop }: { drop: Drop }) {
  return (
    <form action={updateDropAction} className="space-y-5">
      <input type="hidden" name="drop_id" value={drop.id} />

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" defaultValue={drop.title} required />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2} className="input resize-none"
          defaultValue={drop.description} />
      </div>

      <div>
        <span className="label">Photo</span>
        {drop.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={drop.image_url} alt="" className="mb-2 h-40 w-full rounded-xl object-cover" />
        ) : (
          <div className="mb-2 flex h-32 w-full items-center justify-center rounded-xl bg-olive/10 text-3xl">🍱</div>
        )}
        <input id="image" name="image" type="file" accept="image/*"
          className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink/90" />
        <p className="mt-1 text-xs text-ink/50">
          Pick a new file to swap the photo (e.g. the finished plate). Leave empty to keep the current one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="delivery_date">Delivery date</label>
          <input id="delivery_date" name="delivery_date" type="date" className="input"
            defaultValue={drop.delivery_date ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="window_start">Window from</label>
          <input id="window_start" name="window_start" className="input"
            defaultValue={drop.window_start ?? ''} placeholder="12:30 PM" />
        </div>
        <div>
          <label className="label" htmlFor="window_end">Window to</label>
          <input id="window_end" name="window_end" className="input"
            defaultValue={drop.window_end ?? ''} placeholder="1:30 PM" />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}

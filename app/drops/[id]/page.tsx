import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import OrderForm from '@/components/OrderForm';
import { getCurrentUser } from '@/lib/auth';
import { getDrop, getDropOptionGroups, getMyOrders } from '@/lib/queries';
import { cancelOrderAction } from '@/app/actions/orders';

export const dynamic = 'force-dynamic';

export default async function DropPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ordered?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.status !== 'approved') redirect('/pending');

  const { id } = await params;
  const sp = await searchParams;
  const dropId = Number(id);
  if (!Number.isFinite(dropId)) notFound();

  const drop = await getDrop(dropId);
  if (!drop) notFound();

  const groups = await getDropOptionGroups(dropId);
  const myOrders = await getMyOrders(dropId, user.id);

  const dateLabel = drop.delivery_date
    ? new Date(drop.delivery_date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const windowLabel = [drop.window_start, drop.window_end].filter(Boolean).join(' – ');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-ink/50 hover:text-ink">← Back to menu</Link>

        <div className="card mt-3 overflow-hidden">
          {drop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={drop.image_url} alt={drop.title} className="h-64 w-full object-cover" />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-olive/10 text-6xl">🍱</div>
          )}
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{drop.title}</h1>
              <span className={'chip ' + (drop.status === 'open' ? '' : 'bg-ink/10 text-ink/50')}>
                {drop.status === 'open' ? 'Taking orders' : 'Closed'}
              </span>
            </div>
            {drop.description && <p className="mt-2 text-ink/70">{drop.description}</p>}
            {(dateLabel || windowLabel) && (
              <p className="mt-3 text-sm font-medium text-ink/60">
                🚲 Delivery {dateLabel}
                {dateLabel && windowLabel ? ', ' : ''}
                {windowLabel}
              </p>
            )}
          </div>
        </div>

        {sp.ordered && (
          <div className="card mt-4 border-olive/30 bg-olive/5 p-4 text-sm text-olive">
            ✅ Order placed! I’ve got you down. You can add another or tweak below.
          </div>
        )}

        {myOrders.length > 0 && (
          <div className="card mt-4 p-5">
            <h2 className="font-bold">Your orders for this drop</h2>
            <ul className="mt-3 space-y-2">
              {myOrders.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-3 rounded-xl bg-cream px-3 py-2">
                  <div className="text-sm">
                    <span className="font-semibold">×{o.quantity}</span>{' '}
                    {o.options.length > 0 ? o.options.join(', ') : 'plain'}
                    {o.special_requests && (
                      <span className="block text-ink/50">“{o.special_requests}”</span>
                    )}
                  </div>
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="order_id" value={o.id} />
                    <input type="hidden" name="drop_id" value={drop.id} />
                    <button className="text-xs font-medium text-tomato hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card mt-4 p-5 sm:p-6">
          {drop.status === 'open' ? (
            <>
              <h2 className="mb-4 text-lg font-bold tracking-tight">
                {myOrders.length > 0 ? 'Order more' : 'Place your order'}
              </h2>
              <OrderForm dropId={drop.id} groups={groups} />
            </>
          ) : (
            <p className="text-center text-ink/60">Ordering for this drop is closed. 🙏</p>
          )}
        </div>
      </main>
    </>
  );
}

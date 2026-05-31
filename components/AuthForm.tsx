'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import SubmitButton from './SubmitButton';
import { loginAction, signupAction, createFirstAdminAction, type ActionState } from '@/app/actions/auth';

type Mode = 'login' | 'signup' | 'welcome';

export default function AuthForm({ mode }: { mode: Mode }) {
  const action =
    mode === 'login' ? loginAction : mode === 'signup' ? signupAction : createFirstAdminAction;
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  const showName = mode === 'signup' || mode === 'welcome';
  const cta =
    mode === 'login' ? 'Log in' : mode === 'welcome' ? 'Create my kitchen' : 'Request access';

  return (
    <form action={formAction} className="space-y-4">
      {showName && (
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" className="input" placeholder="Your name" autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="you@email.com" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-tomato/10 px-3 py-2 text-sm text-tomato">{state.error}</p>
      )}

      <SubmitButton pendingText={mode === 'login' ? 'Logging in…' : 'Setting up…'}>{cta}</SubmitButton>

      {mode === 'login' && (
        <p className="text-center text-sm text-ink/60">
          Need an account? <Link href="/signup" className="font-semibold text-tomato">Request access</Link>
        </p>
      )}
      {mode === 'signup' && (
        <p className="text-center text-sm text-ink/60">
          Already have access? <Link href="/login" className="font-semibold text-tomato">Log in</Link>
        </p>
      )}
    </form>
  );
}

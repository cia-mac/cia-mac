'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import SubmitButton from './SubmitButton';
import { loginAction, signupAction, type ActionState } from '@/app/actions/auth';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const action = mode === 'login' ? loginAction : signupAction;
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {mode === 'signup' && (
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
          placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-tomato/10 px-3 py-2 text-sm text-tomato">{state.error}</p>
      )}

      <SubmitButton pendingText={mode === 'signup' ? 'Sending request…' : 'Logging in…'}>
        {mode === 'signup' ? 'Request access' : 'Log in'}
      </SubmitButton>

      <p className="text-center text-sm text-ink/60">
        {mode === 'login' ? (
          <>Need an account? <Link href="/signup" className="font-semibold text-tomato">Request access</Link></>
        ) : (
          <>Already have access? <Link href="/login" className="font-semibold text-tomato">Log in</Link></>
        )}
      </p>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('input'); // input | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase('sending');
    setErrorMsg('');

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setPhase('error');
      } else {
        setPhase('sent');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
      setPhase('error');
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-black mb-1" style={{ color: '#2D4B8E' }}>TradeNWA</div>
          <div className="text-sm text-amber-500 font-medium">Swap Happens</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {(phase === 'input' || phase === 'error') && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Sign in</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a magic link to sign in instantly.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#2D4B8E' }}
                  />
                </div>
                {phase === 'error' && errorMsg && (
                  <p className="text-sm text-red-500">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  className="w-full text-white py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: '#2D4B8E' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#243D75'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#2D4B8E'}
                >
                  Send magic link
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-4">
                No password needed. No spam. Just a link.
              </p>
            </>
          )}

          {phase === 'sending' && (
            <div className="text-center py-4">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#2D4B8E', borderTopColor: 'transparent' }} />
              <div className="font-semibold text-gray-700">Sending your magic link...</div>
            </div>
          )}

          {phase === 'sent' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✉️</div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-3">
                We sent a link to <strong>{email}</strong>.<br />
                Click it to sign in automatically.
              </p>
              <p className="text-xs text-gray-400">
                Didn't get it? Check your spam folder or{' '}
                <button
                  onClick={() => setPhase('input')}
                  className="underline" style={{ color: '#2D4B8E' }}
                >
                  try again
                </button>.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#2D4B8E'} onMouseLeave={e => e.currentTarget.style.color=''}>
            ← Continue browsing without signing in
          </Link>
        </div>
      </div>
    </div>
  );
}

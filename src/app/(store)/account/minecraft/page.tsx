'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function MinecraftPage() {
  const [minecraftUsername, setMinecraftUsername] = useState('TrainerAlex');
  const [minecraftUUID, setMinecraftUUID] = useState(
    'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p'
  );
  const [isLinked, setIsLinked] = useState(true);
  const [inputUsername, setInputUsername] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState('');

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setIsLinking(true);
    setMessage('');

    try {
      const response = await fetch('/api/account/minecraft/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUsername }),
      });

      if (response.ok) {
        const data = await response.json();
        setMinecraftUsername(data.username);
        setMinecraftUUID(data.uuid);
        setIsLinked(true);
        setInputUsername('');
        setMessage('Account linked successfully');
      } else {
        setMessage('Failed to link account');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Minecraft account?')) return;

    try {
      const response = await fetch('/api/account/minecraft/unlink', {
        method: 'POST',
      });

      if (response.ok) {
        setIsLinked(false);
        setMinecraftUsername('');
        setMinecraftUUID('');
        setMessage('Account unlinked');
      }
    } catch (error) {
      setMessage('Failed to unlink account');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-slate-100">Minecraft Account</h1>
          <p className="mt-2 text-slate-400">
            Link your Minecraft account to receive purchases
          </p>
        </div>
      </section>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Message */}
          {message && (
            <div
              className={`rounded-lg border p-4 ${
                message.includes('successfully')
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <p
                className={message.includes('successfully') ? 'text-emerald-300' : 'text-red-300'}
              >
                {message}
              </p>
            </div>
          )}

          {/* Current Status */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Current Status</h2>

            {isLinked ? (
              <div className="space-y-4">
                <div className="rounded bg-emerald-500/10 border border-emerald-500/30 p-4">
                  <Badge className="mb-2 bg-emerald-500 text-slate-950">Linked</Badge>
                  <p className="text-slate-100 font-semibold">{minecraftUsername}</p>
                  <p className="text-xs text-slate-400 mt-1">{minecraftUUID}</p>
                </div>

                <p className="text-sm text-slate-400">
                  Your Minecraft account is linked. All future purchases will be delivered to this
                  account.
                </p>

                <Button
                  onClick={handleUnlink}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Unlink Account
                </Button>
              </div>
            ) : (
              <div>
                <Badge className="bg-slate-600 text-slate-100">Not Linked</Badge>
                <p className="mt-3 text-sm text-slate-400">
                  Link your Minecraft account to enable purchases. All items will be delivered to
                  the linked account.
                </p>
              </div>
            )}
          </Card>

          {/* Link Form */}
          {!isLinked && (
            <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-100">Link Account</h2>

              <form onSubmit={handleLinkAccount} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Minecraft Username
                  </label>
                  <Input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="Your Minecraft username"
                    className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Enter your exact Minecraft username (case-sensitive)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLinking}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold"
                >
                  {isLinking ? 'Linking...' : 'Link Account'}
                </Button>
              </form>
            </Card>
          )}

          {/* Info */}
          <Card className="border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
            <h3 className="font-semibold text-amber-300 flex items-center gap-2">
              <span>ℹ️</span>
              How to find your UUID
            </h3>
            <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
              <li>Go to https://namemc.com/</li>
              <li>Search your Minecraft username</li>
              <li>Your UUID will be displayed</li>
            </ol>
          </Card>
        </div>
      </div>
    </main>
  );
}

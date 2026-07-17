'use client';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { account } from '@/lib/appwrite/client';

export default function AccountPage() {
  const { profile } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false);
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await account.updatePassword(next, current);
      setSuccess(true); setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setError(err.message ?? 'Could not change password. Check your current password.');
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">Account</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Account Settings</h1>

        <div className="mt-6 rounded-lg border-2 bg-white p-5" style={{ borderColor: '#D0D8DA' }}>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Your profile</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{profile?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{profile?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{profile?.role?.replace('_', ' ')}</span></div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border-2 bg-white p-5" style={{ borderColor: '#D0D8DA' }}>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Change password</p>
          {success && (
            <div className="mb-4 rounded-lg p-3 text-sm font-medium" style={{ backgroundColor: '#ECFDF5', color: '#054653', border: '1px solid #054653' }}>
              ✓ Password changed successfully!
            </div>
          )}
          <form onSubmit={changePassword} className="space-y-4">
            {[
              { label: 'Current password', value: current, onChange: setCurrent },
              { label: 'New password', value: next, onChange: setNext },
              { label: 'Confirm new password', value: confirm, onChange: setConfirm },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
                <input type="password" required value={value} onChange={(e) => onChange(e.target.value)}
                  className="w-full rounded-lg border-2 px-3 py-2.5 text-sm" style={{ borderColor: '#D0D8DA' }} />
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={saving || !current || !next || !confirm}
              className="w-full rounded-lg py-3 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}>
              {saving ? 'Changing password…' : 'Change password'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          If you forget your password, contact Dr. Nicholas Mukisa or Derrick Maiku.
        </p>
      </div>
    </AppShell>
  );
}

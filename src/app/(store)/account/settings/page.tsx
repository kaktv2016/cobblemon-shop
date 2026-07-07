'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    displayName: 'Trainer Alex',
    email: 'trainer@example.com',
    avatarUrl: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          avatarUrl: formData.avatarUrl,
        }),
      });

      if (response.ok) {
        setMessage('Profile updated successfully');
      }
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage('Password changed successfully');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      setMessage('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-slate-100">Account Settings</h1>
        </div>
      </section>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Success Message */}
          {message && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="text-sm text-emerald-300">{message}</p>
            </div>
          )}

          {/* Profile Settings */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">Profile Information</h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Display Name</label>
                <Input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="border-indigo-500/20 bg-slate-700 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Avatar URL</label>
                <Input
                  type="url"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.png"
                  className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Current Password
                </label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">New Password</label>
                <Input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="border-indigo-500/20 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold"
              >
                {isSaving ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}

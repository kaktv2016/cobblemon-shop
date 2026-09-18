"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Notice = { type: "success" | "error"; text: string } | null;

export default function SettingsPage() {
  const [profile, setProfile] = useState({ displayName: "", email: "", avatarUrl: "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"profile" | "password" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    fetch("/api/account/profile", { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load profile");
      setProfile({ displayName: body.displayName || "", email: body.email, avatarUrl: body.avatarUrl || "" });
    }).catch((error) => setNotice({ type: "error", text: error.message })).finally(() => setLoading(false));
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault(); setSaving("profile"); setNotice(null);
    try {
      const response = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: profile.displayName, avatarUrl: profile.avatarUrl }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to update profile");
      setProfile((current) => ({ ...current, displayName: body.displayName || "", avatarUrl: body.avatarUrl || "" }));
      setNotice({ type: "success", text: "Profile updated successfully" });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to update profile" }); }
    finally { setSaving(null); }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setNotice(null);
    if (password.newPassword !== password.confirmPassword) { setNotice({ type: "error", text: "Passwords do not match" }); return; }
    setSaving("password");
    try {
      const response = await fetch("/api/account/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to change password");
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" }); setNotice({ type: "success", text: "AuthMe password changed successfully" });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to change password" }); }
    finally { setSaving(null); }
  }

  return <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16"><div className="mx-auto max-w-2xl space-y-8"><div><h1 className="text-4xl font-bold text-slate-100">Account Settings</h1><p className="mt-2 text-slate-400">Profile changes are stored in the shop. Password changes also update your Minecraft AuthMe login.</p></div>
    {notice && <div className={`rounded-lg border p-4 ${notice.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{notice.text}</div>}
    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-300" /></div> : <>
      <Card className="space-y-5 border-indigo-500/20 bg-slate-900/70 p-6"><h2 className="text-2xl font-bold text-slate-100">Profile Information</h2><form onSubmit={saveProfile} className="space-y-4">
        <label className="block text-sm text-slate-300">Display Name<Input className="mt-2 border-slate-700 bg-slate-800" value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label>
        <label className="block text-sm text-slate-300">Email<Input className="mt-2 border-slate-700 bg-slate-800" value={profile.email} disabled /></label>
        <label className="block text-sm text-slate-300">Avatar URL<Input className="mt-2 border-slate-700 bg-slate-800" value={profile.avatarUrl} onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })} placeholder="https://example.com/avatar.png" /></label>
        <Button disabled={saving !== null}>{saving === "profile" ? "Saving…" : "Save Profile"}</Button>
      </form></Card>
      <Card className="space-y-5 border-indigo-500/20 bg-slate-900/70 p-6"><h2 className="text-2xl font-bold text-slate-100">Change AuthMe Password</h2><form onSubmit={changePassword} className="space-y-4">
        {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => <label key={key} className="block text-sm text-slate-300">{{ currentPassword: "Current Password", newPassword: "New Password", confirmPassword: "Confirm New Password" }[key]}<Input type="password" required minLength={key === "currentPassword" ? 1 : 8} className="mt-2 border-slate-700 bg-slate-800" value={password[key]} onChange={(event) => setPassword({ ...password, [key]: event.target.value })} /></label>)}
        <Button disabled={saving !== null}>{saving === "password" ? "Updating…" : "Change Password"}</Button>
      </form></Card>
    </>}
  </div></main>;
}

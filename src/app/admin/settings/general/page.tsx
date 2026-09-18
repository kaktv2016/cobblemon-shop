"use client";

import { useEffect, useState } from "react";
import { Loader2, Server, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type Settings = {
  shopName: string;
  shopDescription: string;
  currency: "THB";
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

const initialSettings: Settings = {
  shopName: "",
  shopDescription: "",
  currency: "THB",
  maintenanceMode: false,
  maintenanceMessage: "",
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [delivery, setDelivery] = useState({ mode: "dry-run", rconConfigured: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/settings/general")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load settings");
        setSettings({
          ...body.settings,
          maintenanceMessage: body.settings.maintenanceMessage || "",
        });
        setDelivery(body.delivery);
      })
      .catch((error) => addToast({ type: "error", message: error.message }))
      .finally(() => setLoading(false));
  }, [addToast]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save settings");
      setSettings({ ...body.settings, maintenanceMessage: body.settings.maintenanceMessage || "" });
      addToast({ type: "success", message: "Settings saved" });
    } catch (error) {
      addToast({ type: "error", message: error instanceof Error ? error.message : "Unable to save settings" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">General Settings</h1>
        <p className="mt-1 text-gray-400">Configure the public shop and maintenance state.</p>
      </div>

      <Card className="space-y-6 border-gray-800/50 bg-gray-900/50 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Shop Name</label>
          <Input value={settings.shopName} onChange={(event) => setSettings({ ...settings, shopName: event.target.value })} className="max-w-md border-gray-700 bg-gray-950 text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Shop Description</label>
          <Textarea value={settings.shopDescription} onChange={(event) => setSettings({ ...settings, shopDescription: event.target.value })} rows={3} className="border-gray-700 bg-gray-950 text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Currency</label>
          <Input value="THB — Thai Baht" readOnly className="max-w-xs border-gray-700 bg-gray-950 text-gray-400" />
          <p className="mt-1 text-xs text-gray-500">Stripe PromptPay requires THB.</p>
        </div>
        <div className="border-t border-gray-800 pt-6">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-gray-300">Maintenance Mode</span>
              <span className="mt-1 block text-xs text-gray-500">Disables store, cart, checkout and commerce mutations.</span>
            </span>
            <input type="checkbox" checked={settings.maintenanceMode} onChange={(event) => setSettings({ ...settings, maintenanceMode: event.target.checked })} className="h-5 w-5 rounded border-gray-700 bg-gray-950" />
          </label>
          <Textarea value={settings.maintenanceMessage} onChange={(event) => setSettings({ ...settings, maintenanceMessage: event.target.value })} rows={2} className="mt-4 border-gray-700 bg-gray-950 text-white" placeholder="Maintenance message shown to players" />
        </div>
      </Card>

      <Card className="border-gray-800/50 bg-gray-900/50 p-6">
        <div className="flex items-start gap-4">
          <Server className="mt-1 h-5 w-5 text-cyan-300" />
          <div className="flex-1">
            <h2 className="font-semibold text-white">Delivery Runtime</h2>
            <p className="mt-1 text-sm text-gray-400">Controlled by deployment environment and read-only here.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300">Mode: {delivery.mode}</span>
              <span className={`rounded-lg border px-3 py-2 ${delivery.rconConfigured ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                <ShieldCheck className="mr-2 inline h-4 w-4" />RCON {delivery.rconConfigured ? "configured" : "incomplete"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !settings.shopName.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

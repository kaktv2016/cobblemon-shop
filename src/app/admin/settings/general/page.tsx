"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface Settings {
  shopName: string;
  shopDescription: string;
  currency: string;
  deliveryMode: string;
  maintenanceMode: boolean;
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    shopName: "Cobblemon Shop",
    shopDescription: "The official Cobblemon webshop",
    currency: "THB",
    deliveryMode: "webhook",
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // In a real deployment, this would save to the database
      // For now, we'll just show a success message
      console.log("Saving settings:", settings);
      setTimeout(() => setSaving(false), 500);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">General Settings</h1>
        <p className="mt-1 text-gray-400">Configure your shop</p>
      </div>

      <Card className="border-gray-800/50 bg-gray-900/50 p-6">
        <div className="space-y-6">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Shop Name
            </label>
            <Input
              value={settings.shopName}
              onChange={(e) =>
                setSettings({ ...settings, shopName: e.target.value })
              }
              className="border-gray-700 bg-gray-900 text-white max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              The name of your shop displayed to customers
            </p>
          </div>

          {/* Shop Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Shop Description
            </label>
            <Textarea
              value={settings.shopDescription}
              onChange={(e) =>
                setSettings({ ...settings, shopDescription: e.target.value })
              }
              rows={4}
              className="border-gray-700 bg-gray-900 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Short description of your shop
            </p>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
              className="w-full md:w-48 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
            >
              <option value="THB">Thai Baht (฿)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The currency used for all prices
            </p>
          </div>

          {/* Delivery Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Delivery Mode
            </label>
            <select
              value={settings.deliveryMode}
              onChange={(e) =>
                setSettings({ ...settings, deliveryMode: e.target.value })
              }
              className="w-full md:w-48 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
            >
              <option value="dry-run">Dry Run (test mode)</option>
              <option value="webhook">Webhook</option>
              <option value="rcon">RCON</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How order deliveries are executed
            </p>
          </div>

          {/* Maintenance Mode */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Maintenance Mode
                </label>
                <p className="text-xs text-gray-500">
                  Temporarily disable the shop for maintenance
                </p>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maintenanceMode: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900"
                />
                <span className="text-sm font-medium text-gray-400">
                  {settings.maintenanceMode ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="border-l-4 border-amber-500 bg-amber-500/10 p-4 rounded">
            <p className="text-sm text-amber-300">
              Note: In a production environment, these settings would be persisted to the
              database. Currently, they are stored locally in the browser session.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          className="border-gray-700"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

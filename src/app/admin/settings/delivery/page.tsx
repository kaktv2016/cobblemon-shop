"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Loader2, Copy } from "lucide-react";

interface DeliveryTemplate {
  id: string;
  name: string;
  description: string | null;
  commandTemplate: string;
  adapterType: string;
  isActive: boolean;
}

interface FormData {
  name: string;
  description: string;
  commandTemplate: string;
  adapterType: string;
  isActive: boolean;
}

const SAMPLE_DATA = {
  player_name: "Steve",
  player_uuid: "550e8400-e29b-41d4-a716-446655440000",
  order_id: "ORD-001",
  product_id: "PROD-001",
  quantity: "1",
};

const ALLOWED_PLACEHOLDERS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "quantity",
];

function renderPreview(template: string): string {
  let preview = template;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    preview = preview.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return preview;
}

export default function DeliveryTemplatesPage() {
  const [templates, setTemplates] = useState<DeliveryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    commandTemplate: "",
    adapterType: "PAPER",
    isActive: true,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/delivery-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function validateTemplate(template: string): boolean {
    setValidationError(null);
    const placeholders = new Set<string>();
    const regex = /\{(\w+)\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      placeholders.add(match[1]);
    }

    for (const placeholder of placeholders) {
      if (!ALLOWED_PLACEHOLDERS.includes(placeholder)) {
        setValidationError(
          `Invalid placeholder: {${placeholder}}. Allowed: {${ALLOWED_PLACEHOLDERS.join("}, {")}}`
        );
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateTemplate(formData.commandTemplate)) {
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/settings/delivery-templates/${editingId}`
        : "/api/admin/settings/delivery-templates";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchTemplates();
        resetForm();
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(
        `/api/admin/settings/delivery-templates/${id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleTemplate(id: string, currentState: boolean) {
    try {
      const res = await fetch(`/api/admin/settings/delivery-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function editTemplate(template: DeliveryTemplate) {
    setFormData({
      name: template.name,
      description: template.description || "",
      commandTemplate: template.commandTemplate,
      adapterType: template.adapterType,
      isActive: template.isActive,
    });
    setEditingId(template.id);
    setShowForm(true);
    setValidationError(null);
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      commandTemplate: "",
      adapterType: "PAPER",
      isActive: true,
    });
    setEditingId(null);
    setValidationError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">
            Delivery Templates
          </h1>
          <p className="mt-1 text-gray-400">
            Manage server command templates for order delivery
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-gray-800/50 bg-gray-900/50 p-6">
          <CardHeader>
            <CardTitle className="text-white">
              {editingId ? "Edit" : "Create"} Delivery Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Template Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Give Pokemon"
                    className="border-gray-700 bg-gray-900 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Server Type *
                  </label>
                  <select
                    value={formData.adapterType}
                    onChange={(e) =>
                      setFormData({ ...formData, adapterType: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  >
                    <option value="PAPER">Paper</option>
                    <option value="SPIGOT">Spigot</option>
                    <option value="BUKKIT">Bukkit</option>
                    <option value="FABRIC">Fabric</option>
                    <option value="FORGE">Forge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What does this template do?"
                  rows={2}
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Command Template *
                </label>
                <Textarea
                  value={formData.commandTemplate}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      commandTemplate: e.target.value,
                    });
                    setValidationError(null);
                  }}
                  placeholder="/give {player_name} Pokemon 1"
                  rows={3}
                  className="border-gray-700 bg-gray-900 text-white font-mono text-sm"
                  required
                />
                {validationError && (
                  <p className="text-red-500 text-sm mt-2">{validationError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Available placeholders: {ALLOWED_PLACEHOLDERS.map((p) => (
                    <code key={p} className="bg-gray-900/50 px-1.5 py-0.5 rounded mx-1">
                      {`{${p}}`}
                    </code>
                  ))}
                </p>
              </div>

              {/* Preview */}
              {formData.commandTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Preview (Sample Data)
                  </label>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 bg-gray-900/50 border border-gray-700 rounded p-3 text-sm text-gray-300 font-mono break-all">
                      {renderPreview(formData.commandTemplate)}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          renderPreview(formData.commandTemplate)
                        );
                      }}
                      className="mt-1 text-gray-400 hover:text-gray-300"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  id="active"
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-400">
                  Active
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No templates yet</p>
        ) : (
          templates.map((template) => (
            <Card
              key={template.id}
              className="border-gray-800/50 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {template.name}
                        </h3>
                        <Badge className="border-gray-500/30 bg-gray-500/10 text-gray-300">
                          {template.adapterType}
                        </Badge>
                        {!template.isActive && (
                          <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-400 mb-3">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editTemplate(template)}
                        className="h-8 w-8 text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleTemplate(template.id, template.isActive)
                        }
                        className="h-8 w-8"
                      >
                        {template.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplate(template.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Command Template:
                    </p>
                    <code className="block bg-gray-800/50 border border-gray-700 rounded p-3 text-xs text-gray-300 font-mono break-all">
                      {template.commandTemplate}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reference Guide */}
      <Card className="border-gray-800/50 bg-gray-900/50 p-6">
        <CardTitle className="text-white mb-4">Placeholder Reference</CardTitle>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALLOWED_PLACEHOLDERS.map((placeholder) => (
              <div key={placeholder} className="flex items-start gap-2">
                <code className="bg-gray-800 text-indigo-300 px-2 py-1 rounded text-sm font-mono">
                  {`{${placeholder}}`}
                </code>
                <span className="text-sm text-gray-400">
                  {placeholder === "player_name" && "Minecraft username"}
                  {placeholder === "player_uuid" && "Minecraft UUID"}
                  {placeholder === "order_id" && "Order number"}
                  {placeholder === "product_id" && "Product identifier"}
                  {placeholder === "quantity" && "Quantity ordered"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBadge } from "@/components/admin/admin-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { getAdminStatusTone } from "@/lib/admin-ui";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  createdAt: string;
}

interface FormData {
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  sortOrder: string;
}

export default function AnnouncementsPage() {
  const { addToast } = useToast();
  const { formatDate, locale } = useAdminPreferences();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    type: "INFO",
    isActive: true,
    startDate: "",
    endDate: "",
    sortOrder: "0",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load announcements");
      setAnnouncements(data);
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to load announcements" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const wasEditing = Boolean(editingId);
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : "/api/admin/announcements";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          sortOrder: parseInt(formData.sortOrder),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save announcement");
      await fetchAnnouncements();
      resetForm();
      setShowForm(false);
      addToast({ type: "success", message: wasEditing ? "Announcement updated" : "Announcement created" });
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to save announcement" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAnnouncement(id: string, currentState: boolean) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update announcement status");
      await fetchAnnouncements();
      addToast({ type: "success", message: currentState ? "Announcement disabled" : "Announcement enabled" });
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to update announcement status" });
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm(locale === "th" ? "ลบประกาศนี้หรือไม่?" : "Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete announcement");
      await fetchAnnouncements();
      addToast({ type: "success", message: "Announcement deleted" });
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to delete announcement" });
    }
  }

  function editAnnouncement(announcement: Announcement) {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      startDate: announcement.startDate
        ? new Date(announcement.startDate).toISOString().slice(0, 16)
        : "",
      endDate: announcement.endDate
        ? new Date(announcement.endDate).toISOString().slice(0, 16)
        : "",
      sortOrder: announcement.sortOrder.toString(),
    });
    setEditingId(announcement.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      title: "",
      content: "",
      type: "INFO",
      isActive: true,
      startDate: "",
      endDate: "",
      sortOrder: "0",
    });
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">Announcements</h1>
          <p className="mt-1 text-gray-400">{announcements.length} total</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-gray-800/50 bg-gray-900/50 p-6">
          <CardHeader>
            <CardTitle className="text-white">
              {editingId ? "Edit" : "Create"} Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Announcement title"
                    className="border-gray-700 bg-gray-900 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="SALE">Sale</option>
                    <option value="EVENT">Event</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Announcement content"
                  rows={4}
                  className="border-gray-700 bg-gray-900 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900 text-white"
                  />
                </div>
              </div>

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
        ) : announcements.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No announcements</p>
        ) : (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className="border-gray-800/50 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        <span data-admin-user-content>{announcement.title}</span>
                      </h3>
                      <AdminBadge tone={getAdminStatusTone(announcement.type)} dot>
                        {announcement.type}
                      </AdminBadge>
                      {!announcement.isActive && (
                        <AdminBadge tone="neutral">Inactive</AdminBadge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {announcement.content}
                    </p>
                    {(announcement.startDate || announcement.endDate) && (
                      <p className="text-xs text-gray-600">
                        {announcement.startDate &&
                          `From ${formatDate(announcement.startDate)}`}
                        {announcement.startDate && announcement.endDate && " to "}
                        {announcement.endDate &&
                          `${formatDate(announcement.endDate)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editAnnouncement(announcement)}
                      className="h-8 w-8 text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleAnnouncement(announcement.id, announcement.isActive)}
                      className="h-8 w-8"
                    >
                      {announcement.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

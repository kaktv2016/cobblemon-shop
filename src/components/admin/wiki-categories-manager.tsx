"use client";

import { useState } from "react";
import { Edit, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WikiCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    articles: number;
  };
};

type WikiCategoryFormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: string;
  isVisible: boolean;
};

const emptyFormState: WikiCategoryFormState = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: "0",
  isVisible: true,
};

export function WikiCategoriesManager({
  initialCategories,
}: {
  initialCategories: WikiCategoryRecord[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [formState, setFormState] = useState<WikiCategoryFormState>(emptyFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setFormState(emptyFormState);
    setEditingId(null);
  }

  async function refreshCategories() {
    const response = await fetch("/api/admin/wiki-categories", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as WikiCategoryRecord[];
      setCategories(data);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formState,
        sortOrder: Number(formState.sortOrder) || 0,
      };

      const url = editingId
        ? `/api/admin/wiki-categories/${editingId}`
        : "/api/admin/wiki-categories";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save wiki category");
      }

      await refreshCategories();
      resetForm();
    } catch (error) {
      console.error("Wiki category save error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("Delete this wiki category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/wiki-categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete wiki category");
      }

      await refreshCategories();
      if (editingId === categoryId) {
        resetForm();
      }
    } catch (error) {
      console.error("Wiki category delete error:", error);
    }
  }

  function handleEdit(category: WikiCategoryRecord) {
    setEditingId(category.id);
    setFormState({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      sortOrder: String(category.sortOrder),
      isVisible: category.isVisible,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editingId ? "Edit wiki category" : "Create wiki category"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Manage the category structure players see in the public wiki.
            </p>
          </div>

          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel edit
            </Button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Name *
              </label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  }))
                }
                placeholder="Getting Started"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Slug *
              </label>
              <Input
                value={formState.slug}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                placeholder="getting-started"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>
            <Textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Player-facing description for this wiki category."
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Icon
              </label>
              <Input
                value={formState.icon}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    icon: event.target.value,
                  }))
                }
                placeholder="Compass"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Sort order
              </label>
              <Input
                type="number"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.isVisible}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      isVisible: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                <span className="text-sm font-medium text-slate-300">Visible to players</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Update category"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create category
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="border-slate-700 bg-slate-800/50 p-5 transition-colors hover:bg-slate-800/70"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                    {category.slug}
                  </span>
                  {!category.isVisible ? (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-200">
                      Hidden
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  {category.description || "No description provided yet."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span>{category._count.articles} article(s)</span>
                  <span>Sort {category.sortOrder}</span>
                  {category.icon ? <span>Icon {category.icon}</span> : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(category)}
                  className="h-9 w-9 text-blue-300 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  className="h-9 w-9 text-red-300 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

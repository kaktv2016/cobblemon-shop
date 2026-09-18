"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AdminStatusBadge } from "@/components/admin/admin-badge";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

export default function CategoriesPage() {
  const { locale } = useAdminPreferences();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const copy = locale === "th" ? {
    title: "หมวดหมู่", subtitle: "จัดหมวดหมู่สินค้าและลำดับที่แสดงในหน้าร้าน", add: "เพิ่มหมวดหมู่",
    loading: "กำลังโหลดหมวดหมู่…", empty: "ยังไม่มีหมวดหมู่", name: "ชื่อ", products: "สินค้า",
    sortOrder: "ลำดับ", status: "สถานะ", actions: "การดำเนินการ", active: "เปิดใช้งาน",
    inactive: "ปิดใช้งาน", edit: "แก้ไข", remove: "ลบ", retry: "ลองใหม่",
    deleteConfirm: "ลบหมวดหมู่นี้หรือไม่? หมวดหมู่ที่ยังมีสินค้าจะไม่สามารถลบได้",
    deleted: "ลบหมวดหมู่แล้ว", reordered: "บันทึกลำดับหมวดหมู่แล้ว", loadError: "โหลดหมวดหมู่ไม่สำเร็จ",
  } : {
    title: "Categories", subtitle: "Organize products and their storefront order", add: "Add Category",
    loading: "Loading categories…", empty: "No categories found", name: "Name", products: "Products",
    sortOrder: "Sort Order", status: "Status", actions: "Actions", active: "Active", inactive: "Inactive",
    edit: "Edit", remove: "Delete", retry: "Retry",
    deleteConfirm: "Delete this category? Categories that still contain products cannot be deleted.",
    deleted: "Category deleted", reordered: "Category order saved", loadError: "Unable to load categories",
  };

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/categories", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || copy.loadError);
      setCategories(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  async function deleteCategory(category: Category) {
    if (!window.confirm(copy.deleteConfirm)) return;
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || copy.loadError);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      addToast({ type: "success", message: copy.deleted });
    } catch (cause) {
      addToast({ type: "error", message: cause instanceof Error ? cause.message : copy.loadError });
    }
  }

  async function moveCategory(targetId: string) {
    if (!draggedId || draggedId === targetId || isReordering) return;
    const previous = categories;
    const from = categories.findIndex((item) => item.id === draggedId);
    const to = categories.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const optimistic = reordered.map((item, index) => ({ ...item, sortOrder: index + 1 }));
    setCategories(optimistic);
    setDraggedId(null);
    setIsReordering(true);
    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: optimistic.map((item) => item.id) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || copy.loadError);
      addToast({ type: "success", message: copy.reordered });
    } catch (cause) {
      setCategories(previous);
      addToast({ type: "error", message: cause instanceof Error ? cause.message : copy.loadError });
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="admin-heading text-3xl font-bold">{copy.title}</h1><p className="admin-muted mt-1">{copy.subtitle}</p></div>
        <Button asChild className="admin-primary-button"><Link href="/admin/categories/new"><Plus className="mr-2 h-4 w-4" />{copy.add}</Link></Button>
      </div>
      <Card className="admin-surface overflow-hidden">
        {isLoading ? (
          <div className="admin-muted flex items-center justify-center gap-2 p-10"><Loader2 className="h-5 w-5 animate-spin" />{copy.loading}</div>
        ) : error ? (
          <div className="p-10 text-center"><p className="admin-danger-text">{error}</p><Button className="mt-4" variant="outline" onClick={() => void loadCategories()}>{copy.retry}</Button></div>
        ) : categories.length === 0 ? <p className="admin-muted p-10 text-center">{copy.empty}</p> : (
          <div className="overflow-x-auto"><table className="admin-table w-full">
            <thead><tr><th className="w-14" aria-label="Reorder" /><th>{copy.name}</th><th>Slug</th><th>{copy.products}</th><th>{copy.sortOrder}</th><th>{copy.status}</th><th>{copy.actions}</th></tr></thead>
            <tbody>{categories.map((category) => (
              <tr key={category.id} draggable={!isReordering} onDragStart={() => setDraggedId(category.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => void moveCategory(category.id)}>
                <td><button type="button" className="admin-icon-button cursor-grab active:cursor-grabbing" title="Drag to reorder" aria-label={`Reorder ${category.name}`}><GripVertical className="h-4 w-4" /></button></td>
                <td className="font-medium" data-admin-user-content>{category.name}</td><td className="admin-muted" data-admin-user-content>{category.slug}</td>
                <td>{category._count.products}</td><td>{category.sortOrder}</td>
                <td><AdminStatusBadge status={category.isActive ? "ACTIVE" : "INACTIVE"} label={category.isActive ? copy.active : copy.inactive} /></td>
                <td><div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="icon" title={copy.edit}><Link href={`/admin/categories/${category.id}`} aria-label={`${copy.edit} ${category.name}`}><Edit className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" title={copy.remove} aria-label={`${copy.remove} ${category.name}`} className="admin-danger-action" onClick={() => void deleteCategory(category)}><Trash2 className="h-4 w-4" /></Button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}

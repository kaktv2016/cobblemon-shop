"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategoryFormSchema, CategoryFormSchemaType } from "@/lib/admin/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CategoryFormProps {
  initialData?: Partial<CategoryFormSchemaType>;
  isEditMode?: boolean;
  categoryId?: string;
}

export function CategoryForm({
  initialData,
  isEditMode = false,
  categoryId,
}: CategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormSchemaType>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: initialData,
  });

  const categoryName = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug);
  };

  const onSubmit = async (data: CategoryFormSchemaType) => {
    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/categories/${categoryId}`
        : "/api/admin/categories";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category Name *
              </label>
              <Input
                {...register("name")}
                onChange={handleNameChange}
                placeholder="e.g., Cosmetics, Ranks"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Slug *
              </label>
              <Input
                {...register("slug")}
                placeholder="auto-generated"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.slug && (
                <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <Textarea
              {...register("description")}
              placeholder="Category description"
              rows={3}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sort Order
              </label>
              <Input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                placeholder="0"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                />
                <span className="text-sm font-medium text-slate-300">Active</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? "Saving..." : isEditMode ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

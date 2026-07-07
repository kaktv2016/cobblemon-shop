"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import {
  WikiArticleFormSchema,
  type WikiArticleFormSchemaType,
} from "@/lib/admin/validation";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WikiArticleFormProps = {
  categories: Array<{
    id: string;
    name: string;
  }>;
  initialData?: Partial<WikiArticleFormSchemaType>;
  isEditMode?: boolean;
  articleId?: string;
};

export function WikiArticleForm({
  categories,
  initialData,
  isEditMode = false,
  articleId,
}: WikiArticleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<WikiArticleFormSchemaType>({
    resolver: zodResolver(WikiArticleFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      excerpt: initialData?.excerpt || "",
      content: initialData?.content || "",
      coverImage: initialData?.coverImage || "",
      categoryId: initialData?.categoryId || "",
      isFeatured: initialData?.isFeatured ?? false,
      status: initialData?.status || "DRAFT",
      sortOrder: initialData?.sortOrder ?? 0,
      seoTitle: initialData?.seoTitle || "",
      seoDescription: initialData?.seoDescription || "",
      gameVersion: initialData?.gameVersion || "",
      lastReviewedAt: initialData?.lastReviewedAt || "",
      searchKeywords: initialData?.searchKeywords || "",
    },
  });

  const status = watch("status");
  const coverImage = watch("coverImage");

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads/wiki", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Image upload failed.");
      }

      setValue("coverImage", result.url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      clearErrors("coverImage");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed."
      );
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  async function onSubmit(data: WikiArticleFormSchemaType) {
    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/admin/wiki/${articleId}`
        : "/api/admin/wiki";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save wiki article");
      }

      router.push("/admin/content/wiki");
      router.refresh();
    } catch (error) {
      console.error("Wiki article save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Article identity</h2>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Title *
              </label>
              <Input
                {...register("title")}
                onChange={(event) => {
                  register("title").onChange(event);
                  setValue("slug", slugify(event.target.value));
                }}
                placeholder="Starter path for new trainers"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Slug *
              </label>
              <Input
                {...register("slug")}
                placeholder="starter-path-for-new-trainers"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
              {errors.slug ? (
                <p className="mt-1 text-sm text-red-400">{errors.slug.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Excerpt *
            </label>
            <Textarea
              {...register("excerpt")}
              rows={3}
              placeholder="Short summary for cards, search, and metadata."
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.excerpt ? (
              <p className="mt-1 text-sm text-red-400">{errors.excerpt.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Markdown content *
            </label>
            <Textarea
              {...register("content")}
              rows={18}
              placeholder={"## Overview\n\nWrite your article in Markdown.\n\n- Lists\n- Tables\n- Code blocks"}
              className="min-h-[26rem] border-slate-600 bg-slate-900 font-mono text-sm text-white placeholder:text-slate-500"
            />
            {errors.content ? (
              <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Cover image
            </label>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-slate-900/80">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[15rem] border-b border-slate-700/80 bg-[linear-gradient(135deg,rgba(12,20,44,0.98),rgba(10,30,52,0.92),rgba(8,12,26,0.98))] lg:min-h-[18rem] lg:border-b-0 lg:border-r">
                  {coverImage ? (
                    <>
                      <img
                        src={coverImage}
                        alt="Wiki cover preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,21,0.08),rgba(7,10,21,0.78)_68%,rgba(7,10,21,0.96))]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.18),transparent_24%)]" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.14),transparent_24%)]" />
                  )}

                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-slate-950/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-md">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Cover preview
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        Portal hero surface
                      </p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-200/86">
                        Use a landscape image for the strongest article header and category spotlight.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="border-slate-600 bg-slate-900/70 text-slate-100 hover:bg-slate-800"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      {isUploadingImage ? "Uploading..." : "Upload image"}
                    </Button>

                    {coverImage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setValue("coverImage", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                        className="text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
                      Upload result or manual image path
                    </label>
                    <Input
                      {...register("coverImage")}
                      placeholder="/uploads/wiki/my-cover.webp or https://example.com/wiki-cover.png"
                      className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                    />
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      Upload saves into the local wiki media folder. You can still paste an external URL if needed.
                    </p>
                  </div>

                  {uploadError ? (
                    <p className="rounded-xl border border-red-400/18 bg-red-400/8 px-3 py-2 text-sm text-red-300">
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {errors.coverImage ? (
              <p className="mt-1 text-sm text-red-400">{errors.coverImage.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Publishing</h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Category *
            </label>
            <select
              {...register("categoryId")}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p className="mt-1 text-sm text-red-400">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Status *
            </label>
            <select
              {...register("status")}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="OUTDATED">Outdated</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Sort order
            </label>
            <Input
              type="number"
              {...register("sortOrder", { valueAsNumber: true })}
              placeholder="0"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Last reviewed
            </label>
            <Input
              type="date"
              {...register("lastReviewedAt")}
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Game version
            </label>
            <Input
              {...register("gameVersion")}
              placeholder="Cobblemon 1.6"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search keywords
            </label>
            <Input
              {...register("searchKeywords")}
              placeholder="starter, onboarding, beginner, spawn"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isFeatured")}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            />
            <span className="text-sm font-medium text-slate-300">Featured article</span>
          </label>

          <span className="text-sm text-slate-500">
            Current mode: {status === "PUBLISHED" ? "visible to players" : "kept off the public wiki"}
          </span>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">SEO</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              SEO title
            </label>
            <Input
              {...register("seoTitle")}
              placeholder="Optional metadata title"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              SEO description
            </label>
            <Textarea
              {...register("seoDescription")}
              rows={3}
              placeholder="Optional metadata description"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/content/wiki")}
          className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update article"
              : "Create article"}
        </Button>
      </div>
    </form>
  );
}

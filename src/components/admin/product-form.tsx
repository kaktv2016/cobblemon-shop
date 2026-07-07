"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormSchema, type ProductFormSchemaType } from "@/lib/admin/validation";
import { X, Plus } from "lucide-react";

interface ProductFormProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  initialData?: Partial<ProductFormSchemaType>;
  isEditMode?: boolean;
  productId?: string;
}

const PRODUCT_TYPE_OPTIONS = [
  { value: "RANK", label: "Rank" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "CURRENCY", label: "Currency" },
  { value: "COSMETIC", label: "Cosmetic" },
  { value: "CRATE_KEY", label: "Crate Key" },
  { value: "BUNDLE", label: "Bundle" },
  { value: "PERK", label: "Perk" },
  { value: "BATTLE_PASS", label: "Battle Pass" },
  { value: "LIMITED_OFFER", label: "Limited Offer" },
  { value: "FREE_REWARD", label: "Free Reward" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "DRAFT", label: "Draft" },
] as const;

function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

export function ProductForm({
  categories,
  initialData,
  isEditMode = false,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [bundleItems, setBundleItems] = useState<
    Array<{ productId: string; quantity: number }>
  >(initialData?.bundleItems || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormSchemaType>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      type: initialData?.type || "COSMETIC",
      price: initialData?.price ?? 0,
      compareAtPrice: initialData?.compareAtPrice ?? undefined,
      imageUrl: initialData?.imageUrl || "",
      bannerUrl: initialData?.bannerUrl || "",
      isFeatured: initialData?.isFeatured ?? false,
      isActive: initialData?.isActive ?? true,
      visibility: initialData?.visibility || "DRAFT",
      stockLimit: initialData?.stockLimit ?? undefined,
      purchaseLimit: initialData?.purchaseLimit ?? undefined,
      cooldownMinutes: initialData?.cooldownMinutes ?? undefined,
      startDate: initialData?.startDate || "",
      endDate: initialData?.endDate || "",
      deliveryTemplateId: initialData?.deliveryTemplateId || "",
      tags: initialData?.tags || [],
      metadata: initialData?.metadata,
      bundleItems: initialData?.bundleItems || [],
    },
  });

  const nameField = register("name");
  const productType = watch("type");
  const selectedCategory = categories.find((category) => category.id === watch("categoryId"));

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    nameField.onChange(event);

    const name = event.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setValue("slug", slug, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue("tags", newTags, { shouldDirty: true });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags, { shouldDirty: true });
  };

  const onSubmit = async (data: ProductFormSchemaType) => {
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription || null,
      fullDescription: data.description || null,
      imageUrl: data.imageUrl || null,
      bannerUrl: data.bannerUrl || null,
      categoryId: data.categoryId,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      productType: data.type,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      visibility: data.visibility,
      stockLimit: data.stockLimit ?? null,
      purchaseLimit: data.purchaseLimit ?? null,
      cooldownMinutes: data.cooldownMinutes ?? null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      deliveryTemplateId: data.deliveryTemplateId || null,
      metadata: data.metadata,
      tags: data.tags,
      bundleItems: data.bundleItems,
    };

    try {
      const url = isEditMode
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save product";
      setSubmitError(message);
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Basic Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Product Name *
              </label>
              <Input
                {...nameField}
                onChange={handleNameChange}
                placeholder="Enter product name"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Slug *
              </label>
              <Input
                {...register("slug")}
                placeholder="auto-generated"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
              {errors.slug ? (
                <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Short Description
            </label>
            <Input
              {...register("shortDescription")}
              placeholder="Brief description for listings"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.shortDescription ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.shortDescription.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Full Description *
            </label>
            <Textarea
              {...register("description")}
              placeholder="Detailed product description"
              rows={4}
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.description ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Category & Type</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Category *
            </label>
            <select
              {...register("categoryId")}
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {selectedCategory ? (
              <p className="mt-2 text-xs text-slate-500">
                Store path: /store/{selectedCategory.slug}
              </p>
            ) : null}
            {errors.categoryId ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.categoryId.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Product Type *
            </label>
            <select
              {...register("type")}
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white"
            >
              {PRODUCT_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type ? (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Price *
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("price", { setValueAs: (value) => Number(value) })}
              placeholder="0.00"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.price ? (
              <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Compare At Price
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("compareAtPrice", {
                setValueAs: normalizeOptionalNumber,
              })}
              placeholder="0.00"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.compareAtPrice ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.compareAtPrice.message}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Images</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Image URL *
            </label>
            <Input
              {...register("imageUrl")}
              placeholder="https://example.com/image.png"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.imageUrl ? (
              <p className="mt-1 text-sm text-red-500">{errors.imageUrl.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Banner URL
            </label>
            <Input
              {...register("bannerUrl")}
              placeholder="https://example.com/banner.png"
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            {errors.bannerUrl ? (
              <p className="mt-1 text-sm text-red-500">{errors.bannerUrl.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Status & Visibility</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              <span className="text-sm font-medium text-slate-300">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isFeatured")}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              <span className="text-sm font-medium text-slate-300">Featured</span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Visibility
            </label>
            <select
              {...register("visibility")}
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.visibility ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.visibility.message}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Limits & Timing</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Stock Limit
              </label>
              <Input
                type="number"
                {...register("stockLimit", { setValueAs: normalizeOptionalNumber })}
                placeholder="Unlimited"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Purchase Limit Per User
              </label>
              <Input
                type="number"
                {...register("purchaseLimit", { setValueAs: normalizeOptionalNumber })}
                placeholder="Unlimited"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Cooldown (minutes)
              </label>
              <Input
                type="number"
                {...register("cooldownMinutes", { setValueAs: normalizeOptionalNumber })}
                placeholder="0"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Start Date
              </label>
              <Input
                type="datetime-local"
                {...register("startDate")}
                className="border-slate-600 bg-slate-900 text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                End Date
              </label>
              <Input
                type="datetime-local"
                {...register("endDate")}
                className="border-slate-600 bg-slate-900 text-white"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Tags</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag..."
              className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="border-indigo-600/30 bg-indigo-600/20 text-indigo-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 hover:text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      {productType === "BUNDLE" ? (
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Bundle Items</h2>
          <p className="mb-4 text-sm text-slate-400">
            Add products to this bundle
          </p>
          <div className="space-y-2 text-sm text-slate-400">
            {bundleItems.length === 0 ? (
              <p>No items added yet</p>
            ) : (
              bundleItems.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex items-center justify-between rounded bg-slate-900 p-3"
                >
                  <span>
                    {item.productId} x {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = bundleItems.filter((_, itemIndex) => itemIndex !== index);
                      setBundleItems(updated);
                      setValue("bundleItems", updated, { shouldDirty: true });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      ) : null}

      <div className="flex justify-end gap-4">
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
          {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

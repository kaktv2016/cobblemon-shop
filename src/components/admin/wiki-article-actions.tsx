"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WikiArticleActions({
  articleId,
}: {
  articleId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this wiki article?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/wiki/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete article");
      }

      router.refresh();
    } catch (error) {
      console.error("Wiki article delete error:", error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-blue-300 hover:text-white"
      >
        <Link href={`/admin/content/wiki/${articleId}`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="h-9 w-9 text-red-300 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

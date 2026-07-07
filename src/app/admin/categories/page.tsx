"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setCategories([
      {
        id: "1",
        name: "Cosmetics",
        slug: "cosmetics",
        productCount: 24,
        sortOrder: 1,
        isActive: true,
      },
      {
        id: "2",
        name: "Ranks",
        slug: "ranks",
        productCount: 8,
        sortOrder: 2,
        isActive: true,
      },
      {
        id: "3",
        name: "Bundles",
        slug: "bundles",
        productCount: 5,
        sortOrder: 3,
        isActive: true,
      },
    ]);
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 mt-1">Organize your products</p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      <Card className="border-slate-700 bg-slate-800/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading categories...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300 w-10">
                    <GripVertical className="h-4 w-4" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Sort Order
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-400 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {category.productCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {category.sortOrder}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive
                            ? "bg-green-600/20 text-green-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/categories/${category.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

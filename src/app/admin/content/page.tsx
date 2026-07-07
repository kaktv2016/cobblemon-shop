import Link from "next/link";
import { FileText, Megaphone, Shapes } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";

const contentSections = [
  {
    href: "/admin/content/announcements",
    title: "Announcements",
    description: "Manage global news bars and public-facing alerts.",
    icon: Megaphone,
  },
  {
    href: "/admin/content/wiki",
    title: "Wiki Articles",
    description: "Create and publish player-facing guides for the server wiki.",
    icon: FileText,
  },
  {
    href: "/admin/content/wiki/categories",
    title: "Wiki Categories",
    description: "Organize the knowledge base into browsable game systems.",
    icon: Shapes,
  },
];

export const metadata = {
  title: "Content - Admin",
  description: "Manage site content and wiki data",
};

export default async function AdminContentPage() {
  await requireAdminSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Content</h1>
        <p className="mt-1 text-slate-400">
          Manage public-facing messaging and the new player wiki.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {contentSections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 transition-colors hover:border-slate-500 hover:bg-slate-800"
            >
              <Icon className="h-6 w-6 text-cyan-300" />
              <h2 className="mt-5 text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

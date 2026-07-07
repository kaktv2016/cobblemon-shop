import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicNewsAnnouncements } from "@/lib/public-store-cache";

export const metadata = {
  title: "News & Updates - CobbleMart",
  description: "Latest news and announcements",
};

const typeColors: Record<string, { color: string; label: string }> = {
  INFO: { color: "bg-blue-500/20 text-blue-300", label: "Info" },
  WARNING: { color: "bg-amber-500/20 text-amber-300", label: "Warning" },
  SALE: { color: "bg-emerald-500/20 text-emerald-300", label: "Sale" },
  EVENT: { color: "bg-purple-500/20 text-purple-300", label: "Event" },
  MAINTENANCE: { color: "bg-red-500/20 text-red-300", label: "Maintenance" },
};

export const revalidate = 60;

export default async function NewsPage() {
  const announcements = await getPublicNewsAnnouncements();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-slate-100">News & Updates</h1>
          <p className="mt-4 text-lg text-slate-400">
            Stay informed about the latest announcements and changes
          </p>
        </div>
      </section>

      {/* News Feed */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const typeConfig =
                  typeColors[announcement.type] || typeColors.INFO;

                return (
                  <Card
                    key={announcement.id}
                    className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 hover:border-indigo-400/30 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-slate-100">
                              {announcement.title}
                            </h2>
                            <Badge className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                          </div>
                          <p className="text-slate-300 line-clamp-2">
                            {announcement.content.length > 200
                              ? announcement.content.substring(0, 200) + "..."
                              : announcement.content}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                        {new Date(announcement.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-12 text-center">
              <p className="text-lg text-slate-400">No announcements yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Check back soon for updates!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

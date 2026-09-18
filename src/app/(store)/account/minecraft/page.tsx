import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function MinecraftPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/account/minecraft");
  const account = await prisma.minecraftAccount.findUnique({ where: { userId: session.user.id } });
  const username = account?.username || session.user.username;

  return <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16"><div className="mx-auto max-w-2xl space-y-8"><div><h1 className="text-4xl font-bold text-slate-100">Minecraft Account</h1><p className="mt-2 text-slate-400">Your webshop session is authenticated by the same AuthMe account used in game.</p></div>
    <Card className="border-emerald-500/25 bg-slate-900/70 p-6"><div className="flex items-start gap-4"><div className="rounded-full bg-emerald-500/15 p-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" /></div><div><p className="text-sm font-medium text-emerald-300">Connected through AuthMe</p><p className="mt-2 text-xl font-bold text-white">{username}</p>{account?.uuid ? <p className="mt-1 font-mono text-xs text-slate-400">UUID: {account.uuid}</p> : <p className="mt-1 text-sm text-slate-400">No UUID has been stored yet. Delivery uses your verified AuthMe username.</p>}<p className="mt-4 text-sm leading-6 text-slate-300">All new purchases are delivered to this username. To use another account, sign out and log in with that Minecraft account.</p></div></div></Card>
  </div></main>;
}

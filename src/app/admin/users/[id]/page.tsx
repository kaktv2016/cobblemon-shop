"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBadge, AdminStatusBadge } from "@/components/admin/admin-badge";
import { Loader2, ArrowLeft, X, Plus } from "lucide-react";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { getAdminRoleTone } from "@/lib/admin-ui";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Array<{ role: { id: string; name: string } }>;
  minecraftAccount: { username: string; uuid: string } | null;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  _count: { orders: number };
}

const allRoles = ["admin", "moderator", "user"];

export default function AdminUserDetailPage() {
  const { formatCurrency, formatDate } = useAdminPreferences();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setDisplayName(data.displayName || "");
        setIsActive(data.isActive);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          isActive,
        }),
      });
      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function addRole(roleId: string) {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_role",
          roleId,
        }),
      });
      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function removeRole(roleId: string) {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_role",
          roleId,
        }),
      });
      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/admin/users" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Profile Section */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <p className="font-medium text-white" data-admin-user-content>{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <p className="font-medium text-white" data-admin-user-content>{user.email}</p>
              {user.emailVerified && (
                <AdminBadge tone="success" className="mt-2" dot>Verified</AdminBadge>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                />
                <span className="text-white">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Joined</p>
              <p className="text-white font-medium">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-white font-medium">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minecraft Account Section */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Minecraft Account</CardTitle>
        </CardHeader>
        <CardContent>
          {user.minecraftAccount ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium text-white">{user.minecraftAccount.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">UUID</p>
                <p className="font-mono text-sm text-gray-400">{user.minecraftAccount.uuid}</p>
              </div>
              <AdminBadge tone="success" className="mt-2" dot>Linked</AdminBadge>
            </div>
          ) : (
            <p className="text-gray-500">Not linked</p>
          )}
        </CardContent>
      </Card>

      {/* Roles Section */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map((ur) => (
                <AdminBadge
                  key={ur.role.id}
                  tone={getAdminRoleTone(ur.role.name)}
                  className="gap-2"
                >
                  {ur.role.name}
                  <button
                    onClick={() => removeRole(ur.role.id)}
                    className="hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </AdminBadge>
              ))
            ) : (
              <p className="text-gray-500">No roles assigned</p>
            )}
          </div>

          {/* Add Role Dropdown */}
          <div className="mt-4 border-t border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-400 mb-2">Add Role</p>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addRole(e.target.value);
                }
              }}
              className="rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white w-full"
            >
              <option value="">Select role...</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Orders ({user._count.orders})</CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left text-gray-500">Order #</th>
                    <th className="px-4 py-2 text-left text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-gray-500">Status</th>
                    <th className="px-4 py-2 text-right text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {user.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2 text-white">
                        <Link href={`/admin/orders/${order.id}`} className="text-indigo-400 hover:text-indigo-300">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <AdminStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-2 text-right text-white font-medium">
                        {formatCurrency(Number(order.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders</p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

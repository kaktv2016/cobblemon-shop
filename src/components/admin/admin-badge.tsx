"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { cn } from "@/lib/utils";
import { getAdminRoleTone, getAdminStatusTone, type AdminTone } from "@/lib/admin-ui";
import { translateAdminStatus } from "@/lib/admin-i18n";

interface AdminBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: AdminTone;
  children: ReactNode;
  dot?: boolean;
}

export function AdminBadge({ tone = "neutral", dot = false, className, children, ...props }: AdminBadgeProps) {
  return (
    <span className={cn("admin-badge", className)} data-tone={tone} {...props}>
      {dot && <span className="admin-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function AdminStatusBadge({ status, label, className }: { status: string; label?: ReactNode; className?: string }) {
  const { locale } = useAdminPreferences();
  return (
    <AdminBadge tone={getAdminStatusTone(status)} className={className} dot>
      {label ?? translateAdminStatus(locale, status)}
    </AdminBadge>
  );
}

export function AdminRoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <AdminBadge tone={getAdminRoleTone(role)} className={className} dot>
      {role}
    </AdminBadge>
  );
}

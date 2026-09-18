export const adminLocales = ["en", "th"] as const;
export const adminThemes = ["dark", "light"] as const;

export type AdminLocale = (typeof adminLocales)[number];
export type AdminTheme = (typeof adminThemes)[number];

export const ADMIN_DEFAULT_LOCALE: AdminLocale = "en";
export const ADMIN_DEFAULT_THEME: AdminTheme = "dark";

const en = {
  "brand.admin": "Admin",
  "nav.dashboard": "Dashboard",
  "nav.products": "Products",
  "nav.categories": "Categories",
  "nav.orders": "Orders",
  "nav.users": "Users",
  "nav.coupons": "Coupons",
  "nav.delivery": "Delivery",
  "nav.content": "Content",
  "nav.audit": "Audit Log",
  "nav.settings": "Settings",
  "header.notifications": "Notifications",
  "header.noNotifications": "No new notifications",
  "header.logout": "Logout",
  "header.lightTheme": "Use light theme",
  "header.darkTheme": "Use dark theme",
  "header.language": "Language",
  "sidebar.collapse": "Collapse navigation",
  "sidebar.expand": "Expand navigation",
  "settings.general": "General",
  "settings.delivery": "Delivery Commands",
  "common.loading": "Loading…",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.retry": "Retry",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.export": "Export",
  "common.actions": "Actions",
  "common.status": "Status",
  "common.active": "Active",
  "common.inactive": "Inactive",
  "common.enabled": "Enabled",
  "common.disabled": "Disabled",
  "common.yes": "Yes",
  "common.no": "No",
  "common.none": "None",
  "common.previous": "Previous",
  "common.next": "Next",
  "common.close": "Close",
  "common.genericError": "Something went wrong. Please try again.",
  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "Overview of your shop performance",
  "dashboard.totalRevenue": "Total Revenue",
  "dashboard.totalOrders": "Total Orders",
  "dashboard.totalUsers": "Total Users",
  "dashboard.activeProducts": "Active Products",
  "dashboard.pendingPayment": "Pending Payment",
  "dashboard.processing": "Processing",
  "dashboard.failedDeliveries": "Failed Deliveries",
  "dashboard.failedJobs": "{count} failed delivery job(s) need attention",
  "dashboard.viewQueue": "View Queue →",
  "dashboard.monthlyAnalytics": "Monthly Sales Analytics",
  "dashboard.monthlySubtitle": "Revenue & order trends for the last 12 months",
  "dashboard.recentOrders": "Recent Orders",
  "dashboard.recentSignups": "Recent Signups",
  "dashboard.viewAll": "View All →",
  "dashboard.noOrders": "No orders yet",
  "dashboard.items": "{count} items",
  "status.PENDING_PAYMENT": "Pending payment",
  "status.PAID": "Paid",
  "status.QUEUED_DELIVERY": "Queued for delivery",
  "status.PROCESSING": "Processing",
  "status.DELIVERED": "Delivered",
  "status.FAILED": "Failed",
  "status.FAILED_DELIVERY": "Delivery failed",
  "status.CANCELLED": "Cancelled",
  "status.REFUNDED": "Refunded",
  "status.PENDING": "Pending",
  "status.COMPLETED": "Completed",
  "status.SUCCESS": "Success",
  "status.SKIPPED": "Skipped",
  "status.QUEUED": "Queued",
  "status.PARTIALLY_DELIVERED": "Partially delivered",
  "status.CANCELED": "Canceled",
  "status.DRAFT": "Draft",
  "status.PUBLISHED": "Published",
  "status.OUTDATED": "Outdated",
  "status.PUBLIC": "Public",
  "status.HIDDEN": "Hidden",
} as const;

export type AdminTranslationKey = keyof typeof en;

const th = {
  "brand.admin": "ผู้ดูแลระบบ",
  "nav.dashboard": "แดชบอร์ด",
  "nav.products": "สินค้า",
  "nav.categories": "หมวดหมู่",
  "nav.orders": "คำสั่งซื้อ",
  "nav.users": "ผู้ใช้",
  "nav.coupons": "คูปอง",
  "nav.delivery": "การส่งสินค้า",
  "nav.content": "เนื้อหา",
  "nav.audit": "บันทึกกิจกรรม",
  "nav.settings": "ตั้งค่า",
  "header.notifications": "การแจ้งเตือน",
  "header.noNotifications": "ไม่มีการแจ้งเตือนใหม่",
  "header.logout": "ออกจากระบบ",
  "header.lightTheme": "ใช้โทนสว่าง",
  "header.darkTheme": "ใช้โทนมืด",
  "header.language": "ภาษา",
  "sidebar.collapse": "ย่อเมนูนำทาง",
  "sidebar.expand": "ขยายเมนูนำทาง",
  "settings.general": "ทั่วไป",
  "settings.delivery": "คำสั่งส่งสินค้า",
  "common.loading": "กำลังโหลด…",
  "common.save": "บันทึก",
  "common.saving": "กำลังบันทึก…",
  "common.cancel": "ยกเลิก",
  "common.create": "สร้าง",
  "common.edit": "แก้ไข",
  "common.delete": "ลบ",
  "common.retry": "ลองใหม่",
  "common.search": "ค้นหา",
  "common.filter": "ตัวกรอง",
  "common.export": "ส่งออก",
  "common.actions": "การดำเนินการ",
  "common.status": "สถานะ",
  "common.active": "เปิดใช้งาน",
  "common.inactive": "ไม่ใช้งาน",
  "common.enabled": "เปิดใช้งาน",
  "common.disabled": "ปิดใช้งาน",
  "common.yes": "ใช่",
  "common.no": "ไม่",
  "common.none": "ไม่มี",
  "common.previous": "ก่อนหน้า",
  "common.next": "ถัดไป",
  "common.close": "ปิด",
  "common.genericError": "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
  "dashboard.title": "แดชบอร์ด",
  "dashboard.subtitle": "ภาพรวมประสิทธิภาพร้านค้าของคุณ",
  "dashboard.totalRevenue": "รายได้รวม",
  "dashboard.totalOrders": "คำสั่งซื้อทั้งหมด",
  "dashboard.totalUsers": "ผู้ใช้ทั้งหมด",
  "dashboard.activeProducts": "สินค้าที่เปิดขาย",
  "dashboard.pendingPayment": "รอชำระเงิน",
  "dashboard.processing": "กำลังดำเนินการ",
  "dashboard.failedDeliveries": "ส่งสินค้าไม่สำเร็จ",
  "dashboard.failedJobs": "มีงานส่งสินค้าล้มเหลว {count} รายการที่ต้องตรวจสอบ",
  "dashboard.viewQueue": "ดูคิว →",
  "dashboard.monthlyAnalytics": "สถิติยอดขายรายเดือน",
  "dashboard.monthlySubtitle": "แนวโน้มรายได้และคำสั่งซื้อในช่วง 12 เดือนล่าสุด",
  "dashboard.recentOrders": "คำสั่งซื้อล่าสุด",
  "dashboard.recentSignups": "ผู้ใช้ใหม่ล่าสุด",
  "dashboard.viewAll": "ดูทั้งหมด →",
  "dashboard.noOrders": "ยังไม่มีคำสั่งซื้อ",
  "dashboard.items": "{count} รายการ",
  "status.PENDING_PAYMENT": "รอชำระเงิน",
  "status.PAID": "ชำระเงินแล้ว",
  "status.QUEUED_DELIVERY": "รอส่งสินค้า",
  "status.PROCESSING": "กำลังดำเนินการ",
  "status.DELIVERED": "ส่งแล้ว",
  "status.FAILED": "ล้มเหลว",
  "status.FAILED_DELIVERY": "ส่งสินค้าไม่สำเร็จ",
  "status.CANCELLED": "ยกเลิกแล้ว",
  "status.REFUNDED": "คืนเงินแล้ว",
  "status.PENDING": "รอดำเนินการ",
  "status.COMPLETED": "เสร็จสมบูรณ์",
  "status.SUCCESS": "สำเร็จ",
  "status.SKIPPED": "ข้ามแล้ว",
  "status.QUEUED": "เข้าคิวแล้ว",
  "status.PARTIALLY_DELIVERED": "ส่งแล้วบางส่วน",
  "status.CANCELED": "ยกเลิกแล้ว",
  "status.DRAFT": "ฉบับร่าง",
  "status.PUBLISHED": "เผยแพร่แล้ว",
  "status.OUTDATED": "ล้าสมัย",
  "status.PUBLIC": "สาธารณะ",
  "status.HIDDEN": "ซ่อน",
} as const satisfies Record<AdminTranslationKey, string>;

export const adminDictionaries: Record<AdminLocale, Record<AdminTranslationKey, string>> = { en, th };

export function parseAdminLocale(value: string | null | undefined): AdminLocale {
  return value === "th" ? "th" : ADMIN_DEFAULT_LOCALE;
}

export function parseAdminTheme(value: string | null | undefined): AdminTheme {
  return value === "light" ? "light" : ADMIN_DEFAULT_THEME;
}

export function serializeAdminPreferenceCookie(name: "admin_theme" | "admin_locale", value: AdminTheme | AdminLocale) {
  return `${name}=${value}; path=/admin; max-age=31536000; samesite=lax`;
}

export function translateAdmin(
  locale: AdminLocale,
  key: AdminTranslationKey,
  params: Record<string, string | number> = {},
): string {
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    adminDictionaries[locale][key],
  );
}

export function adminIntlLocale(locale: AdminLocale): string {
  return locale === "th" ? "th-TH" : "en-US";
}

export function formatAdminDate(
  value: Date | string | null | undefined,
  locale: AdminLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  if (value == null || value === "") return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(adminIntlLocale(locale), options).format(date);
}

export function formatAdminNumber(value: number, locale: AdminLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(adminIntlLocale(locale), options).format(value);
}

export function formatAdminCurrency(value: number, locale: AdminLocale) {
  return new Intl.NumberFormat(adminIntlLocale(locale), { style: "currency", currency: "THB" }).format(value);
}

export function translateAdminStatus(locale: AdminLocale, status: string): string {
  const key = `status.${status}` as AdminTranslationKey;
  return key in adminDictionaries[locale] ? adminDictionaries[locale][key] : status.replaceAll("_", " ");
}

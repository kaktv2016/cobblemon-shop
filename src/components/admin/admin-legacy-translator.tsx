"use client";

import { useLayoutEffect, type RefObject } from "react";
import type { AdminLocale } from "@/lib/admin-i18n";

const pairs: Array<[string, string]> = [
  ["Products", "สินค้า"], ["Categories", "หมวดหมู่"], ["Orders", "คำสั่งซื้อ"], ["Users", "ผู้ใช้"],
  ["Coupons", "คูปอง"], ["Content", "เนื้อหา"], ["Audit Log", "บันทึกกิจกรรม"], ["Settings", "ตั้งค่า"],
  ["Announcements", "ประกาศ"], ["Wiki Articles", "บทความวิกิ"], ["Wiki Categories", "หมวดหมู่วิกิ"],
  ["Delivery Queue", "คิวส่งสินค้า"], ["Delivery Logs", "ประวัติการส่งสินค้า"], ["General Settings", "ตั้งค่าทั่วไป"],
  ["Create Product", "สร้างสินค้า"], ["Edit Product", "แก้ไขสินค้า"], ["Create Category", "สร้างหมวดหมู่"],
  ["Edit Category", "แก้ไขหมวดหมู่"], ["Create Coupon", "สร้างคูปอง"], ["Edit Coupon", "แก้ไขคูปอง"],
  ["Create Wiki Article", "สร้างบทความวิกิ"], ["Edit Wiki Article", "แก้ไขบทความวิกิ"],
  ["Add a new product to your shop", "เพิ่มสินค้าใหม่ในร้าน"], ["Add a new product category", "เพิ่มหมวดหมู่สินค้าใหม่"],
  ["Add a new discount coupon", "เพิ่มคูปองส่วนลดใหม่"], ["Update product information", "อัปเดตข้อมูลสินค้า"],
  ["Update category information", "อัปเดตข้อมูลหมวดหมู่"], ["Update coupon details", "อัปเดตรายละเอียดคูปอง"],
  ["Basic Information", "ข้อมูลพื้นฐาน"], ["Description", "คำอธิบาย"], ["Images", "รูปภาพ"],
  ["Pricing", "ราคา"], ["Price", "ราคา"], ["Status & Visibility", "สถานะและการแสดงผล"],
  ["Category & Type", "หมวดหมู่และประเภท"], ["Bundle Items", "รายการในชุด"], ["In-game Delivery", "การส่งของในเกม"],
  ["Placeholder Reference", "ตัวอย่าง Placeholder"], ["No automatic delivery commands.", "ไม่มีคำสั่งส่งสินค้าอัตโนมัติ"],
  ["Commands run in order through RCON only after Stripe confirms payment.", "คำสั่งจะทำงานตามลำดับผ่าน RCON หลัง Stripe ยืนยันการชำระเงินเท่านั้น"],
  ["Create", "สร้าง"], ["Update", "อัปเดต"], ["Edit", "แก้ไข"], ["Delete", "ลบ"], ["Cancel", "ยกเลิก"],
  ["Save", "บันทึก"], ["Saving...", "กำลังบันทึก..."], ["Search", "ค้นหา"], ["Filter", "ตัวกรอง"],
  ["Export", "ส่งออก"], ["Actions", "การดำเนินการ"], ["Action", "การดำเนินการ"], ["Status", "สถานะ"],
  ["Active", "เปิดใช้งาน"], ["Inactive", "ไม่ใช้งาน"], ["Enabled", "เปิดใช้งาน"], ["Disabled", "ปิดใช้งาน"],
  ["Published", "เผยแพร่แล้ว"], ["Draft", "ฉบับร่าง"], ["Featured", "แนะนำ"], ["Sale", "ลดราคา"],
  ["Pending", "รอดำเนินการ"], ["Processing", "กำลังดำเนินการ"], ["Completed", "เสร็จสมบูรณ์"], ["Failed", "ล้มเหลว"],
  ["All", "ทั้งหมด"], ["All statuses", "ทุกสถานะ"], ["All categories", "ทุกหมวดหมู่"], ["All Actions", "ทุกการดำเนินการ"],
  ["Previous", "ก่อนหน้า"], ["Next", "ถัดไป"], ["Select a category", "เลือกหมวดหมู่"], ["Select category", "เลือกหมวดหมู่"],
  ["Select template", "เลือกเทมเพลต"], ["Select role...", "เลือกบทบาท..."], ["Date", "วันที่"], ["Last Updated", "อัปเดตล่าสุด"],
  ["All Statuses", "ทุกสถานะ"], ["Search by order #, player, email...", "ค้นหาด้วยเลขคำสั่งซื้อ ผู้เล่น หรืออีเมล..."],
  ["Search by job ID...", "ค้นหาด้วยรหัสงาน..."], ["Search title, slug, excerpt, or keywords", "ค้นหาหัวข้อ slug ข้อความย่อ หรือคำค้นหา"],
  ["Customer", "ลูกค้า"], ["Customer Info", "ข้อมูลลูกค้า"], ["Order", "คำสั่งซื้อ"], ["Order #", "เลขที่คำสั่งซื้อ"],
  ["Order Items", "รายการสินค้า"], ["Items", "รายการ"], ["Product", "สินค้า"], ["Category", "หมวดหมู่"],
  ["Amount", "จำนวนเงิน"], ["Subtotal", "ยอดก่อนส่วนลด"], ["Total", "ยอดรวม"], ["Currency", "สกุลเงิน"],
  ["Provider", "ผู้ให้บริการ"], ["Transaction ID", "รหัสธุรกรรม"], ["Job ID", "รหัสงาน"],
  ["Username", "ชื่อผู้ใช้"], ["Email", "อีเมล"], ["Joined", "วันที่สมัคร"], ["Profile", "โปรไฟล์"],
  ["Roles", "บทบาท"], ["Add Role", "เพิ่มบทบาท"], ["Assign Role", "กำหนดบทบาท"], ["Remove Role", "ลบบทบาท"],
  ["Admin Notes", "บันทึกผู้ดูแล"], ["Minecraft Account", "บัญชี Minecraft"], ["Minecraft Player", "ผู้เล่น Minecraft"],
  ["Not linked", "ยังไม่เชื่อมโยง"], ["Visible to players", "ผู้เล่นมองเห็น"], ["Featured article", "บทความแนะนำ"],
  ["Hidden", "ซ่อนอยู่"], ["Outdated", "ล้าสมัย"], ["UUID", "UUID"],
  ["Shop Name", "ชื่อร้าน"], ["Shop Description", "คำอธิบายร้าน"], ["Maintenance", "โหมดบำรุงรักษา"],
  ["Maintenance Mode", "โหมดบำรุงรักษา"], ["Configure the public shop and maintenance state.", "ตั้งค่าหน้าร้านและสถานะบำรุงรักษา"],
  ["Disables store, cart, checkout and commerce mutations.", "ปิดร้านค้า ตะกร้า การชำระเงิน และการแก้ไขข้อมูลการขาย"],
  ["Controlled by deployment environment and read-only here.", "ควบคุมโดย environment ของระบบและดูได้อย่างเดียวในหน้านี้"],
  ["Delivery Runtime", "ระบบส่งสินค้า"], ["Manage order deliveries", "จัดการการส่งสินค้าตามคำสั่งซื้อ"],
  ["Shop settings saved", "บันทึกการตั้งค่าร้านแล้ว"], ["Maintenance message shown to players", "ข้อความบำรุงรักษาที่แสดงแก่ผู้เล่น"],
  ["Start Date", "วันที่เริ่ม"], ["Expiry Date", "วันที่สิ้นสุด"], ["Limits & Timing", "ข้อจำกัดและช่วงเวลา"],
  ["Fixed Amount (THB)", "จำนวนคงที่ (บาท)"], ["Percentage (%)", "เปอร์เซ็นต์ (%)"], ["Amount Per Purchase Unit", "จำนวนต่อหน่วยการซื้อ"],
  ["No products found", "ไม่พบสินค้า"], ["No categories found", "ไม่พบหมวดหมู่"], ["No orders found", "ไม่พบคำสั่งซื้อ"],
  ["No users found", "ไม่พบผู้ใช้"], ["No coupons found", "ไม่พบคูปอง"], ["No jobs found", "ไม่พบงานส่งสินค้า"],
  ["No logs found", "ไม่พบบันทึก"], ["No audit logs found", "ไม่พบบันทึกกิจกรรม"], ["No announcements", "ยังไม่มีประกาศ"],
  ["No wiki articles found.", "ไม่พบบทความวิกิ"], ["No templates yet", "ยังไม่มีเทมเพลต"], ["No items added yet", "ยังไม่มีรายการ"],
  ["Coupon not found", "ไม่พบคูปอง"],
  ["Success", "สำเร็จ"], ["Warning", "คำเตือน"], ["Error:", "ข้อผิดพลาด:"], ["Info", "ข้อมูล"],
  ["Command:", "คำสั่ง:"], ["Response:", "ผลลัพธ์:"], ["Publishing", "การเผยแพร่"], ["Article identity", "ข้อมูลบทความ"],
  ["SEO", "SEO"], ["Loading", "กำลังโหลด"],
  ["ยอดขายรายเดือน", "Monthly sales"], ["ตารางรายเดือน", "Monthly table"], ["เดือน", "Month"], ["ยอดรวม", "Gross revenue"],
  ["รายได้สุทธิ", "Net revenue"], ["ออเดอร์", "Orders"], ["เฉลี่ย/ออเดอร์", "Average/order"], ["สัดส่วน", "Share"],
  ["รวม 12 เดือน", "12-month total"], ["ปัจจุบัน", "Current"], ["หักออกจากยอดขาย", "Deducted from revenue"],
  ["ย้อนหลัง 12 เดือน", "Last 12 months"], ["เดือนที่ดีที่สุด", "Best month"], ["เฉลี่ยสุทธิ / เดือน", "Average net / month"],
  ["Organize your products", "จัดระเบียบสินค้าของคุณ"], ["Organize products and their storefront order", "จัดหมวดหมู่สินค้าและลำดับที่แสดงในหน้าร้าน"],
  ["Add Product", "เพิ่มสินค้า"], ["Add Category", "เพิ่มหมวดหมู่"], ["Add Coupon", "เพิ่มคูปอง"], ["Add Announcement", "เพิ่มประกาศ"],
  ["Search products...", "ค้นหาสินค้า..."], ["Search orders...", "ค้นหาคำสั่งซื้อ..."], ["Search by email or username...", "ค้นหาด้วยอีเมลหรือชื่อผู้ใช้..."],
  ["All Roles", "ทุกบทบาท"], ["Admin", "ผู้ดูแลระบบ"], ["Moderator", "ผู้ดูแล"], ["User", "ผู้ใช้"],
  ["View/Edit", "ดู/แก้ไข"], ["Activate", "เปิดใช้งาน"], ["Deactivate", "ปิดใช้งาน"], ["No roles", "ไม่มีบทบาท"],
  ["Display Name", "ชื่อที่แสดง"], ["MC Account", "บัญชี MC"], ["Verified", "ยืนยันแล้ว"], ["Linked", "เชื่อมโยงแล้ว"],
  ["No roles assigned", "ยังไม่ได้กำหนดบทบาท"], ["No orders", "ไม่มีคำสั่งซื้อ"], ["User not found", "ไม่พบผู้ใช้"],
  ["Sort Order", "ลำดับการแสดง"], ["Category Name *", "ชื่อหมวดหมู่ *"], ["Slug *", "Slug *"],
  ["Lower numbers appear first in category lists and the storefront.", "เลขน้อยจะแสดงก่อนในรายการหมวดหมู่และหน้าร้าน"],
  ["Loading categories…", "กำลังโหลดหมวดหมู่…"], ["Unable to load categories", "โหลดหมวดหมู่ไม่สำเร็จ"],
  ["Retry", "ลองใหม่"], ["Save Changes", "บันทึกการเปลี่ยนแปลง"], ["Update Category", "อัปเดตหมวดหมู่"], ["Create Category", "สร้างหมวดหมู่"],
  ["Product Type *", "ประเภทสินค้า *"], ["Product Name *", "ชื่อสินค้า *"], ["Short Description", "คำอธิบายสั้น"],
  ["Enter product name", "กรอกชื่อสินค้า"], ["Brief description for listings", "คำอธิบายสั้นสำหรับหน้ารายการสินค้า"],
  ["Detailed product description", "คำอธิบายสินค้าแบบละเอียด"], ["Unlimited", "ไม่จำกัด"], ["Add a tag...", "เพิ่มแท็ก..."],
  ["Compare At Price", "ราคาเปรียบเทียบ"], ["Server Item / Rank Key", "ไอเทมหรือ Rank Key ในเซิร์ฟเวอร์"],
  ["Image URL", "URL รูปภาพ"], ["Banner URL", "URL แบนเนอร์"], ["Tags", "แท็ก"],
  ["Stock Limit", "จำกัดสต็อก"], ["Purchase Limit", "จำกัดจำนวนซื้อ"], ["Cooldown (minutes)", "คูลดาวน์ (นาที)"],
  ["Template", "เทมเพลต"], ["Custom Command", "คำสั่งกำหนดเอง"], ["Reusable template", "เทมเพลตใช้ซ้ำ"],
  ["Available placeholders:", "Placeholder ที่ใช้ได้:"], ["Preview", "ตัวอย่าง"], ["Drag to reorder", "ลากเพื่อเรียงลำดับ"],
  ["Order Number", "เลขที่คำสั่งซื้อ"], ["Payment Information", "ข้อมูลการชำระเงิน"], ["Price Breakdown", "สรุปราคา"],
  ["Add internal notes about this order...", "เพิ่มบันทึกภายในเกี่ยวกับคำสั่งซื้อนี้..."],
  ["Confirm Payment", "ยืนยันการชำระเงิน"], ["Queue Delivery", "เข้าคิวส่งสินค้า"], ["Retry Delivery", "ลองส่งอีกครั้ง"],
  ["View Logs", "ดูบันทึก"], ["Last Try", "ลองล่าสุด"], ["Attempts", "จำนวนครั้ง"], ["Sequence", "ลำดับ"],
  ["Wake Queue", "เรียกคิวทำงาน"], ["Requeue", "เข้าคิวใหม่"], ["Run selected", "รันรายการที่เลือก"],
  ["Title", "หัวข้อ"], ["Type", "ประเภท"], ["Content", "เนื้อหา"], ["End Date", "วันที่สิ้นสุด"],
  ["Article identity", "ข้อมูลบทความ"], ["Excerpt", "ข้อความย่อ"], ["Cover image", "ภาพปก"], ["Game version", "เวอร์ชันเกม"],
  ["SEO title", "หัวข้อ SEO"], ["SEO description", "คำอธิบาย SEO"], ["Search keywords", "คำค้นหา"],
  ["Optional metadata title", "หัวข้อ metadata (ไม่บังคับ)"], ["Optional metadata description", "คำอธิบาย metadata (ไม่บังคับ)"],
  ["Short summary for cards, search, and metadata.", "สรุปสั้นสำหรับการ์ด การค้นหา และ metadata"],
  ["Store description", "คำอธิบายร้าน"], ["Maintenance message", "ข้อความโหมดบำรุงรักษา"],
  ["Stripe PromptPay requires THB.", "Stripe PromptPay ต้องใช้สกุล THB"], ["Save Settings", "บันทึกการตั้งค่า"],
  ["Delivery Commands", "คำสั่งส่งสินค้า"], ["Delivery Templates", "เทมเพลตคำสั่งส่งสินค้า"], ["New Template", "เทมเพลตใหม่"],
  ["Template Name", "ชื่อเทมเพลต"], ["Command Template", "รูปแบบคำสั่ง"], ["Placeholder Reference", "รายการ Placeholder"],
  ["Created", "สร้างเมื่อ"], ["Target", "เป้าหมาย"], ["Details", "รายละเอียด"], ["User Email", "อีเมลผู้ใช้"],
  ["Date From", "ตั้งแต่วันที่"], ["Date To", "ถึงวันที่"], ["Export CSV", "ส่งออก CSV"],
  ["Loading...", "กำลังโหลด..."], ["Saving...", "กำลังบันทึก..."], ["Updating...", "กำลังอัปเดต..."],
  ["e.g., Cosmetics, Ranks", "เช่น Cosmetics, Ranks"], ["auto-generated", "สร้างอัตโนมัติ"],
  ["Category description", "คำอธิบายหมวดหมู่"], ["Why use this coupon? Limited time offer?", "รายละเอียดหรือเงื่อนไขของคูปอง"],
];

const translations = {
  th: new Map(pairs.map(([en, th]) => [en, th])),
  en: new Map(pairs.map(([en, th]) => [th, en])),
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const attributes = ["placeholder", "title", "aria-label"];

function translateDynamic(value: string, locale: AdminLocale): string {
  if (locale === "th") {
    const total = value.match(/^(\d+) total (orders|products|users|coupons|entries)$/i);
    if (total) {
      const nouns: Record<string, string> = { orders: "คำสั่งซื้อ", products: "สินค้า", users: "ผู้ใช้", coupons: "คูปอง", entries: "รายการ" };
      return `ทั้งหมด ${total[1]} ${nouns[total[2].toLowerCase()]}`;
    }
    const page = value.match(/^Page (\d+) of (\d+)$/i);
    if (page) return `หน้า ${page[1]} จาก ${page[2]}`;
    const items = value.match(/^(\d+) items?$/i);
    if (items) return `${items[1]} รายการ`;
  } else {
    const page = value.match(/^หน้า (\d+) จาก (\d+)$/);
    if (page) return `Page ${page[1]} of ${page[2]}`;
    const items = value.match(/^(\d+) รายการ$/);
    if (items) return `${items[1]} items`;
    const gross = value.match(/^ยอดขายรวม \((.+)\)$/);
    if (gross) return `Gross revenue (${gross[1]})`;
    const net = value.match(/^รายได้สุทธิ \((.+)\)$/);
    if (net) return `Net revenue (${net[1]})`;
    const orders = value.match(/^ออเดอร์ \((.+)\)$/);
    if (orders) return `Orders (${orders[1]})`;
  }
  return value;
}

export function translateAdminLegacyText(value: string, locale: AdminLocale): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;
  return `${leading}${translations[locale].get(core) ?? translateDynamic(core, locale)}${trailing}`;
}

function translateTree(root: ParentNode, locale: AdminLocale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    if (!text.parentElement?.closest("[data-admin-user-content]")) {
      if (!originalText.has(text)) originalText.set(text, text.nodeValue ?? "");
      const next = translateAdminLegacyText(originalText.get(text) ?? "", locale);
      if (text.nodeValue !== next) text.nodeValue = next;
    }
    node = walker.nextNode();
  }

  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) {
    if (element.closest("[data-admin-user-content]")) continue;
    let originals = originalAttributes.get(element);
    if (!originals) {
      originals = new Map();
      originalAttributes.set(element, originals);
    }
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (value == null) continue;
      if (!originals.has(attribute)) originals.set(attribute, value);
      element.setAttribute(attribute, translateAdminLegacyText(originals.get(attribute) ?? value, locale));
    }
  }
}

export function AdminLegacyTranslator({ locale, rootRef }: { locale: AdminLocale; rootRef: RefObject<HTMLElement | null> }) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    translateTree(root, locale);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          const text = mutation.target;
          const previous = originalText.get(text) ?? "";
          if ((text.nodeValue ?? "") !== translateAdminLegacyText(previous, locale)) {
            originalText.set(text, text.nodeValue ?? "");
            if (text.parentNode) translateTree(text.parentNode, locale);
          }
        }
        for (const node of mutation.addedNodes) {
          if (node instanceof Element || node instanceof Text) translateTree(node instanceof Text ? node.parentNode! : node, locale);
        }
      }
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, rootRef]);
  return null;
}

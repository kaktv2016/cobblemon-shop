import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const STORE_SETTINGS_ID = "default";
export const STORE_SETTINGS_TAG = "store-settings";

export const DEFAULT_STORE_SETTINGS = {
  id: STORE_SETTINGS_ID,
  shopName: "Cobblemon Divided",
  shopDescription: "The official Cobblemon webshop",
  currency: "THB",
  maintenanceMode: false,
  maintenanceMessage: "ร้านค้ากำลังปิดปรับปรุงชั่วคราว กรุณากลับมาใหม่ภายหลัง",
};

const getCachedStoreSettings = unstable_cache(
  async () => {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
    });
    return settings ?? DEFAULT_STORE_SETTINGS;
  },
  [STORE_SETTINGS_TAG],
  { tags: [STORE_SETTINGS_TAG], revalidate: 60 }
);

export async function getStoreSettings() {
  return getCachedStoreSettings();
}

export async function isCommerceMaintenanceMode() {
  const settings = await getStoreSettings();
  return settings.maintenanceMode;
}

export function getDeliveryConfigurationStatus() {
  const mode = (process.env.DELIVERY_MODE || "dry-run").toLowerCase();
  const rconConfigured = Boolean(
    process.env.RCON_HOST && process.env.RCON_PORT && process.env.RCON_PASSWORD
  );
  return { mode, rconConfigured };
}

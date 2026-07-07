export type StorePriceValue =
  | number
  | string
  | {
      toString(): string;
    }
  | null
  | undefined;

type StoreCategoryTheme = {
  label: string;
  eyebrow: string;
  description: string;
  accent: string;
  glow: string;
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  RANK: "แรงก์",
  SUBSCRIPTION: "สมาชิก",
  CURRENCY: "สกุลเงิน",
  COSMETIC: "ของตกแต่ง",
  CRATE_KEY: "กุญแจลัง",
  BUNDLE: "ชุดรวม",
  PERK: "สิทธิ์พิเศษ",
  BATTLE_PASS: "ซีซันพาส",
  LIMITED_OFFER: "ไอเทมหายาก",
  FREE_REWARD: "รางวัลฟรี",
};

const FALLBACK_THEME: StoreCategoryTheme = {
  label: "คลังปลดล็อก",
  eyebrow: "คัดสรรจากซีซันปัจจุบัน",
  description: "สิทธิ์และไอเทมที่ออกแบบมาเพื่อยกระดับประสบการณ์ของผู้เล่นในโลก Cobblemon Divided",
  accent: "from-indigo-500/30 via-cyan-400/10 to-transparent",
  glow:
    "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]",
};

const CATEGORY_THEMES: Record<string, StoreCategoryTheme> = {
  ranks: {
    label: "แรงก์",
    eyebrow: "เส้นทางเกียรติยศ",
    description: "แรงก์และสิทธิ์ประจำตัวสำหรับผู้เล่นที่อยากมีสถานะชัดเจนในเซิร์ฟเวอร์",
    accent: "from-indigo-500/34 via-cyan-400/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]",
  },
  cosmetics: {
    label: "ของตกแต่ง",
    eyebrow: "ภาพลักษณ์ของเทรนเนอร์",
    description: "ของปลดล็อกที่ช่วยให้ตัวตนของผู้เล่นเด่นขึ้นโดยไม่ลดทอนบรรยากาศของโลกเกม",
    accent: "from-fuchsia-500/28 via-rose-400/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.14),transparent_30%)]",
  },
  "crate-keys": {
    label: "กุญแจลัง",
    eyebrow: "ของรางวัลแบบคัดจังหวะ",
    description: "กุญแจและดรอปที่เหมาะกับผู้เล่นที่ชอบความตื่นเต้นของการเปิดรางวัลประจำซีซัน",
    accent: "from-amber-400/30 via-orange-300/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_30%)]",
  },
  currency: {
    label: "สกุลเงิน",
    eyebrow: "เสบียงสำหรับการผจญภัย",
    description: "ทรัพยากรในโลกเกมที่ช่วยให้คุณเลือกเส้นทางและปลดล็อกสิ่งที่ต้องการได้ยืดหยุ่นขึ้น",
    accent: "from-cyan-400/28 via-sky-300/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_30%)]",
  },
  "battle-pass": {
    label: "ซีซันพาส",
    eyebrow: "แทร็กความก้าวหน้าประจำฤดูกาล",
    description: "ปลดล็อกความคืบหน้า รางวัล และ milestone ของซีซันให้การเล่นมีจังหวะที่น่าติดตามมากขึ้น",
    accent: "from-violet-500/30 via-indigo-400/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_30%)]",
  },
  bundles: {
    label: "ชุดรวม",
    eyebrow: "ชุดจัดเต็มแบบคัดสรร",
    description: "แพ็กที่รวมไอเทมหลายชิ้นในธีมเดียวกัน เหมาะกับผู้เล่นที่อยากยกระดับตัวเองในครั้งเดียว",
    accent: "from-emerald-400/26 via-teal-300/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_30%)]",
  },
  perks: {
    label: "สิทธิ์พิเศษ",
    eyebrow: "สิทธิ์สำหรับผู้เล่นประจำ",
    description: "สิทธิ์เสริมที่ช่วยให้ชีวิตในเซิร์ฟเวอร์ลื่นไหลขึ้นโดยยังคงความพรีเมียมและสมดุล",
    accent: "from-sky-400/26 via-indigo-400/10 to-transparent",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_30%)]",
  },
};

export function formatStorePrice(value: StorePriceValue): string {
  const amount = Number(value ?? 0);
  const hasDecimals = amount % 1 !== 0;

  return `฿${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function formatStoreDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getProductTypeLabel(type?: string | null): string {
  if (!type) {
    return "สิทธิ์ปลดล็อก";
  }

  const normalized = type.toUpperCase();

  return PRODUCT_TYPE_LABELS[normalized] ?? type.replace(/_/g, " ").toLowerCase();
}

export function getCategoryTheme(
  slug?: string | null,
  fallbackLabel?: string | null
): StoreCategoryTheme {
  const theme = slug ? CATEGORY_THEMES[slug] : undefined;

  return {
    ...FALLBACK_THEME,
    ...theme,
    label: theme?.label ?? fallbackLabel ?? FALLBACK_THEME.label,
  };
}

export function getAvailabilityCopy({
  available,
  purchaseLimit,
  cooldownMinutes,
}: {
  available?: number | null;
  purchaseLimit?: number | null;
  cooldownMinutes?: number | null;
}): string {
  if (typeof available === "number") {
    if (available <= 0) {
      return "รอบนี้ถูกจองครบแล้ว";
    }

    if (available <= 5) {
      return `เหลืออีก ${available} ชิ้นในรอบนี้`;
    }

    return `ยังเปิดรับอีก ${available} ชิ้น`;
  }

  if (purchaseLimit) {
    return `จำกัด ${purchaseLimit} ชิ้นต่อผู้เล่น`;
  }

  if (cooldownMinutes) {
    return `สั่งซ้ำได้ทุก ${cooldownMinutes} นาที`;
  }

  return "พร้อมปลดล็อกให้บัญชีที่เชื่อมไว้";
}

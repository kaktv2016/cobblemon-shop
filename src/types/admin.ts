// Admin-specific types
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

export interface ProductFormData {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  type: 'cosmetic' | 'rank' | 'bundle' | 'battle-pass' | 'utility';
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  bannerUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  visibility: 'visible' | 'hidden' | 'draft';
  stockLimit?: number;
  purchaseLimit?: number;
  cooldownMinutes?: number;
  startDate?: string;
  endDate?: string;
  deliveryTemplateId?: string;
  tags: string[];
  metadata?: Record<string, any>;
  bundleItems?: Array<{ productId: string; quantity: number }>;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface CouponFormData {
  code: string;
  description: string;
  type: 'fixed' | 'percentage';
  value: number;
  maxUses: number;
  perUserLimit: number;
  minCartValue: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
}

export interface DeliveryTemplate {
  id: string;
  name: string;
  command: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  productId: string;
  playerUsername: string;
  command: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLog {
  id: string;
  jobId: string;
  orderId: string;
  attempt: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  command: string;
  response?: string;
  error?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'banner' | 'popup' | 'inline';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  type: 'hero' | 'featured-products' | 'categories' | 'promotions' | 'custom-html';
  sortOrder: number;
  isActive: boolean;
  content?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  target: string;
  targetId: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ShopSettings {
  shopName: string;
  shopDescription: string;
  currency: string;
  deliveryMode: 'dry-run' | 'webhook' | 'rcon';
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

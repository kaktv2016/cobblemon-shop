// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image: string;
  images?: string[];
  badge?: 'SALE' | 'LIMITED' | 'NEW';
  stock?: number;
  type: 'cosmetic' | 'rank' | 'bundle' | 'battle-pass' | 'utility';
  isFeatured?: boolean;
  isLimited?: boolean;
  limitedStock?: number;
  endsAt?: string; // ISO date for time-limited items
  bundleItems?: string[]; // Product IDs included in bundle
  relatedProducts?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  productCount: number;
}

// Cart Types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon?: {
    code: string;
    discountAmount: number;
    discountPercentage?: number;
  };
}

// Order Types
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  minecraftAccount: string;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
}

// User Types
export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  minecraftUUID?: string;
  minecraftUsername?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Coupon Types
export interface Coupon {
  code: string;
  discountAmount?: number;
  discountPercentage?: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  minPurchaseAmount: number;
  description: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

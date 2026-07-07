# Service Layer Quick Reference

## Service Overview

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **ProductService** | Products catalog | listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, checkProductAvailability |
| **CategoryService** | Product categories | listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory |
| **CartService** | Shopping cart | getCart, addToCart, updateCartItem, removeFromCart, clearCart |
| **OrderService** | Order management | createOrder, getOrderById, getOrderByNumber, updateOrderStatus, getOrderStats |
| **CouponService** | Discount codes | validateCoupon, applyCoupon, createCoupon, updateCoupon, listCoupons |
| **DeliveryService** | Minecraft delivery | createDeliveryJobs, processDeliveryJob, retryFailedJob, processQueue |
| **ContentService** | Website content | getAnnouncements, getHomepageSections, getSupportArticles |
| **AuditService** | Activity logging | logAction, getAuditLogs, cleanupOldLogs, exportLogs |
| **UserService** | User management | createUser, getUserById, updateUser, linkMinecraftAccount |

## Common Operations

### Create an Order
```typescript
const order = await OrderService.createOrder({
  userId: "user-id",
  cartItems: [{ productId: "prod-1", quantity: 2 }],
  couponCode: "SAVE10",
  playerName: "PlayerName",
  playerUuid: "uuid-string",
});
```

### Check Coupon Validity
```typescript
const { valid, discountAmount, reason } = await CouponService.validateCoupon(
  "COUPON_CODE",
  cartItems,
  userId
);
```

### Process Delivery Job
```typescript
const result = await DeliveryService.processDeliveryJob(jobId, deliveryAdapter);
```

### List Products with Filters
```typescript
const { data, total, pages } = await ProductService.listProducts(
  { categorySlug: "skins", search: "dragon" },
  page,
  limit,
  "price:asc"
);
```

### Add to Cart
```typescript
const cartItem = await CartService.addToCart(userId, productId, quantity);
```

### Get Cart with Totals
```typescript
const { items, subtotal, tax, total } = await CartService.getCart(userId);
```

## Error Handling Pattern

```typescript
try {
  await service.method(args);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Return appropriate HTTP error response
  }
}
```

## Order Status Transitions

```
PENDING_PAYMENT ─→ PAID ─────────→ QUEUED_DELIVERY ─→ DELIVERED
                   │                      │
                   ├─→ CANCELED           ├─→ PARTIALLY_DELIVERED ─→ DELIVERED
                   │                      │
                   └─→ REFUNDED    ┌──────┴─→ FAILED_DELIVERY
                                   │
                                   └─→ QUEUED_DELIVERY (retry)
```

## Types Exports

```typescript
// Product
import type { CreateProductInput, UpdateProductInput } from "@/lib/services";

// Cart
import type { CartItem, CartSummary } from "@/lib/services";

// Order
import type { CreateOrderInput, OrderDTO } from "@/lib/services";

// Coupon
import type { CreateCouponInput, ValidateCouponResult } from "@/lib/services";

// Content
import type {
  CreateAnnouncementInput,
  CreateHomepageSectionInput,
  CreateSupportArticleInput,
} from "@/lib/services";
```

## Validation Schemas (Used Internally)

All services use Zod for validation:
- ProductService: createProductSchema, updateProductSchema
- CategoryService: createCategorySchema, updateCategorySchema
- CouponService: createCouponSchema, updateCouponSchema
- ContentService: createAnnouncementSchema, createHomepageSectionSchema, etc.

## Critical Methods (Enterprise-Critical)

### OrderService.createOrder
- Server-side total recomputation
- Coupon application and validation
- Stock reservation via transaction
- Cart clearing
- Order number generation

### DeliveryService.processDeliveryJob
- Idempotency checking
- Retry logic with exponential backoff
- Comprehensive logging
- Order status auto-updates

### CartService.computeCartTotals
- ALWAYS called server-side
- Never trusts client totals
- Decimal precision for money

### CouponService.validateCoupon
- Date range validation
- Per-user usage tracking
- Product/category restrictions
- Min cart value checking

## Database Integration

All services use Prisma:
```typescript
import { prisma } from "@/lib/prisma";
```

The Prisma client is a singleton:
- In development: uses global variable to prevent hot-reload issues
- In production: single instance created at module initialization
- Logging enabled in development (query, error, warn)

## Pagination Pattern

Most list methods return:
```typescript
{
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

## Money Handling

All monetary values use Prisma Decimal:
```typescript
import { Prisma } from "@prisma/client";

const price = new Prisma.Decimal("19.99");
const total = price.times(2).toDecimalPlaces(2);
```

## Delivery Template Rendering

Safe template substitution with whitelisted variables:
```
Template: "give {playerName} pokemon_item {quantity}"
Variables: { playerName: "John", quantity: 1 }
Result: "give John pokemon_item 1"
```

Allowed variables:
- playerName
- playerUuid
- itemName
- quantity
- orderId

## Performance Tips

1. Use pagination for large result sets
2. Filter before counting for better performance
3. Include only needed fields in queries
4. Batch delivery jobs processing
5. Use database indexes on frequently filtered fields (email, username, slug)

## Import Pattern

```typescript
// Import all services
import {
  ProductService,
  CartService,
  OrderService,
  CouponService,
  DeliveryService,
} from "@/lib/services";

// Or import specific types
import type { OrderDTO } from "@/lib/services";
```

## Testing Pattern

```typescript
describe("OrderService", () => {
  it("should create order with valid data", async () => {
    const order = await OrderService.createOrder({
      userId: "test-user",
      cartItems: [{ productId: "test-prod", quantity: 1 }],
    });
    expect(order.status).toBe("PENDING_PAYMENT");
  });

  it("should reject invalid state transition", async () => {
    await expect(
      OrderService.updateOrderStatus(orderId, "INVALID_STATUS")
    ).rejects.toThrow();
  });
});
```

## Production Deployment Checklist

- [ ] Environment: NODE_ENV=production
- [ ] Database: Verified connection and migrations
- [ ] Delivery: DeliveryAdapter implemented for your server
- [ ] Monitoring: Logging and error tracking configured
- [ ] Backups: Automated database backups enabled
- [ ] Tests: All state transitions tested
- [ ] API: Rate limiting configured
- [ ] Security: HTTPS enabled, auth configured

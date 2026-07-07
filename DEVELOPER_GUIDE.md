# Developer Guide: Service Layer

## Getting Started

### 1. Understand the Architecture

The application uses a layered architecture:
- **API Routes** (`pages/api/`) - HTTP endpoints
- **Services** (`src/lib/services/`) - Business logic
- **Prisma** (`prisma/schema.prisma`) - Data layer
- **Types** (`src/types/`) - Type definitions

### 2. Database Setup

Ensure your Prisma schema includes all required models. Run migrations:

```bash
npx prisma migrate dev
```

### 3. Importing Services

```typescript
// Single service import
import { ProductService } from "@/lib/services";

// Multiple services
import {
  ProductService,
  CartService,
  OrderService,
  DeliveryService,
} from "@/lib/services";

// With types
import type { OrderDTO } from "@/lib/services";
```

## API Endpoint Pattern

### Example: Create Order Endpoint

```typescript
// pages/api/orders/create.ts
import { OrderService } from "@/lib/services";
import { getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validate method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check authentication
  const session = await getServerSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Call service with user context
    const order = await OrderService.createOrder({
      userId: session.user.id,
      cartItems: req.body.cartItems,
      couponCode: req.body.couponCode,
      playerName: req.body.playerName,
      playerUuid: req.body.playerUuid,
    });

    // Return success response
    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    // Return error response
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
```

## Common Patterns

### 1. Fetching with Filtering

```typescript
// Get featured products
const featured = await ProductService.getFeaturedProducts(10);

// Get products by category
const categoryProducts = await ProductService.getProductsByCategory(
  "skins",
  1,
  20
);

// Advanced filtering
const filtered = await ProductService.listProducts(
  {
    categorySlug: "cosmetics",
    search: "dragon",
    isFeatured: true,
    visibility: "PUBLIC",
  },
  1,
  50,
  "price:asc"
);
```

### 2. Cart Operations

```typescript
// Get cart with totals (always server-side)
const cart = await CartService.getCart(userId);
console.log(`Subtotal: $${cart.subtotal}`);
console.log(`Tax: $${cart.tax}`);
console.log(`Total: $${cart.total}`);

// Add to cart with validation
try {
  await CartService.addToCart(userId, productId, quantity);
} catch (error) {
  // "Insufficient stock. Available: 5, Requested: 10"
  console.error(error.message);
}

// Update quantity
await CartService.updateCartItem(userId, productId, newQuantity);

// Remove item
await CartService.removeFromCart(userId, productId);

// Clear entire cart
await CartService.clearCart(userId);
```

### 3. Order Management

```typescript
// Create order
const order = await OrderService.createOrder({
  userId,
  cartItems: [{ productId: "prod-1", quantity: 2 }],
  couponCode: "SUMMER20",
  playerName: "PlayerName",
  playerUuid: "uuid-string",
});

// Get order details
const orderDetails = await OrderService.getOrderById(orderId);
console.log(`Status: ${orderDetails.status}`);
console.log(`Items: ${orderDetails.items.length}`);

// Update order status (with state transition validation)
try {
  await OrderService.updateOrderStatus(orderId, "PAID");
} catch (error) {
  // "Invalid status transition: PENDING_PAYMENT -> INVALID_STATUS"
  console.error(error.message);
}

// List user's orders
const userOrders = await OrderService.getOrdersByUser(userId, 1, 10);

// Get statistics
const stats = await OrderService.getOrderStats();
console.log(`Total revenue: $${stats.totalRevenue}`);
console.log(`Orders by status:`, stats.byStatus);
```

### 4. Coupon Validation

```typescript
// Validate before applying
const validation = await CouponService.validateCoupon(
  "SAVE10",
  cartItems,
  userId
);

if (validation.valid) {
  console.log(`Discount: $${validation.discountAmount}`);
  // Proceed with order
} else {
  console.log(`Invalid: ${validation.reason}`);
  // Show error to user
}

// Create coupon (admin)
const coupon = await CouponService.createCoupon({
  code: "SUMMER20",
  discountType: "PERCENTAGE",
  discountValue: 20,
  minCartValue: 50,
  maxUses: 100,
  maxUsesPerUser: 1,
  startsAt: new Date("2024-06-01"),
  expiresAt: new Date("2024-08-31"),
  isActive: true,
  applicableCategoryIds: ["cosmetics", "gameplay"],
});
```

### 5. Delivery Processing

```typescript
// After order is PAID, create delivery jobs
await DeliveryService.createDeliveryJobs(orderId);

// Process a job (requires DeliveryAdapter)
import { RconDeliveryAdapter } from "@/adapters/delivery/rcon";
const adapter = new RconDeliveryAdapter({
  host: process.env.MINECRAFT_SERVER_IP,
  port: parseInt(process.env.MINECRAFT_RCON_PORT || "25575"),
  password: process.env.MINECRAFT_RCON_PASSWORD,
});

const result = await DeliveryService.processDeliveryJob(jobId, adapter);
if (result.success) {
  console.log("Item delivered successfully");
} else {
  console.log(`Failed: ${result.message}`);
}

// Batch process queue (run in background job)
const stats = await DeliveryService.processQueue(adapter, 50);
console.log(`Processed: ${stats.processed}, Succeeded: ${stats.succeeded}`);

// Get queue status
const queue = await DeliveryService.getDeliveryQueue("PENDING", 1, 100);
console.log(`${queue.total} pending deliveries`);

// View attempt history
const logs = await DeliveryService.getDeliveryLogs(jobId, 1, 50);
logs.data.forEach((log) => {
  console.log(`Attempt ${log.attempt}: ${log.status} - ${log.message}`);
});
```

## Error Handling Best Practices

### 1. Specific Error Messages

```typescript
try {
  await ProductService.createProduct(data);
} catch (error) {
  if (error instanceof Error) {
    // Handle specific error message
    if (error.message.includes("already exists")) {
      // Show "This product already exists" to user
    }
  }
}
```

### 2. Validation Errors

```typescript
try {
  await OrderService.createOrder(data);
} catch (error) {
  // Possible errors:
  // "Cart cannot be empty"
  // "Product \"id\" not found"
  // "Insufficient stock for product \"id\""
  // "Product \"id\" is no longer available"
  const userMessage =
    error instanceof Error ? error.message : "Order creation failed";
  return res.status(400).json({ error: userMessage });
}
```

### 3. Async Error Handling in Routes

```typescript
try {
  const result = await service.method();
  res.json(result);
} catch (error) {
  console.error("Detailed error:", error);

  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  const statusCode = message.includes("not found") ? 404 : 400;

  res.status(statusCode).json({ error: message });
}
```

## Testing

### Unit Test Example

```typescript
import { OrderService } from "@/lib/services";
import { prisma } from "@/lib/prisma";

describe("OrderService", () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
  });

  it("should create order with valid data", async () => {
    const order = await OrderService.createOrder({
      userId: "test-user-1",
      cartItems: [{ productId: "test-product-1", quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
  });

  it("should reject invalid state transition", async () => {
    const order = await OrderService.createOrder({
      userId: "test-user-1",
      cartItems: [{ productId: "test-product-1", quantity: 1 }],
    });

    await expect(
      OrderService.updateOrderStatus(order.id, "DELIVERED")
    ).rejects.toThrow("Invalid status transition");
  });

  it("should validate coupon before applying", async () => {
    const validation = await CouponService.validateCoupon(
      "INVALID_CODE",
      [{ productId: "test-product-1", quantity: 1 }],
      "test-user-1"
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("Coupon code not found");
  });
});
```

## Debugging

### 1. Enable Prisma Logging

```typescript
// In development, Prisma logs queries automatically
// For production debugging, use:
const client = new PrismaClient({
  log: ["query", "error", "warn"],
});
```

### 2. Debug Service Calls

```typescript
try {
  const result = await OrderService.createOrder(input);
  console.log("Order created:", result);
} catch (error) {
  console.error("Service error:", error);
  if (error instanceof Error) {
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}
```

### 3. Check State Transitions

```typescript
// View current status
const order = await OrderService.getOrderById(orderId);
console.log(`Current status: ${order.status}`);

// Try transition
const validTransitions = {
  PENDING_PAYMENT: ["PAID", "CANCELED"],
  PAID: ["QUEUED_DELIVERY", "REFUNDED"],
  // ... etc
};
console.log(
  `Valid next states: ${validTransitions[order.status].join(", ")}`
);
```

## Performance Optimization

### 1. Use Pagination for Large Sets

```typescript
// Bad: Fetches all products
const allProducts = await prisma.product.findMany();

// Good: Paginated
const page1 = await ProductService.listProducts({}, 1, 50);
const page2 = await ProductService.listProducts({}, 2, 50);
```

### 2. Filter Before Counting

```typescript
// Service already does this:
const [products, total] = await Promise.all([
  prisma.product.findMany({ where, skip, take }),
  prisma.product.count({ where }), // Same filters!
]);
```

### 3. Batch Delivery Processing

```typescript
// Process queue in batches instead of individually
const stats = await DeliveryService.processQueue(adapter, 100);
```

## Production Deployment

### 1. Environment Configuration

```bash
# .env.production
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="production"
MINECRAFT_SERVER_IP="your-server-ip"
MINECRAFT_RCON_PASSWORD="rcon-password"
```

### 2. Database Migrations

```bash
# Run before deployment
npx prisma migrate deploy
```

### 3. Monitoring

```typescript
// Log all critical operations
import { AuditService } from "@/lib/services";

await AuditService.logAction(
  userId,
  userEmail,
  "CREATE_ORDER",
  "ORDER",
  orderId,
  { total, items: cartItems.length }
);
```

### 4. Error Tracking

```typescript
// Integrate with error tracking (Sentry, etc.)
try {
  await service.method();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## Support & Resources

- Service documentation: `src/lib/services/README.md`
- Quick reference: `src/lib/services/QUICK_REFERENCE.md`
- Implementation guide: `SERVICES_IMPLEMENTATION.md`
- Prisma docs: https://www.prisma.io/docs/
- Next.js docs: https://nextjs.org/docs

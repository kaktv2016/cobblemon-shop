# Service Layer Documentation

This directory contains the business logic layer for the Cobblemon Webshop. All services follow strict TypeScript patterns and handle server-side computation for security and consistency.

## Services Overview

### ProductService
Manages all product-related operations.

**Key Methods:**
- `listProducts(filters, page, limit, sort)` - List products with filtering, pagination, sorting
- `getProductBySlug(slug)` - Get product by slug with category and tags
- `getProductById(id)` - Get product by ID
- `createProduct(data)` - Create product with Zod validation
- `updateProduct(id, data)` - Update product with validation
- `deleteProduct(id)` - Soft delete (sets isActive to false)
- `getFeaturedProducts(limit)` - Get featured products
- `getProductsByCategory(categorySlug, page, limit)` - Get products by category
- `checkProductAvailability(productId, quantity)` - Check stock and visibility

**Security:**
- Input validation with Zod schemas
- Slug uniqueness checks
- Category existence validation
- Stock availability verification

### CategoryService
Manages product categories.

**Key Methods:**
- `listCategories(includeInactive)` - List all categories
- `getCategoryBySlug(slug)` - Get category with product count
- `getCategoryById(id)` - Get category by ID
- `createCategory(data)` - Create category with validation
- `updateCategory(id, data)` - Update category
- `deleteCategory(id)` - Delete only if no products exist

**Security:**
- Slug uniqueness validation
- Prevents deletion of categories with products

### CartService
Manages shopping cart operations with server-side total computation.

**Key Methods:**
- `getCart(userId)` - Get cart with computed totals
- `addToCart(userId, productId, quantity)` - Add item with availability check
- `updateCartItem(userId, productId, quantity)` - Update quantity
- `removeFromCart(userId, productId)` - Remove item
- `clearCart(userId)` - Clear entire cart
- `computeCartTotals(items)` - Compute totals from DB prices (NEVER TRUST CLIENT)

**Security:**
- Product availability validation
- Stock checking
- Server-side total computation
- Prevents adding unavailable/private products

**Critical:** All monetary totals are computed from database prices. Client values are never trusted.

### OrderService
Critical service handling order creation and management.

**Key Methods:**
- `createOrder(input)` - Create order with:
  - Server-side total recomputation from DB prices
  - Coupon validation and application
  - Unique order number generation
  - Cart clearing
  - Stock reservation
- `getOrderById(id)` - Get order with items and payment info
- `getOrderByNumber(orderNumber)` - Get order by order number
- `getOrdersByUser(userId, page, limit)` - Get user's orders
- `updateOrderStatus(orderId, newStatus)` - Update with state transition validation
- `listOrders(filters, page, limit)` - Admin order listing
- `getOrderStats()` - Order statistics

**State Transitions (Strict Validation):**
```
PENDING_PAYMENT → [PAID, CANCELED]
PAID → [QUEUED_DELIVERY, REFUNDED]
QUEUED_DELIVERY → [DELIVERED, PARTIALLY_DELIVERED, FAILED_DELIVERY]
DELIVERED → []
FAILED_DELIVERY → [QUEUED_DELIVERY, REFUNDED]
PARTIALLY_DELIVERED → [DELIVERED, FAILED_DELIVERY]
CANCELED → []
REFUNDED → []
```

**Security:**
- Server-side total recomputation from DB prices
- Coupon server-side validation
- Unique order number generation
- Stock reservation in transaction
- Strict state transition validation

### CouponService
Manages promotional coupons with comprehensive validation.

**Key Methods:**
- `validateCoupon(code, cartItems, userId)` - Comprehensive validation:
  - Code existence and active status
  - Date range validation (startsAt, expiresAt)
  - Global usage limit (maxUses)
  - Per-user usage limit (maxUsesPerUser)
  - Minimum cart value check
  - Product/category applicability
  - Discount calculation (FIXED or PERCENTAGE)
- `applyCoupon(code, orderId)` - Increment usage count
- `createCoupon(data)` - Create coupon with validation
- `updateCoupon(id, data)` - Update coupon
- `listCoupons(page, limit)` - List coupons
- `getCouponById(id)` - Get coupon details

**Features:**
- FIXED and PERCENTAGE discount types
- Product and category restrictions
- Per-user usage limits
- Date-based availability
- Server-side validation

**Security:**
- All validation happens server-side
- Prevents discount exceeding cart value
- User-specific usage tracking
- Idempotent discount application

### DeliveryService
Critical for Minecraft integration and item delivery.

**Key Methods:**
- `createDeliveryJobs(orderId)` - Create jobs for each order item:
  - Fetches delivery template for product
  - Renders command with safe template substitution
  - Generates idempotency key
  - Sets PENDING status
- `processDeliveryJob(jobId, adapter)` - Process job with:
  - Idempotency checking
  - Attempt tracking
  - Error handling and retry logic
  - Exponential backoff retry strategy
  - Delivery logging
- `retryFailedJob(jobId)` - Retry failed jobs
- `getDeliveryQueue(status, page, limit)` - Get delivery queue
- `getDeliveryLogs(jobId, page, limit)` - Get job logs
- `processQueue(adapter, batchSize)` - Batch process pending jobs
- `getDeliveryStats()` - Delivery statistics

**Minecraft Integration:**
- Safe command template rendering
- Variable substitution with whitelist
- Idempotency keys prevent duplicate delivery
- Support for custom DeliveryAdapter implementations

**Retry Strategy:**
- Exponential backoff: 5min, 15min, 60min, etc.
- Configurable max retries
- Comprehensive logging
- Automatic order status updates

**Security:**
- Safe template rendering (whitelist variables)
- Idempotency prevents duplicate item delivery
- Comprehensive logging for audit trail
- Adapter pattern for flexibility

### ContentService
Manages website content: announcements, homepage sections, support articles.

**Key Methods:**

**Announcements:**
- `getAnnouncements(activeOnly)` - Get announcements with date filtering
- `createAnnouncement(data)` - Create announcement
- `updateAnnouncement(id, data)` - Update announcement

**Homepage Sections:**
- `getHomepageSections(activeOnly)` - Get active sections ordered
- `createHomepageSection(data)` - Create section
- `updateHomepageSection(id, data)` - Update section
- `reorderHomepageSections(ids)` - Reorder sections

**Support Articles:**
- `getSupportArticles(published)` - Get articles
- `getSupportArticleBySlug(slug)` - Get article by slug
- `getSupportArticleById(id)` - Get article by ID
- `createSupportArticle(data)` - Create article
- `updateSupportArticle(id, data)` - Update article

**Features:**
- Date-based announcement visibility
- Flexible homepage section content
- Article slug uniqueness
- Publication status control

## Usage Examples

### Creating an Order
```typescript
import { OrderService } from "@/lib/services";

const order = await OrderService.createOrder({
  userId: "user-123",
  cartItems: [
    { productId: "prod-1", quantity: 2 },
    { productId: "prod-2", quantity: 1 },
  ],
  couponCode: "SAVE10",
  playerName: "MinecraftPlayer",
  playerUuid: "550e8400-e29b-41d4-a716-446655440000",
});

console.log(`Order created: ${order.orderNumber}`);
console.log(`Total: ${order.total}`);
```

### Validating a Coupon
```typescript
import { CouponService } from "@/lib/services";

const result = await CouponService.validateCoupon(
  "SAVE10",
  [{ productId: "prod-1", quantity: 2 }],
  "user-123"
);

if (result.valid) {
  console.log(`Discount: ${result.discountAmount}`);
} else {
  console.log(`Invalid: ${result.reason}`);
}
```

### Processing Delivery
```typescript
import { DeliveryService } from "@/lib/services";
import { MyDeliveryAdapter } from "@/adapters/delivery";

const adapter = new MyDeliveryAdapter();

// Create delivery jobs for order
await DeliveryService.createDeliveryJobs("order-123");

// Process a single job
const result = await DeliveryService.processDeliveryJob("job-456", adapter);

// Process entire queue
const stats = await DeliveryService.processQueue(adapter, 50);
console.log(`Processed: ${stats.processed}, Success: ${stats.succeeded}`);
```

## Design Principles

1. **Server-Side Computation**: All monetary calculations, validations, and state changes happen on the server
2. **Never Trust Client**: Product prices, totals, and availability are always recalculated from the database
3. **Strict Validation**: Input validation with Zod schemas for all user inputs
4. **Transaction Safety**: Multi-step operations use database transactions for consistency
5. **Clear Error Messages**: Descriptive error messages for debugging and user feedback
6. **Audit Trail**: Delivery logging and operation history for transparency
7. **Idempotency**: Delivery operations are idempotent to prevent duplicates

## Error Handling

All services throw descriptive errors:

```typescript
try {
  await ProductService.createProduct({ /* invalid data */ });
} catch (error) {
  console.error(error.message); // "Product with slug "xyz" already exists"
}
```

## Database Dependencies

Services use Prisma ORM. Ensure the following models exist in your schema:
- Product
- Category
- CartItem
- Order
- OrderItem
- Payment
- Coupon
- DeliveryJob
- DeliveryLog
- Announcement
- HomepageSection
- SupportArticle

## Production Considerations

1. **Rate Limiting**: Implement rate limiting on API endpoints using these services
2. **Logging**: Add structured logging to track all operations
3. **Monitoring**: Monitor delivery queue processing and error rates
4. **Backups**: Ensure regular database backups, especially before order processing
5. **Testing**: Write comprehensive tests covering all state transitions and edge cases
6. **API Keys**: Protect sensitive endpoints (admin operations) with proper authentication

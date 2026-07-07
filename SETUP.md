# CobbleMart — Setup & Deployment Guide

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- PostgreSQL 14+ running and accessible
- npm or pnpm package manager
- Git

## Quick Start (Development)

```bash
# 1. Clone and install
cd cobblemon-shop
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets (see below)

# 3. Set up database
npx prisma db push        # Create tables from schema
npx prisma db seed         # Seed demo data

# 4. Run development server
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# REQUIRED — PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/cobblemart?schema=public"

# REQUIRED — NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Payment Provider (use sandbox for development)
PAYMENT_PROVIDER="sandbox"
PAYMENT_PROVIDER_KEY=""
PAYMENT_PROVIDER_SECRET=""
PAYMENT_WEBHOOK_SECRET="webhook-secret-for-hmac"

# Delivery Mode: dry-run | webhook | rcon
DELIVERY_MODE="dry-run"

# Webhook delivery (if DELIVERY_MODE=webhook)
WEBHOOK_DELIVERY_URL="https://your-server.com/api/deliver"

# RCON delivery (if DELIVERY_MODE=rcon)
RCON_HOST="localhost"
RCON_PORT="25575"
RCON_PASSWORD=""

# Seed defaults (used during db:seed)
ADMIN_EMAIL="admin@cobblemart.com"
ADMIN_PASSWORD="admin123456"
```

## Database Setup

### Create Database

```sql
CREATE DATABASE cobblemart;
CREATE USER cobblemart_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE cobblemart TO cobblemart_user;
```

### Run Migrations

```bash
# Development: push schema directly
npx prisma db push

# Production: use migrations
npx prisma migrate dev --name init    # Generate migration
npx prisma migrate deploy             # Apply in production
```

### Seed Demo Data

```bash
npx prisma db seed
```

This creates:
- Admin account: `admin@cobblemart.com` / `admin123456`
- Demo player: `player@example.com` / `player123456`
- 7 categories (Ranks, Cosmetics, Crate Keys, Currency, Battle Pass, Bundles, Perks)
- 16 products across all categories
- 6 delivery templates
- 2 coupons (WELCOME10, COBBLEFAN50)
- Homepage sections and announcements
- Support articles
- Season 1 campaign

### Inspect Database

```bash
npx prisma studio   # Opens visual database browser at localhost:5555
```

## Demo Credentials

| Role   | Email                   | Password      |
|--------|-------------------------|---------------|
| Admin  | admin@cobblemart.com    | admin123456   |
| Player | player@example.com      | player123456  |

**Important:** Change these passwords before deploying to production.

## Project Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Architecture Overview

```
cobblemon-shop/
├── prisma/                    # Database schema & seed
├── src/
│   ├── app/
│   │   ├── (store)/           # Player-facing pages
│   │   ├── (auth)/            # Login/Register
│   │   ├── admin/             # Admin backoffice
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives
│   │   ├── store/             # Store-specific components
│   │   ├── admin/             # Admin-specific components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── services/          # Business logic layer
│   │   ├── delivery/          # Delivery adapter system
│   │   ├── payment/           # Payment provider abstraction
│   │   ├── validators/        # Zod validation schemas
│   │   └── utils/             # Utility functions
│   └── types/                 # TypeScript type definitions
└── public/                    # Static assets
```

### Key Architecture Decisions

- **Service Layer Pattern**: All business logic lives in `/lib/services/`. API routes are thin wrappers.
- **Server-Side Totals**: Cart totals and order totals are ALWAYS computed server-side. Client values are never trusted.
- **Delivery Adapters**: Pluggable adapter pattern with DryRun, Webhook, and RCON implementations.
- **Payment Providers**: Abstract interface with Sandbox (dev) and Stripe (prod scaffold) providers.
- **Idempotent Delivery**: Every delivery job has a unique idempotency key preventing duplicate delivery.
- **State Machine Orders**: Order status transitions are validated against an explicit transition map.
- **Template-Based Commands**: Delivery commands use safe placeholder substitution — no arbitrary command execution.
- **Audit Trail**: Every admin mutation is logged to the audit_logs table.

## Payment Integration

### Sandbox Mode (Default)

The sandbox payment provider simulates the payment flow without real money:
1. Checkout creates a payment intent
2. User is redirected to a sandbox callback URL
3. Payment is auto-confirmed
4. Delivery jobs are created and processed

### Stripe Integration (Production)

To integrate Stripe:

1. Install the Stripe SDK: `npm install stripe`
2. Set environment variables:
   ```env
   PAYMENT_PROVIDER="stripe"
   PAYMENT_PROVIDER_KEY="pk_live_..."
   PAYMENT_PROVIDER_SECRET="sk_live_..."
   PAYMENT_WEBHOOK_SECRET="whsec_..."
   ```
3. Complete the scaffold in `src/lib/payment/stripe.ts`
4. Configure Stripe webhook endpoint: `https://your-domain.com/api/webhooks/payment`
5. Enable webhook events: `checkout.session.completed`, `payment_intent.payment_failed`

## Delivery Integration

### Dry-Run Mode (Default)

Logs commands to console without executing. Perfect for development.

### Webhook Mode

Sends delivery commands to an external endpoint:

```env
DELIVERY_MODE="webhook"
WEBHOOK_DELIVERY_URL="https://your-mc-server-api.com/execute"
PAYMENT_WEBHOOK_SECRET="shared-hmac-secret"
```

The webhook sends POST requests with HMAC-SHA256 signed payloads.

### RCON Mode

Direct Minecraft server communication:

1. Install RCON client: `npm install rcon-client`
2. Configure:
   ```env
   DELIVERY_MODE="rcon"
   RCON_HOST="your-mc-server.com"
   RCON_PORT="25575"
   RCON_PASSWORD="your-rcon-password"
   ```
3. Complete the scaffold in `src/lib/delivery/rcon.ts`

### Delivery Templates

Delivery templates use safe placeholders:
- `{player_name}` — Minecraft username
- `{player_uuid}` — Minecraft UUID
- `{order_id}` — Order ID
- `{product_id}` — Product slug
- `{quantity}` — Purchase quantity

Example: `lp user {player_name} parent set vip`

Only these placeholders are allowed. The system rejects any other `{xxx}` patterns.

## Production Deployment

### Build

```bash
npm run build
npm run start
```

### Environment Checklist

- [ ] Change NEXTAUTH_SECRET to a cryptographically random value
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Change admin password after first login
- [ ] Configure real payment provider (Stripe)
- [ ] Configure delivery mode (webhook or RCON)
- [ ] Set up PostgreSQL with proper credentials
- [ ] Enable HTTPS
- [ ] Set up reverse proxy (nginx/Caddy)
- [ ] Configure rate limiting at proxy level
- [ ] Set up database backups
- [ ] Review and update legal pages (terms, privacy, refunds)

### Docker (Optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment

1. Push to GitHub
2. Import in Vercel
3. Set environment variables in Vercel dashboard
4. Add PostgreSQL (Vercel Postgres or external)
5. Build command: `npx prisma generate && npm run build`

---

# Manual Testing Checklist

## Authentication

- [ ] Register new account with valid email/username/password
- [ ] Register fails with duplicate email
- [ ] Register fails with duplicate username
- [ ] Register fails with weak password (< 8 chars)
- [ ] Login with valid credentials
- [ ] Login fails with wrong password
- [ ] Login fails with non-existent email
- [ ] Session persists across page refreshes
- [ ] Logout clears session
- [ ] Protected pages redirect to login when unauthenticated

## Store (Player-Facing)

- [ ] Homepage loads with hero, featured products, categories
- [ ] Store page shows all active products
- [ ] Category filter works
- [ ] Search bar filters products
- [ ] Sort options work (price, newest)
- [ ] Product detail page shows full info
- [ ] Sale products show compare-at price
- [ ] Limited stock products show remaining count
- [ ] Pagination works on store page

## Cart

- [ ] Add product to cart
- [ ] Cart count updates in navbar
- [ ] Increase/decrease quantity
- [ ] Remove item from cart
- [ ] Cart totals compute correctly (server-side)
- [ ] Apply valid coupon code (WELCOME10)
- [ ] Coupon discount applies correctly
- [ ] Invalid coupon shows error
- [ ] Empty cart shows appropriate message

## Checkout

- [ ] Checkout requires authentication
- [ ] Checkout requires linked Minecraft account
- [ ] Order summary matches cart
- [ ] Totals are correct after coupon
- [ ] Terms checkbox required
- [ ] Place order creates order with PENDING_PAYMENT status
- [ ] Payment flow redirects appropriately
- [ ] After payment, order moves to PAID
- [ ] Cart is cleared after successful order
- [ ] Duplicate order prevention works

## Minecraft Account

- [ ] Link Minecraft account with username + UUID
- [ ] Linked account displays correctly
- [ ] Unlink account works
- [ ] Cannot checkout without linked account

## Order History

- [ ] Order list shows user's orders
- [ ] Order detail shows items, status, payment info
- [ ] Status timeline displays correctly
- [ ] Order statuses are color-coded

## Admin — Dashboard

- [ ] Dashboard loads for admin users
- [ ] Non-admin users cannot access /admin
- [ ] Stats cards show correct counts
- [ ] Recent orders table populated
- [ ] Quick action buttons work

## Admin — Products

- [ ] Product list loads with all products
- [ ] Search filters products
- [ ] Category/type filters work
- [ ] Create product with all fields
- [ ] Edit existing product
- [ ] Toggle product active/inactive
- [ ] Delete product (soft delete)
- [ ] Product validation rejects invalid data
- [ ] Price must be non-negative
- [ ] Slug auto-generates from name

## Admin — Categories

- [ ] Category list shows all categories
- [ ] Create category with name/slug/description
- [ ] Edit category
- [ ] Cannot delete category with products

## Admin — Orders

- [ ] Order list shows all orders
- [ ] Filter by status
- [ ] Search by order number
- [ ] Order detail shows full info
- [ ] Mark as Paid (from PENDING_PAYMENT)
- [ ] Queue Delivery (from PAID)
- [ ] Cancel Order (from PENDING_PAYMENT)
- [ ] Refund (from PAID or FAILED_DELIVERY)
- [ ] Invalid state transitions are rejected
- [ ] Status changes are logged in audit

## Admin — Users

- [ ] User list shows all users
- [ ] Search by email/username
- [ ] View user detail
- [ ] Toggle user active/inactive
- [ ] Assign role to user
- [ ] Remove role from user

## Admin — Coupons

- [ ] Coupon list shows all coupons
- [ ] Create fixed discount coupon
- [ ] Create percentage discount coupon
- [ ] Set max uses, per-user limit
- [ ] Set min cart value
- [ ] Set start/end dates
- [ ] Toggle coupon active/inactive
- [ ] Delete coupon

## Admin — Delivery

- [ ] Delivery queue shows pending jobs
- [ ] Process single delivery job
- [ ] Process all pending jobs
- [ ] Failed jobs show error details
- [ ] Retry failed job
- [ ] Delivery logs show attempt history
- [ ] Dry-run mode logs commands without executing

## Admin — Content

- [ ] Create announcement
- [ ] Edit announcement
- [ ] Toggle announcement active/inactive
- [ ] Announcements appear in store announcement bar

## Admin — Settings

- [ ] Delivery templates list shows templates
- [ ] Create new template with valid placeholders
- [ ] Template rejects invalid placeholders
- [ ] Template preview renders with sample data
- [ ] General settings display current config

## Admin — Audit

- [ ] Audit log shows admin actions
- [ ] Filter by user, action, date
- [ ] Details are expandable

## Security

- [ ] Admin API routes reject non-admin users
- [ ] Protected routes redirect unauthenticated users
- [ ] Cart totals cannot be manipulated client-side
- [ ] Delivery commands only use approved templates
- [ ] Duplicate delivery is prevented (idempotency)
- [ ] CSRF protection on mutations
- [ ] Rate limiting on auth endpoints
- [ ] Passwords are bcrypt hashed
- [ ] No secrets in client-side code

---

# Risk Notes & Next Steps

## Known Limitations

1. **No real payment provider**: Sandbox only. Stripe scaffold needs completion.
2. **No RCON library**: The RCON adapter is a scaffold. Install `rcon-client` and complete.
3. **No email verification**: Registration doesn't send verification emails.
4. **No image upload**: Product images use URL references, not file uploads.
5. **No real-time updates**: Delivery status uses polling, not WebSockets.
6. **No i18n**: Structured for it but not implemented. Add next-intl for Thai/English.
7. **No background job processor**: Delivery queue is processed via API calls, not a persistent worker. For production, add Bull/BullMQ with Redis.
8. **Session storage**: JWT-based. For production at scale, consider database sessions.

## Recommended Next Steps

1. **Stripe Integration**: Complete `src/lib/payment/stripe.ts` with real Stripe SDK
2. **RCON Integration**: Install `rcon-client`, complete `src/lib/delivery/rcon.ts`
3. **Background Workers**: Add Bull/BullMQ for reliable delivery job processing
4. **Email System**: Add SendGrid/Resend for order confirmations and verification
5. **Image Upload**: Add file upload to S3/Cloudflare R2 for product images
6. **Rate Limiting**: Add Redis-backed rate limiting (current is in-memory)
7. **Monitoring**: Add error tracking (Sentry) and analytics
8. **Testing**: Add unit tests for services, integration tests for API routes
9. **i18n**: Add next-intl for Thai and English support
10. **CDN**: Configure image optimization and CDN for static assets

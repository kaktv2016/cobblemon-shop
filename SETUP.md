# CobbleMart — Setup & Deployment Guide

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- MySQL 8+ or MariaDB 10.6+ running and accessible
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
# REQUIRED — MySQL connection string
DATABASE_URL="mysql://user:password@127.0.0.1:3306/cobbleshop"

# REQUIRED — NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# New orders: Stripe-hosted PromptPay Checkout (THB only)
PAYMENT_PROVIDER="stripe"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
DEFAULT_CURRENCY="THB"

# Delivery Mode: dry-run | webhook | rcon
DELIVERY_MODE="dry-run"

# Webhook delivery (if DELIVERY_MODE=webhook)
WEBHOOK_DELIVERY_URL="https://your-server.com/api/deliver"

# RCON delivery (if DELIVERY_MODE=rcon)
RCON_HOST="127.0.0.1"
RCON_PORT="25575"
RCON_PASSWORD="replace-with-a-long-random-password"
RCON_TIMEOUT_MS="5000"
DELIVERY_CRON_SECRET="replace-with-another-long-random-secret"

# Seed defaults (used during db:seed)
ADMIN_EMAIL="admin@cobblemart.com"
ADMIN_PASSWORD="admin123456"
```

## Database Setup

### Create Database

```sql
CREATE DATABASE cobbleshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cobblemart_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON cobbleshop.* TO 'cobblemart_user'@'localhost';
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
- **Payment Providers**: Stripe Checkout is used for new PromptPay orders; legacy Omise routes remain for pending historical orders.
- **Idempotent Delivery**: Every delivery job has a unique idempotency key preventing duplicate delivery.
- **State Machine Orders**: Order status transitions are validated against an explicit transition map.
- **Ordered Delivery Commands**: Products can combine reusable templates and one-line custom plugin commands with allow-listed placeholders.
- **Audit Trail**: Every admin mutation is logged to the audit_logs table.

## Payment Integration

### Sandbox Mode (Default)

The sandbox payment provider simulates the payment flow without real money:
1. Checkout creates a payment intent
2. User is redirected to a sandbox callback URL
3. Payment is auto-confirmed
4. Delivery jobs are created and processed

### Stripe PromptPay (New Orders)

1. Complete Stripe account verification and enable PromptPay in the Stripe dashboard.
2. Set environment variables:
   ```env
   PAYMENT_PROVIDER="stripe"
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_SITE_URL="https://your-domain.com"
   DEFAULT_CURRENCY="THB"
   ```
3. Configure the webhook endpoint: `https://your-domain.com/api/webhooks/stripe`.
4. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.

For local verification, forward events with Stripe CLI to
`http://localhost:3000/api/webhooks/stripe`. Never put Stripe keys in Admin
Settings or commit them to source control.

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

1. Enable RCON in the Minecraft server's `server.properties`:
   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=replace-with-a-long-random-password
   broadcast-rcon-to-ops=false
   ```
2. Restart the Minecraft server.
3. Configure the web app. A domain is not required when both processes run on
   the same machine:
   ```env
   DELIVERY_MODE="rcon"
   RCON_HOST="127.0.0.1"
   RCON_PORT="25575"
   RCON_PASSWORD="replace-with-the-same-password"
   RCON_TIMEOUT_MS="5000"
   DELIVERY_CRON_SECRET="replace-with-another-long-random-secret"
   ```
4. Do not expose port `25575` publicly. If the web app is on another machine,
   allow only the web server's private IP through the firewall.
5. Start the web app and delivery worker together with `npm run dev` in
   development or `npm run start` after a production build. Use
   `npm run dev:web` only when intentionally running the web process alone.
6. The worker checks whether the player is online and retries offline jobs
   every 30 seconds without consuming a delivery attempt.
7. The internal cron endpoint remains a recovery fallback. POST to
   `/api/internal/delivery/process` with the header
   `Authorization: Bearer <DELIVERY_CRON_SECRET>` from a local cron.

### Delivery Templates

Delivery templates use safe placeholders:
- `{player_name}` — Minecraft username
- `{player_uuid}` — Minecraft UUID
- `{order_id}` — Order ID
- `{product_id}` — Product slug
- `{quantity}` — Purchase quantity

Example: `lp user {player_name} parent set vip`

Additional placeholders: `{product_slug}`, `{delivery_key}`, and
`{delivery_amount}`. A recommended item template is
`give {player_name} {delivery_key} {delivery_amount}`. The delivery key falls
back to the product slug and the delivery amount is multiplied by the purchased
quantity.

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
2. **Single-host delivery worker**: The persistent MySQL-backed worker is reliable
   for the current self-hosted deployment, but multi-host scaling would benefit
   from a dedicated queue such as BullMQ/Redis.
3. **No email verification**: Registration doesn't send verification emails.
4. **No real-time updates**: Delivery status uses polling, not WebSockets.
5. **No i18n framework**: Thai copy is present, but locale routing is not implemented.
6. **Session storage**: JWT-based. For production at scale, consider database sessions.

## Recommended Next Steps

1. **Stripe Integration**: Complete `src/lib/payment/stripe.ts` with real Stripe SDK
2. **Queue Scaling**: Add BullMQ/Redis only when delivery workers run on multiple hosts
3. **Email System**: Add SendGrid/Resend for order confirmations and verification
4. **Rate Limiting**: Add Redis-backed rate limiting (current is in-memory)
5. **Monitoring**: Add error tracking (Sentry) and analytics
6. **Testing**: Add unit tests for services, integration tests for API routes
7. **i18n**: Add next-intl for Thai and English support
8. **CDN**: Configure image optimization and CDN for static assets

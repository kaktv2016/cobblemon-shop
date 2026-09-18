-- CreateTable
CREATE TABLE `announcements` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'SALE', 'EVENT', 'MAINTENANCE') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `announcements_createdAt_idx`(`createdAt` ASC),
    INDEX `announcements_isActive_idx`(`isActive` ASC),
    INDEX `announcements_type_idx`(`type` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userEmail` VARCHAR(255) NULL,
    `action` VARCHAR(255) NOT NULL,
    `target` VARCHAR(100) NOT NULL,
    `targetId` VARCHAR(255) NULL,
    `details` LONGTEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_action_idx`(`action` ASC),
    INDEX `audit_logs_createdAt_idx`(`createdAt` ASC),
    INDEX `audit_logs_target_idx`(`target` ASC),
    INDEX `audit_logs_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundle_items` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `bundle_items_bundleId_idx`(`bundleId` ASC),
    UNIQUE INDEX `bundle_items_bundleId_itemId_key`(`bundleId` ASC, `itemId` ASC),
    INDEX `bundle_items_itemId_idx`(`itemId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cart_items_productId_idx`(`productId` ASC),
    INDEX `cart_items_userId_idx`(`userId` ASC),
    UNIQUE INDEX `cart_items_userId_productId_key`(`userId` ASC, `productId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `categories_isActive_idx`(`isActive` ASC),
    INDEX `categories_parentId_idx`(`parentId` ASC),
    INDEX `categories_slug_idx`(`slug` ASC),
    UNIQUE INDEX `categories_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_categories` (
    `couponId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    INDEX `coupon_categories_categoryId_idx`(`categoryId` ASC),
    INDEX `coupon_categories_couponId_idx`(`couponId` ASC),
    PRIMARY KEY (`couponId` ASC, `categoryId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_products` (
    `couponId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,

    INDEX `coupon_products_couponId_idx`(`couponId` ASC),
    INDEX `coupon_products_productId_idx`(`productId` ASC),
    PRIMARY KEY (`couponId` ASC, `productId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `discountType` ENUM('FIXED', 'PERCENTAGE') NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `perUserLimit` INTEGER NOT NULL DEFAULT 1,
    `minCartValue` DECIMAL(10, 2) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `coupons_code_idx`(`code` ASC),
    UNIQUE INDEX `coupons_code_key`(`code` ASC),
    INDEX `coupons_isActive_idx`(`isActive` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(255) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `renderedCommand` TEXT NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `lastAttemptAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `response` TEXT NULL,
    `error` TEXT NULL,
    `isDryRun` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `delivery_jobs_idempotencyKey_idx`(`idempotencyKey` ASC),
    UNIQUE INDEX `delivery_jobs_idempotencyKey_key`(`idempotencyKey` ASC),
    INDEX `delivery_jobs_nextRetryAt_idx`(`nextRetryAt` ASC),
    INDEX `delivery_jobs_orderId_idx`(`orderId` ASC),
    INDEX `delivery_jobs_orderItemId_idx`(`orderItemId` ASC),
    INDEX `delivery_jobs_status_idx`(`status` ASC),
    INDEX `delivery_jobs_templateId_fkey`(`templateId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_logs` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `attempt` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'SKIPPED') NOT NULL,
    `command` TEXT NOT NULL,
    `response` TEXT NULL,
    `error` TEXT NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `delivery_logs_executedAt_idx`(`executedAt` ASC),
    INDEX `delivery_logs_jobId_idx`(`jobId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `commandTemplate` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `delivery_templates_name_idx`(`name` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homepage_sections` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `type` ENUM('HERO', 'FEATURED', 'CATEGORY', 'BANNER', 'TEXT', 'PRODUCTS') NOT NULL,
    `content` LONGTEXT NULL,
    `imageUrl` TEXT NULL,
    `linkUrl` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `homepage_sections_isActive_idx`(`isActive` ASC),
    INDEX `homepage_sections_sortOrder_idx`(`sortOrder` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `minecraft_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(16) NOT NULL,
    `uuid` VARCHAR(36) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `minecraft_accounts_userId_idx`(`userId` ASC),
    UNIQUE INDEX `minecraft_accounts_userId_key`(`userId` ASC),
    INDEX `minecraft_accounts_username_idx`(`username` ASC),
    UNIQUE INDEX `minecraft_accounts_username_key`(`username` ASC),
    INDEX `minecraft_accounts_uuid_idx`(`uuid` ASC),
    UNIQUE INDEX `minecraft_accounts_uuid_key`(`uuid` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productName` VARCHAR(255) NOT NULL,
    `productType` ENUM('RANK', 'SUBSCRIPTION', 'CURRENCY', 'COSMETIC', 'CRATE_KEY', 'BUNDLE', 'PERK', 'BATTLE_PASS', 'LIMITED_OFFER', 'FREE_REWARD') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `totalPrice` DECIMAL(10, 2) NOT NULL,
    `deliveryStatus` ENUM('PENDING', 'QUEUED', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `deliveredAt` DATETIME(3) NULL,

    INDEX `order_items_deliveryStatus_idx`(`deliveryStatus` ASC),
    INDEX `order_items_orderId_idx`(`orderId` ASC),
    INDEX `order_items_productId_idx`(`productId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(50) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'QUEUED_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED_DELIVERY', 'REFUNDED', 'CANCELED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `couponId` VARCHAR(191) NULL,
    `couponCode` VARCHAR(50) NULL,
    `playerName` VARCHAR(16) NULL,
    `playerUuid` VARCHAR(36) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `orders_couponId_fkey`(`couponId` ASC),
    INDEX `orders_createdAt_idx`(`createdAt` ASC),
    INDEX `orders_orderNumber_idx`(`orderNumber` ASC),
    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber` ASC),
    INDEX `orders_status_idx`(`status` ASC),
    INDEX `orders_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(100) NOT NULL,
    `providerTransactionId` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `checkoutUrl` TEXT NULL,
    `rawResponse` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_transactions_orderId_idx`(`orderId` ASC),
    INDEX `payment_transactions_providerTransactionId_idx`(`providerTransactionId` ASC),
    INDEX `payment_transactions_provider_idx`(`provider` ASC),
    INDEX `payment_transactions_status_idx`(`status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `group` VARCHAR(100) NOT NULL,

    INDEX `permissions_code_idx`(`code` ASC),
    UNIQUE INDEX `permissions_code_key`(`code` ASC),
    INDEX `permissions_group_idx`(`group` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_tags` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `product_tags_productId_tag_key`(`productId` ASC, `tag` ASC),
    INDEX `product_tags_tag_idx`(`tag` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `shortDescription` VARCHAR(500) NULL,
    `fullDescription` TEXT NULL,
    `imageUrl` TEXT NULL,
    `bannerUrl` TEXT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `compareAtPrice` DECIMAL(10, 2) NULL,
    `productType` ENUM('RANK', 'SUBSCRIPTION', 'CURRENCY', 'COSMETIC', 'CRATE_KEY', 'BUNDLE', 'PERK', 'BATTLE_PASS', 'LIMITED_OFFER', 'FREE_REWARD') NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `visibility` ENUM('PUBLIC', 'HIDDEN', 'DRAFT') NOT NULL DEFAULT 'DRAFT',
    `stockLimit` INTEGER NULL,
    `stockSold` INTEGER NOT NULL DEFAULT 0,
    `purchaseLimit` INTEGER NULL,
    `cooldownMinutes` INTEGER NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `deliveryTemplateId` VARCHAR(191) NULL,
    `metadata` LONGTEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_categoryId_idx`(`categoryId` ASC),
    INDEX `products_createdAt_idx`(`createdAt` ASC),
    INDEX `products_deliveryTemplateId_fkey`(`deliveryTemplateId` ASC),
    INDEX `products_isActive_idx`(`isActive` ASC),
    INDEX `products_isFeatured_idx`(`isFeatured` ASC),
    INDEX `products_productType_idx`(`productType` ASC),
    INDEX `products_slug_idx`(`slug` ASC),
    UNIQUE INDEX `products_slug_key`(`slug` ASC),
    INDEX `products_visibility_idx`(`visibility` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    INDEX `role_permissions_permissionId_idx`(`permissionId` ASC),
    INDEX `role_permissions_roleId_idx`(`roleId` ASC),
    PRIMARY KEY (`roleId` ASC, `permissionId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `roles_name_idx`(`name` ASC),
    UNIQUE INDEX `roles_name_key`(`name` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seasonal_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` TEXT NULL,
    `bannerUrl` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `seasonal_campaigns_isActive_idx`(`isActive` ASC),
    INDEX `seasonal_campaigns_slug_idx`(`slug` ASC),
    UNIQUE INDEX `seasonal_campaigns_slug_key`(`slug` ASC),
    INDEX `seasonal_campaigns_startDate_idx`(`startDate` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_articles_category_idx`(`category` ASC),
    INDEX `support_articles_isPublished_idx`(`isPublished` ASC),
    INDEX `support_articles_slug_idx`(`slug` ASC),
    UNIQUE INDEX `support_articles_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,

    INDEX `user_roles_roleId_idx`(`roleId` ASC),
    INDEX `user_roles_userId_idx`(`userId` ASC),
    PRIMARY KEY (`userId` ASC, `roleId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `displayName` VARCHAR(255) NULL,
    `avatarUrl` TEXT NULL,
    `emailVerified` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `users_createdAt_idx`(`createdAt` ASC),
    INDEX `users_email_idx`(`email` ASC),
    UNIQUE INDEX `users_email_key`(`email` ASC),
    INDEX `users_username_idx`(`username` ASC),
    UNIQUE INDEX `users_username_key`(`username` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wiki_articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` VARCHAR(500) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` TEXT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `seoTitle` VARCHAR(255) NULL,
    `seoDescription` VARCHAR(500) NULL,
    `gameVersion` VARCHAR(100) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'OUTDATED') NOT NULL DEFAULT 'DRAFT',
    `lastReviewedAt` DATETIME(3) NULL,
    `searchKeywords` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wiki_articles_categoryId_idx`(`categoryId` ASC),
    INDEX `wiki_articles_categoryId_isPublished_idx`(`categoryId` ASC, `isPublished` ASC),
    INDEX `wiki_articles_isFeatured_idx`(`isFeatured` ASC),
    INDEX `wiki_articles_isPublished_idx`(`isPublished` ASC),
    INDEX `wiki_articles_isPublished_isFeatured_idx`(`isPublished` ASC, `isFeatured` ASC),
    INDEX `wiki_articles_slug_idx`(`slug` ASC),
    UNIQUE INDEX `wiki_articles_slug_key`(`slug` ASC),
    INDEX `wiki_articles_sortOrder_idx`(`sortOrder` ASC),
    INDEX `wiki_articles_status_idx`(`status` ASC),
    INDEX `wiki_articles_updatedAt_idx`(`updatedAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wiki_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(100) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wiki_categories_isVisible_idx`(`isVisible` ASC),
    INDEX `wiki_categories_slug_idx`(`slug` ASC),
    UNIQUE INDEX `wiki_categories_slug_key`(`slug` ASC),
    INDEX `wiki_categories_sortOrder_idx`(`sortOrder` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_categories` ADD CONSTRAINT `coupon_categories_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_categories` ADD CONSTRAINT `coupon_categories_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_jobs` ADD CONSTRAINT `delivery_jobs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_jobs` ADD CONSTRAINT `delivery_jobs_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_jobs` ADD CONSTRAINT `delivery_jobs_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `delivery_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_logs` ADD CONSTRAINT `delivery_logs_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `delivery_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `minecraft_accounts` ADD CONSTRAINT `minecraft_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_tags` ADD CONSTRAINT `product_tags_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_deliveryTemplateId_fkey` FOREIGN KEY (`deliveryTemplateId`) REFERENCES `delivery_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wiki_articles` ADD CONSTRAINT `wiki_articles_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `wiki_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

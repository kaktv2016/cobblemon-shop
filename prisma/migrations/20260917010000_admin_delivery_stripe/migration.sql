-- AlterTable
ALTER TABLE `delivery_jobs` ADD COLUMN `productDeliveryCommandId` VARCHAR(191) NULL,
    ADD COLUMN `sequence` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `product_delivery_commands` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `kind` ENUM('TEMPLATE', 'CUSTOM') NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `commandTemplate` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_delivery_commands_templateId_idx`(`templateId`),
    UNIQUE INDEX `product_delivery_commands_productId_sequence_key`(`productId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `eventId` VARCHAR(255) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `error` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_webhook_events_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `payment_webhook_events_provider_eventId_key`(`provider`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_settings` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'default',
    `shopName` VARCHAR(255) NOT NULL DEFAULT 'Cobblemon Divided',
    `shopDescription` VARCHAR(500) NOT NULL DEFAULT 'The official Cobblemon webshop',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'THB',
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMessage` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve the legacy one-template-per-product configuration as command 0.
INSERT INTO `product_delivery_commands`
    (`id`, `productId`, `sequence`, `kind`, `templateId`, `commandTemplate`, `createdAt`, `updatedAt`)
SELECT
    CONCAT('legacy_', MD5(`id`)), `id`, 0, 'TEMPLATE', `deliveryTemplateId`, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `products`
WHERE `deliveryTemplateId` IS NOT NULL;

-- Existing jobs keep their rendered command snapshot and become sequence 0.
UPDATE `delivery_jobs` AS `job`
JOIN `order_items` AS `item` ON `item`.`id` = `job`.`orderItemId`
JOIN `product_delivery_commands` AS `command`
    ON `command`.`productId` = `item`.`productId` AND `command`.`sequence` = 0
SET `job`.`productDeliveryCommandId` = `command`.`id`, `job`.`sequence` = 0;

-- Seed the singleton settings row without overwriting a future customized row.
INSERT IGNORE INTO `store_settings`
    (`id`, `shopName`, `shopDescription`, `currency`, `maintenanceMode`, `maintenanceMessage`, `createdAt`, `updatedAt`)
VALUES
    ('default', 'Cobblemon Divided', 'The official Cobblemon webshop', 'THB', false, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- CreateIndex
CREATE INDEX `delivery_jobs_productDeliveryCommandId_idx` ON `delivery_jobs`(`productDeliveryCommandId`);

-- CreateIndex
CREATE UNIQUE INDEX `delivery_jobs_orderItemId_sequence_key` ON `delivery_jobs`(`orderItemId`, `sequence`);

-- AddForeignKey
ALTER TABLE `product_delivery_commands` ADD CONSTRAINT `product_delivery_commands_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_delivery_commands` ADD CONSTRAINT `product_delivery_commands_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `delivery_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_jobs` ADD CONSTRAINT `delivery_jobs_productDeliveryCommandId_fkey` FOREIGN KEY (`productDeliveryCommandId`) REFERENCES `product_delivery_commands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

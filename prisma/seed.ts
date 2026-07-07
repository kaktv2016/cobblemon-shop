import {
  PrismaClient,
  ProductType,
  ProductVisibility,
  DiscountType,
  AnnouncementType,
  HomepageSectionType,
  WikiArticleStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Cobblemon Shop database...\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Roles & Permissions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating roles & permissions...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Full system administrator', isSystem: true },
  });

  const modRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: { name: 'moderator', description: 'Moderator with limited admin access', isSystem: true },
  });

  const playerRole = await prisma.role.upsert({
    where: { name: 'player' },
    update: {},
    create: { name: 'player', description: 'Regular player', isSystem: true },
  });

  const permissionGroups = {
    products: ['manage_products', 'view_products'],
    orders: ['manage_orders', 'view_orders'],
    users: ['manage_users', 'view_users'],
    coupons: ['manage_coupons', 'view_coupons'],
    delivery: ['manage_delivery', 'view_delivery', 'retry_delivery'],
    content: ['manage_content', 'view_content'],
    settings: ['manage_settings'],
    audit: ['view_audit'],
  };

  const allPermissions: Record<string, string> = {};
  for (const [group, codes] of Object.entries(permissionGroups)) {
    for (const code of codes) {
      const perm = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: `${code.replace(/_/g, ' ')}`, group },
      });
      allPermissions[code] = perm.id;
    }
  }

  // Assign all permissions to admin
  for (const permId of Object.values(allPermissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }

  // Assign view permissions to moderator
  const modPerms = Object.entries(allPermissions).filter(([code]) => code.startsWith('view_'));
  for (const [, permId] of modPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: modRole.id, permissionId: permId } },
      update: {},
      create: { roleId: modRole.id, permissionId: permId },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Admin User
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating admin user...');

  const adminPasswordHash = await hash('admin123456', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cobblemart.com' },
    update: {},
    create: {
      email: 'admin@cobblemart.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      displayName: 'Shop Admin',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  // Demo player
  const playerPasswordHash = await hash('player123456', 12);
  const demoPlayer = await prisma.user.upsert({
    where: { email: 'player@example.com' },
    update: {},
    create: {
      email: 'player@example.com',
      username: 'AshKetchum',
      passwordHash: playerPasswordHash,
      displayName: 'Ash Ketchum',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: demoPlayer.id, roleId: playerRole.id } },
    update: {},
    create: { userId: demoPlayer.id, roleId: playerRole.id },
  });

  // Link demo player MC account
  await prisma.minecraftAccount.upsert({
    where: { userId: demoPlayer.id },
    update: {},
    create: {
      userId: demoPlayer.id,
      username: 'AshKetchum',
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      verifiedAt: new Date(),
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Categories
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating categories...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ranks' },
      update: {},
      create: {
        name: 'Ranks',
        slug: 'ranks',
        description: 'Unlock exclusive server ranks with powerful perks and prestigious titles.',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cosmetics' },
      update: {},
      create: {
        name: 'Cosmetics',
        slug: 'cosmetics',
        description: 'Customize your trainer with unique trails, titles, and visual effects.',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'crate-keys' },
      update: {},
      create: {
        name: 'Crate Keys',
        slug: 'crate-keys',
        description: 'Unlock mystery crates filled with rare items, Pokémon, and more.',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'currency' },
      update: {},
      create: {
        name: 'Server Currency',
        slug: 'currency',
        description: 'Purchase in-game currency to trade with other players and buy items.',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'battle-pass' },
      update: {},
      create: {
        name: 'Battle Pass',
        slug: 'battle-pass',
        description: 'Seasonal expedition passes with exclusive rewards and challenges.',
        sortOrder: 5,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'bundles' },
      update: {},
      create: {
        name: 'Bundles',
        slug: 'bundles',
        description: 'Value packs combining multiple items at a discounted price.',
        sortOrder: 6,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'perks' },
      update: {},
      create: {
        name: 'Server Perks',
        slug: 'perks',
        description: 'One-time perks and utility items to enhance your gameplay.',
        sortOrder: 7,
        isActive: true,
      },
    }),
  ]);

  const [catRanks, catCosmetics, catCrates, catCurrency, catBattlePass, catBundles, catPerks] = categories;

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Delivery Templates
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating delivery templates...');

  const templates = await Promise.all([
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-rank' },
      update: {},
      create: {
        id: 'tpl-rank',
        name: 'Grant Rank',
        description: 'Assigns a server rank to the player via LuckPerms',
        commandTemplate: 'lp user {player_name} parent set {product_id}',
        isActive: true,
      },
    }),
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-give-item' },
      update: {},
      create: {
        id: 'tpl-give-item',
        name: 'Give Item',
        description: 'Gives items to the player inventory',
        commandTemplate: 'give {player_name} {product_id} {quantity}',
        isActive: true,
      },
    }),
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-crate-key' },
      update: {},
      create: {
        id: 'tpl-crate-key',
        name: 'Give Crate Key',
        description: 'Gives crate keys to the player',
        commandTemplate: 'crates give {player_name} {product_id} {quantity}',
        isActive: true,
      },
    }),
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-currency' },
      update: {},
      create: {
        id: 'tpl-currency',
        name: 'Add Currency',
        description: 'Adds server currency to player balance',
        commandTemplate: 'eco give {player_name} {quantity}',
        isActive: true,
      },
    }),
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-permission' },
      update: {},
      create: {
        id: 'tpl-permission',
        name: 'Grant Permission',
        description: 'Grants a permission node to the player',
        commandTemplate: 'lp user {player_name} permission set {product_id} true',
        isActive: true,
      },
    }),
    prisma.deliveryTemplate.upsert({
      where: { id: 'tpl-cosmetic' },
      update: {},
      create: {
        id: 'tpl-cosmetic',
        name: 'Unlock Cosmetic',
        description: 'Unlocks a cosmetic item for the player',
        commandTemplate: 'cosmetics unlock {player_name} {product_id}',
        isActive: true,
      },
    }),
  ]);

  const [tplRank, tplGiveItem, tplCrateKey, tplCurrency, tplPermission, tplCosmetic] = templates;

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Products
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating products...');

  // --- Ranks ---
  await prisma.product.upsert({
    where: { slug: 'trainer-rank' },
    update: {},
    create: {
      name: 'Trainer Rank',
      slug: 'trainer-rank',
      shortDescription: 'The starting rank for aspiring trainers. Includes basic perks.',
      fullDescription: 'Begin your journey as a certified Trainer! This rank grants you access to basic features including 2 home slots, colored chat, and access to the Trainer lounge.\n\n**Perks include:**\n- 2 home slots\n- Colored chat\n- Trainer prefix\n- Access to /hat command\n- Priority queue during peak hours',
      price: 149,
      compareAtPrice: 199,
      productType: ProductType.RANK,
      categoryId: catRanks.id,
      isFeatured: false,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplRank.id,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'ace-trainer-rank' },
    update: {},
    create: {
      name: 'Ace Trainer Rank',
      slug: 'ace-trainer-rank',
      shortDescription: 'A prestigious rank for dedicated trainers with enhanced perks.',
      fullDescription: 'Prove your dedication as an Ace Trainer! This rank includes everything from Trainer plus exclusive battle features and expanded capabilities.\n\n**Perks include:**\n- Everything in Trainer rank\n- 5 home slots\n- Access to /fly in lobby\n- Custom nickname colors\n- 2x daily reward multiplier\n- Exclusive Ace Trainer particle trail',
      price: 349,
      compareAtPrice: 449,
      productType: ProductType.RANK,
      categoryId: catRanks.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplRank.id,
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'champion-rank' },
    update: {},
    create: {
      name: 'Champion Rank',
      slug: 'champion-rank',
      shortDescription: 'The ultimate rank. Command respect across the entire server.',
      fullDescription: 'Become a Champion — the most prestigious rank on the server! This is the pinnacle of trainer status with exclusive access to everything.\n\n**Perks include:**\n- Everything in Ace Trainer rank\n- 10 home slots\n- /fly in all worlds\n- Champion-exclusive particle effects\n- Custom join message\n- 3x daily reward multiplier\n- Priority support\n- Exclusive Champion lounge access\n- Monthly Champion mystery box',
      price: 699,
      compareAtPrice: 899,
      productType: ProductType.RANK,
      categoryId: catRanks.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplRank.id,
      sortOrder: 3,
    },
  });

  // --- Cosmetics ---
  await prisma.product.upsert({
    where: { slug: 'shiny-aura-trail' },
    update: {},
    create: {
      name: 'Shiny Aura Trail',
      slug: 'shiny-aura-trail',
      shortDescription: 'A mesmerizing particle trail that follows you everywhere.',
      fullDescription: 'Leave a trail of shimmering particles as you explore the world. The Shiny Aura Trail creates a beautiful effect inspired by the sparkle of shiny Pokémon encounters.\n\nThis cosmetic effect is permanent and can be toggled on/off.',
      price: 89,
      productType: ProductType.COSMETIC,
      categoryId: catCosmetics.id,
      isFeatured: false,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCosmetic.id,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'legendary-title' },
    update: {},
    create: {
      name: 'Legendary Title Pack',
      slug: 'legendary-title',
      shortDescription: 'Unlock exclusive chat titles: Legendary, Mythical, and Ultra Beast.',
      fullDescription: 'Stand out in chat with three exclusive title options:\n\n- **[Legendary]** — Gold gradient title\n- **[Mythical]** — Pink/purple gradient title\n- **[Ultra Beast]** — Teal/dark gradient title\n\nSwitch between titles anytime with /title.',
      price: 129,
      productType: ProductType.COSMETIC,
      categoryId: catCosmetics.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCosmetic.id,
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'pokeball-hat' },
    update: {},
    create: {
      name: 'Poké Ball Hat',
      slug: 'pokeball-hat',
      shortDescription: 'Wear a stylish Poké Ball on your head as a cosmetic hat.',
      fullDescription: 'A fun cosmetic hat that places a Poké Ball on top of your character. Perfect for showing your dedication to catching them all!',
      price: 59,
      productType: ProductType.COSMETIC,
      categoryId: catCosmetics.id,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCosmetic.id,
      sortOrder: 3,
    },
  });

  // --- Crate Keys ---
  await prisma.product.upsert({
    where: { slug: 'common-crate-key' },
    update: {},
    create: {
      name: 'Common Crate Key',
      slug: 'common-crate-key',
      shortDescription: 'Open a Common Crate for basic items and resources.',
      fullDescription: 'Contains a variety of useful items including rare candies, potion supplies, and basic building materials. A great starting point for new trainers!',
      price: 29,
      productType: ProductType.CRATE_KEY,
      categoryId: catCrates.id,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCrateKey.id,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'rare-crate-key' },
    update: {},
    create: {
      name: 'Rare Crate Key',
      slug: 'rare-crate-key',
      shortDescription: 'Open a Rare Crate for valuable items and Pokémon.',
      fullDescription: 'The Rare Crate contains higher-value items including Technical Machines (TMs), rare held items, evolution stones, and a chance to receive a rare Pokémon!',
      price: 79,
      productType: ProductType.CRATE_KEY,
      categoryId: catCrates.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCrateKey.id,
      sortOrder: 2,
      stockLimit: 500,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'legendary-crate-key' },
    update: {},
    create: {
      name: 'Legendary Crate Key',
      slug: 'legendary-crate-key',
      shortDescription: 'The ultimate crate with guaranteed legendary rewards.',
      fullDescription: 'The most exclusive crate on the server! Every Legendary Crate guarantees at least one legendary-tier reward, which may include:\n\n- Legendary Pokémon encounter\n- Master Ball\n- Exclusive cosmetics\n- Large currency payout\n- Rare collectibles',
      price: 199,
      compareAtPrice: 249,
      productType: ProductType.CRATE_KEY,
      categoryId: catCrates.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCrateKey.id,
      sortOrder: 3,
      stockLimit: 100,
    },
  });

  // --- Currency ---
  await prisma.product.upsert({
    where: { slug: 'coins-1000' },
    update: {},
    create: {
      name: '1,000 PokéCoins',
      slug: 'coins-1000',
      shortDescription: 'A small pouch of PokéCoins for quick purchases.',
      fullDescription: 'PokéCoins are the server\'s main trading currency. Use them to buy items from NPC shops, trade with other players, or bid in auctions.',
      price: 49,
      productType: ProductType.CURRENCY,
      categoryId: catCurrency.id,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCurrency.id,
      metadata: { coinAmount: 1000 },
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'coins-5000' },
    update: {},
    create: {
      name: '5,000 PokéCoins',
      slug: 'coins-5000',
      shortDescription: 'A generous bundle of PokéCoins. Best value for regular players.',
      fullDescription: 'A large stack of PokéCoins with bonus value. Perfect for stocking up on supplies, buying rare items, or dominating the auction house.',
      price: 199,
      compareAtPrice: 245,
      productType: ProductType.CURRENCY,
      categoryId: catCurrency.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCurrency.id,
      metadata: { coinAmount: 5000 },
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'coins-15000' },
    update: {},
    create: {
      name: '15,000 PokéCoins',
      slug: 'coins-15000',
      shortDescription: 'Massive coin chest. Maximum value with 3,000 bonus coins!',
      fullDescription: 'The ultimate PokéCoin package! Includes 15,000 coins plus a bonus 3,000 coins — that\'s 18,000 coins total! Best value on the store.',
      price: 499,
      compareAtPrice: 735,
      productType: ProductType.CURRENCY,
      categoryId: catCurrency.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplCurrency.id,
      metadata: { coinAmount: 15000, bonusCoins: 3000 },
      sortOrder: 3,
    },
  });

  // --- Battle Pass ---
  await prisma.product.upsert({
    where: { slug: 'expedition-pass-s1' },
    update: {},
    create: {
      name: 'Expedition Pass — Season 1',
      slug: 'expedition-pass-s1',
      shortDescription: 'Unlock 50 tiers of exclusive seasonal rewards and challenges.',
      fullDescription: 'The Expedition Pass grants access to the premium reward track for Season 1: "Dawn of Discovery." Complete daily and weekly challenges to earn XP and unlock 50 tiers of exclusive rewards.\n\n**Highlights:**\n- Exclusive Season 1 cosmetics\n- Rare Pokémon encounters at Tier 25 and Tier 50\n- Currency rewards at every 5th tier\n- Exclusive Champion\'s Cape at Tier 50\n- Season 1 title: [Explorer]',
      price: 299,
      productType: ProductType.BATTLE_PASS,
      categoryId: catBattlePass.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplPermission.id,
      sortOrder: 1,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    },
  });

  // --- Perks ---
  await prisma.product.upsert({
    where: { slug: 'extra-home-slot' },
    update: {},
    create: {
      name: 'Extra Home Slot',
      slug: 'extra-home-slot',
      shortDescription: 'Add one additional /home slot to your account.',
      fullDescription: 'Permanently add one more home slot to your account. Stack multiple purchases to expand your home network across the server.',
      price: 39,
      productType: ProductType.PERK,
      categoryId: catPerks.id,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplPermission.id,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'iv-checker' },
    update: {},
    create: {
      name: 'IV Checker Unlock',
      slug: 'iv-checker',
      shortDescription: 'Permanently unlock the /ivs command to check Pokémon stats.',
      fullDescription: 'Unlock the ability to check the Individual Values (IVs) of any Pokémon you own using the /ivs command. Essential for competitive trainers who want to build the perfect team.',
      price: 69,
      productType: ProductType.PERK,
      categoryId: catPerks.id,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplPermission.id,
      sortOrder: 2,
    },
  });

  // --- Bundle ---
  await prisma.product.upsert({
    where: { slug: 'starter-bundle' },
    update: {},
    create: {
      name: 'Ultimate Starter Bundle',
      slug: 'starter-bundle',
      shortDescription: 'Everything a new trainer needs: rank, coins, keys, and cosmetic.',
      fullDescription: 'The perfect package for new players! This bundle includes:\n\n- Trainer Rank\n- 5,000 PokéCoins\n- 3x Rare Crate Keys\n- Shiny Aura Trail\n- IV Checker Unlock\n\nSave over 40% compared to buying individually!',
      price: 399,
      compareAtPrice: 695,
      productType: ProductType.BUNDLE,
      categoryId: catBundles.id,
      isFeatured: true,
      isActive: true,
      visibility: ProductVisibility.PUBLIC,
      deliveryTemplateId: tplGiveItem.id,
      sortOrder: 1,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Coupons
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating coupons...');

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off for new players',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxUses: 1000,
      perUserLimit: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'COBBLEFAN50' },
    update: {},
    create: {
      code: 'COBBLEFAN50',
      description: '฿50 off orders over ฿200',
      discountType: DiscountType.FIXED,
      discountValue: 50,
      minCartValue: 200,
      maxUses: 500,
      perUserLimit: 2,
      isActive: true,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Homepage Sections
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating homepage sections...');

  await prisma.homepageSection.create({
    data: {
      title: 'Begin Your Cobblemon Journey',
      subtitle: 'Premium items, exclusive ranks, and legendary rewards await. Gear up for the ultimate Pokémon adventure.',
      type: HomepageSectionType.HERO,
      content: { buttonText: 'Explore Store', buttonLink: '/store' },
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.homepageSection.create({
    data: {
      title: 'Featured Items',
      subtitle: 'Hand-picked premium items for this week',
      type: HomepageSectionType.FEATURED,
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.homepageSection.create({
    data: {
      title: 'Season 1: Dawn of Discovery',
      subtitle: 'Unlock 50 tiers of exclusive rewards with the Expedition Pass',
      type: HomepageSectionType.BANNER,
      content: { buttonText: 'Get the Pass', buttonLink: '/store/battle-pass/expedition-pass-s1' },
      linkUrl: '/store/battle-pass',
      isActive: true,
      sortOrder: 3,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Announcements
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating announcements...');

  await prisma.announcement.create({
    data: {
      title: '🎉 Grand Opening Sale — 10% off with code WELCOME10',
      content: 'Use code WELCOME10 at checkout to save 10% on your first purchase!',
      type: AnnouncementType.SALE,
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.announcement.create({
    data: {
      title: '🌟 Season 1 Expedition Pass is now available!',
      content: 'Start your expedition journey with 50 tiers of exclusive rewards.',
      type: AnnouncementType.EVENT,
      isActive: true,
      sortOrder: 2,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Support Articles
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating support articles...');

  await prisma.supportArticle.upsert({
    where: { slug: 'how-to-purchase' },
    update: {},
    create: {
      title: 'How to Purchase Items',
      slug: 'how-to-purchase',
      content: '## How to Purchase\n\n1. **Browse** our store and add items to your cart\n2. **Link** your Minecraft account in your profile settings\n3. **Checkout** and complete payment through our secure payment system\n4. **Receive** your items automatically in-game\n\nMake sure you are logged into the server when your order is being delivered. If you are offline, your items will be delivered next time you join.\n\n## Need Help?\n\nContact our support team through Discord if you experience any issues.',
      category: 'Getting Started',
      sortOrder: 1,
      isPublished: true,
    },
  });

  await prisma.supportArticle.upsert({
    where: { slug: 'refund-policy' },
    update: {},
    create: {
      title: 'Refund Policy',
      slug: 'refund-policy',
      content: '## Refund Policy\n\nWe offer refunds under the following conditions:\n\n- **Within 48 hours** of purchase if items have not been delivered\n- **Technical issues** that prevent item delivery after multiple attempts\n- **Duplicate charges** or billing errors\n\n### Non-refundable\n\n- Items that have already been delivered and used in-game\n- Battle Pass / Season Pass after tier progress has been made\n- Currency packs after coins have been spent\n\n### How to Request a Refund\n\nContact our support team through Discord with your order number and reason for the refund.',
      category: 'Policies',
      sortOrder: 2,
      isPublished: true,
    },
  });

  await prisma.supportArticle.upsert({
    where: { slug: 'delivery-info' },
    update: {},
    create: {
      title: 'Delivery Information',
      slug: 'delivery-info',
      content: '## How Delivery Works\n\nAll purchases are delivered automatically to your linked Minecraft account.\n\n### Delivery Process\n\n1. After payment is confirmed, your order enters the delivery queue\n2. Our system sends the items to the server\n3. If you are online, items are delivered immediately\n4. If offline, items are queued and delivered on your next login\n\n### Delivery Issues\n\nIf you haven\'t received your items within 30 minutes:\n\n1. Make sure your Minecraft account is correctly linked\n2. Try logging out and back into the server\n3. Check your order status on the website\n4. Contact support if the issue persists',
      category: 'Getting Started',
      sortOrder: 3,
      isPublished: true,
    },
  });

  await prisma.supportArticle.upsert({
    where: { slug: 'terms-of-service' },
    update: {},
    create: {
      title: 'Terms of Service',
      slug: 'terms-of-service',
      content: '## Terms of Service\n\nBy using CobbleMart, you agree to the following terms:\n\n1. **Account**: You are responsible for maintaining the security of your account\n2. **Purchases**: All purchases are final unless covered by our refund policy\n3. **In-game items**: Items are virtual goods with no real-world value\n4. **Conduct**: Abuse of store features, chargebacks, or fraud may result in a permanent ban\n5. **Changes**: We reserve the right to modify prices, items, and features without prior notice\n6. **Minecraft**: This store is not affiliated with Mojang Studios or Microsoft\n\n### Contact\n\nFor questions about these terms, contact us through Discord.',
      category: 'Policies',
      sortOrder: 4,
      isPublished: true,
    },
  });

  await prisma.supportArticle.upsert({
    where: { slug: 'link-minecraft-account' },
    update: {},
    create: {
      title: 'How to Link Your Minecraft Account',
      slug: 'link-minecraft-account',
      content: '## Linking Your Minecraft Account\n\nYou must link your Minecraft account before making a purchase.\n\n### Steps\n\n1. Log in to your CobbleMart account\n2. Go to Account → Minecraft Account\n3. Enter your Minecraft username\n4. Your UUID will be automatically detected\n5. Click "Link Account"\n\n### Important Notes\n\n- You can only link one Minecraft account at a time\n- Changing your linked account may affect pending deliveries\n- Make sure to use the exact username you use on our server',
      category: 'Getting Started',
      sortOrder: 5,
      isPublished: true,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Wiki Categories & Articles
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating wiki categories and articles...');

  const wikiCategories = await Promise.all([
    prisma.wikiCategory.upsert({
      where: { slug: 'getting-started' },
      update: {},
      create: {
        name: 'Getting Started',
        slug: 'getting-started',
        description: 'First steps for new trainers joining Cobblemon Divided.',
        icon: 'Compass',
        sortOrder: 1,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'progression' },
      update: {},
      create: {
        name: 'Progression',
        slug: 'progression',
        description: 'Core progression loops, milestones, and unlock paths.',
        icon: 'Mountain',
        sortOrder: 2,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'regions' },
      update: {},
      create: {
        name: 'Regions',
        slug: 'regions',
        description: 'Regional hubs, routes, and world-specific guidance.',
        icon: 'Map',
        sortOrder: 3,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'gyms' },
      update: {},
      create: {
        name: 'Gyms',
        slug: 'gyms',
        description: 'Gym requirements, badge routes, and battle expectations.',
        icon: 'Shield',
        sortOrder: 4,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'raids' },
      update: {},
      create: {
        name: 'Raids',
        slug: 'raids',
        description: 'Raid loops, encounter tiers, and reward structure.',
        icon: 'Zap',
        sortOrder: 5,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'economy' },
      update: {},
      create: {
        name: 'Economy',
        slug: 'economy',
        description: 'Currencies, trading, and wealth-building systems.',
        icon: 'Coins',
        sortOrder: 6,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'commands' },
      update: {},
      create: {
        name: 'Commands',
        slug: 'commands',
        description: 'Essential commands for navigation, utility, and tracking.',
        icon: 'Terminal',
        sortOrder: 7,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'server-rules' },
      update: {},
      create: {
        name: 'Server Rules',
        slug: 'server-rules',
        description: 'Community expectations, bans, and fair-play rules.',
        icon: 'Scale',
        sortOrder: 8,
        isVisible: true,
      },
    }),
    prisma.wikiCategory.upsert({
      where: { slug: 'faq' },
      update: {},
      create: {
        name: 'FAQ',
        slug: 'faq',
        description: 'Quick answers to common player questions.',
        icon: 'CircleHelp',
        sortOrder: 9,
        isVisible: true,
      },
    }),
  ]);

  const wikiCategoryMap = new Map(wikiCategories.map((category) => [category.slug, category.id]));

  await prisma.wikiArticle.upsert({
    where: { slug: 'starter-path-for-new-trainers' },
    update: {},
    create: {
      title: 'Starter Path for New Trainers',
      slug: 'starter-path-for-new-trainers',
      excerpt: 'A quick onboarding route for players who have just joined Cobblemon Divided.',
      content: `# Starter Path for New Trainers

Welcome to the development wiki. This sample article shows how Markdown content will be rendered in the live portal.

## First steps

1. Link your Minecraft account
2. Claim the starter kit
3. Travel to the first route hub

## Recommended checklist

| Step | Goal |
| --- | --- |
| 1 | Unlock your first warp |
| 2 | Catch a balanced team |
| 3 | Prepare for your first gym |

> This is seeded development content and can be replaced from the admin panel.

\`\`\`txt
/spawn
/rtp
/kit starter
\`\`\`
`,
      categoryId: wikiCategoryMap.get('getting-started')!,
      isPublished: true,
      isFeatured: true,
      sortOrder: 1,
      seoTitle: 'Starter Path for New Trainers',
      seoDescription: 'Learn the first steps for beginning your journey in Cobblemon Divided.',
      gameVersion: 'Cobblemon 1.6',
      status: WikiArticleStatus.PUBLISHED,
      lastReviewedAt: new Date(),
      searchKeywords: 'starter,new player,beginner,onboarding,spawn,starter kit',
    },
  });

  await prisma.wikiArticle.upsert({
    where: { slug: 'how-regional-progression-works' },
    update: {},
    create: {
      title: 'How Regional Progression Works',
      slug: 'how-regional-progression-works',
      excerpt: 'Understand how regions, gym gates, and raid tiers connect together.',
      content: `# How Regional Progression Works

This development article outlines the intended shape of the server wiki.

## Region flow

Each region has its own route loop, gym challenge, and unlock rewards.

## Progress checkpoints

- Capture goals
- Badge milestones
- Raid preparation

## Notes for editors

Add route maps, gym requirements, and reward tables here as the server design evolves.
`,
      categoryId: wikiCategoryMap.get('progression')!,
      isPublished: true,
      isFeatured: false,
      sortOrder: 2,
      seoTitle: 'Regional Progression Guide',
      seoDescription: 'A development guide to the progression flow across Cobblemon Divided regions.',
      gameVersion: 'Cobblemon 1.6',
      status: WikiArticleStatus.PUBLISHED,
      lastReviewedAt: new Date(),
      searchKeywords: 'progression,regions,gyms,raids,midgame',
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Seasonal Campaign
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Creating seasonal campaigns...');

  await prisma.seasonalCampaign.upsert({
    where: { slug: 'dawn-of-discovery-s1' },
    update: {},
    create: {
      name: 'Dawn of Discovery — Season 1',
      slug: 'dawn-of-discovery-s1',
      description: 'Embark on an epic expedition through uncharted territories. Complete challenges, earn rewards, and discover legendary Pokémon.',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  });

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin: admin@cobblemart.com / admin123456');
  console.log('  Player: player@example.com / player123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

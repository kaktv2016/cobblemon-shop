# CobbleMart - Premium Minecraft Cobblemon Server Shop

A sophisticated, premium dark fantasy-tech webshop for Minecraft Cobblemon servers built with Next.js, React, and Tailwind CSS.

## Design Direction

- **Aesthetic**: Premium dark fantasy-tech
- **Color Palette**:
  - Dark backgrounds: #0f1117, #1a1b2e, #111827 (gray-950)
  - Primary accent: Indigo #6366f1
  - Secondary accent: Amber #f59e0b
  - Glass effect overlays with backdrop blur
  - Subtle animations and transitions

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with fonts, SessionProvider
│   ├── globals.css                # Global styles, animations, utilities
│   └── (store)/
│       ├── layout.tsx             # Store layout with navbar, footer
│       └── page.tsx               # Home page example
│
├── components/
│   ├── shared/
│   │   └── providers.tsx          # SessionProvider wrapper
│   │
│   ├── store/
│   │   ├── navbar.tsx             # Premium sticky navbar with cart, user menu
│   │   ├── footer.tsx             # Footer with links, social, info
│   │   └── announcement-bar.tsx   # Type-coded announcement notifications
│   │
│   └── ui/
│       ├── button.tsx             # CVA-based button with variants
│       ├── card.tsx               # Card container components
│       ├── badge.tsx              # Badge with color variants
│       ├── input.tsx              # Dark-themed input field
│       ├── textarea.tsx           # Dark-themed textarea
│       ├── select.tsx             # Custom select dropdown
│       ├── dialog.tsx             # Modal dialog component
│       ├── table.tsx              # Dark-themed table components
│       ├── tabs.tsx               # Tab navigation component
│       ├── skeleton.tsx           # Shimmer loading skeleton
│       ├── pagination.tsx         # Page navigation
│       ├── dropdown-menu.tsx      # Dropdown context menu
│       ├── avatar.tsx             # User avatar with initials
│       └── toast.tsx              # Toast notification system
│
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js configuration
├── postcss.config.js              # PostCSS configuration
└── package.json                   # Dependencies
```

## UI Components

### Button (`button.tsx`)
Variants: default (indigo), secondary, outline, ghost, destructive, accent (amber)
Sizes: sm, default, lg, icon
- Focus states with ring
- Disabled states
- Icon support

### Card (`card.tsx`)
- Glass effect: `bg-gray-900/50 border-white/5`
- Hover glow animation
- Subcomponents: Header, Title, Description, Content, Footer

### Badge (`badge.tsx`)
Variants: default, secondary, success, warning, danger, outline
Color-coded for status indicators

### Form Elements
- **Input**: Dark themed with indigo focus ring
- **Textarea**: Resizable with focus effects
- **Select**: Custom dropdown with chevron icon

### Dialog (`dialog.tsx`)
- Backdrop blur overlay
- Escape key handler
- Animated open/close
- Full accessibility support

### Toast System (`toast.tsx`)
- Types: success (green), error (red), warning (amber), info (blue)
- Auto-dismiss with configurable duration
- Toast hook for easy integration
- Stacking in bottom-right corner

### Other Components
- **Table**: Dark styling with hover states
- **Pagination**: Next/prev buttons, page numbers
- **Dropdown Menu**: Context menu with keyboard support
- **Avatar**: User avatars with initials or image
- **Tabs**: Tab navigation with active state
- **Skeleton**: Shimmer loading animation

## Styling System

### Colors
CSS custom properties in `:root`:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--accent`, `--secondary`, `--destructive`
- `--input`, `--border`, `--ring`

### Animations
- `pulse-subtle`: Gentle pulsing
- `shimmer`: Loading skeleton effect
- `glow-border`: Border glow animation
- `fade-in`, `slide-in`, `zoom-in`: Entrance animations

### Glass Effects
- `.glass`: Full glass effect with blur
- `.glass-sm`: Subtle glass effect
- Glow utilities: `glow-indigo`, `glow-amber`, `glow-emerald`

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd cobblemon-shop
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## Key Features

1. **NextAuth Integration**: Session provider configured for authentication
2. **Dark Theme by Default**: `html.dark` class on root element
3. **Premium Typography**:
   - Display font: Outfit (headings)
   - Body font: Inter (readable and elegant)
4. **Responsive Design**: Mobile-first with Tailwind breakpoints
5. **Accessibility**: ARIA labels, keyboard navigation, focus states
6. **Performance**: Next.js optimizations, image optimization ready

## Tailwind Configuration

- Custom color palette with CSS variables
- Extended animations for premium feel
- Glass effect utilities
- Gradient text utilities
- Shadow customization for glows

## Next Steps

1. **Connect NextAuth**: Configure authentication providers
2. **Database**: Set up Prisma with PostgreSQL
3. **Payment Processing**: Integrate Stripe
4. **Product Management**: Build admin dashboard
5. **Inventory System**: Connect to game server API

## License

All rights reserved - CobbleMart Premium Shop

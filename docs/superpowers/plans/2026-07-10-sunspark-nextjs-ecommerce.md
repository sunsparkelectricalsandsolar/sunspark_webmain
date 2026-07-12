# Sunspark Next.js E-Commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-shaped Sunspark Electrical and Solar e-commerce app from the existing static template using Next.js, React, SQL, and Prisma.

**Architecture:** Create a Next.js App Router application at the repository root while preserving the existing `frontend/` template as a reference. Use Prisma for SQL data models, server actions/API routes for mutations, filesystem-backed uploads for product images, and reusable React components that mirror the current Electro-style storefront.

**Tech Stack:** Next.js, React, TypeScript, Prisma, PostgreSQL-compatible SQL, NextAuth/Auth.js-style credential authentication or equivalent custom session auth, Tailwind/CSS modules or global CSS adapted from the template, Vitest, Playwright.

---

## File Structure

- `app/`: Next.js routes for storefront, account, admin, checkout, and SEO metadata.
- `components/`: Reusable UI components such as header, navigation, product card, product gallery, cart summary, forms, and admin shell.
- `lib/`: Server-only helpers for Prisma, auth, uploads, invoices, checkout settings, WhatsApp URL generation, formatting, and validation.
- `prisma/schema.prisma`: SQL schema for users, categories, products, images, carts, wishlist, orders, invoices, stock movement, and settings.
- `prisma/seed.ts`: Setup-only seed for default admin, site settings, checkout settings, and broad Sunspark categories.
- `public/`: Optimized Sunspark logo, copied template images where still useful, and uploaded product files in development.
- `tests/`: Unit tests for business logic and validation.
- `e2e/`: Playwright tests for storefront, customer, checkout, and admin flows.
- `frontend/`: Existing template kept as reference until the new app is complete.

## Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/site/header.tsx`
- Create: `components/site/footer.tsx`
- Create: `lib/site-config.ts`
- Copy asset: `logo.jpg` to `public/logo.jpg`

- [ ] **Step 1: Create the Next.js dependencies and scripts**

```json
{
  "name": "sunspark-ecommerce",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "bcryptjs": "latest",
    "clsx": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/react": "latest",
    "@types/bcryptjs": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "jsdom": "latest",
    "prisma": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `node_modules` and `package-lock.json` are created without install errors.

- [ ] **Step 3: Create base app shell**

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Sunspark Electrical and Solar",
    template: "%s | Sunspark Electrical and Solar"
  },
  description: "Shop electricals, electronics, and solar products in Nairobi with Sunspark Electrical and Solar.",
  openGraph: {
    title: "Sunspark Electrical and Solar",
    description: "Electricals, electronics, and solar products in Nairobi.",
    url: siteConfig.url,
    siteName: "Sunspark Electrical and Solar",
    images: [{ url: "/logo.jpg", width: 1200, height: 630 }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create brand config**

`lib/site-config.ts`:

```ts
export const siteConfig = {
  name: "Sunspark Electrical and Solar",
  url: "https://sunsparkelectricals.co.ke",
  currency: "KSH",
  phone: "0703586562",
  whatsappPhone: "254703586562",
  email: "support@sunsparkelectricals.co.ke",
  facebookUrl: "https://www.facebook.com/profile.php?id=61589534876668",
  location: "Nairobi CBD, Duruma Road, Downtown Tower, second floor, shop number 8",
  mapUrl: "https://www.bing.com/maps/default.aspx?v=2&pc=FACEBK&mid=8100"
} as const;
```

- [ ] **Step 5: Create first homepage smoke page**

`app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <section className="section">
      <div className="container">
        <h1>Sunspark Electrical and Solar</h1>
        <p>Electricals, electronics, and solar products in Nairobi.</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Verify foundation**

Run: `npm run build`

Expected: Next.js compiles successfully.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json .env.example .gitignore app components lib public/logo.jpg
git commit -m "feat: scaffold nextjs sunspark app"
```

## Task 2: Database Schema and Setup Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db.ts`
- Create: `lib/money.ts`
- Test: `tests/money.test.ts`

- [ ] **Step 1: Write failing money formatting test**

`tests/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats cents as KSH for storefront display", () => {
    expect(formatMoney(125000)).toBe("KSH 1,250.00");
  });
});
```

Run: `npm test -- tests/money.test.ts`

Expected: FAIL because `@/lib/money` does not exist.

- [ ] **Step 2: Implement money helper**

`lib/money.ts`:

```ts
export function formatMoney(amountCents: number) {
  return `KSH ${(amountCents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
```

Run: `npm test -- tests/money.test.ts`

Expected: PASS.

- [ ] **Step 3: Create Prisma schema**

Use enum roles `ADMIN` and `CUSTOMER`; create models `User`, `Category`, `Product`, `ProductImage`, `WishlistItem`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Invoice`, `CheckoutSettings`, `SiteSettings`, and `StockMovement`. Store prices as integer cents. Store uploaded image URLs in `ProductImage.url`.

- [ ] **Step 4: Add default setup seed**

`prisma/seed.ts` creates:

- Admin user `admin@sunsparkelectricals.co.ke` with password `Password` hashed by bcrypt.
- Categories `Electricals`, `Electronics`, and `Solar`.
- Site settings for Sunspark contacts.
- Checkout settings with WhatsApp enabled and M-Pesa disabled until credentials are configured.

- [ ] **Step 5: Generate Prisma client and migrate**

Run:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

Expected: Prisma client generates, database tables are created, and setup records are inserted.

- [ ] **Step 6: Commit**

Run:

```bash
git add prisma lib/db.ts lib/money.ts tests/money.test.ts
git commit -m "feat: add prisma ecommerce schema"
```

## Task 3: Authentication and Authorization

**Files:**
- Create: `lib/auth/password.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/guards.ts`
- Create: `app/login/page.tsx`
- Create: `app/register/page.tsx`
- Create: `app/account/page.tsx`
- Create: `app/admin/login/page.tsx`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Write failing password tests**

`tests/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("verifies the original password against the hash", async () => {
    const hash = await hashPassword("Password");
    await expect(verifyPassword("Password", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrong", hash)).resolves.toBe(false);
  });
});
```

Run: `npm test -- tests/auth.test.ts`

Expected: FAIL because password helpers do not exist.

- [ ] **Step 2: Implement password helpers**

`lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

Run: `npm test -- tests/auth.test.ts`

Expected: PASS.

- [ ] **Step 3: Implement session and guards**

Use signed HTTP-only cookies for the initial implementation. `requireCustomer()` redirects to login when unauthenticated. `requireAdmin()` redirects to admin login unless the session user has role `ADMIN`.

- [ ] **Step 4: Build customer and admin auth pages**

Create registration with name, email, password. Create login forms for customer and admin. Admin login should warn that the default setup password must be changed before launch.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/auth app/login app/register app/account app/admin/login tests/auth.test.ts
git commit -m "feat: add customer and admin authentication"
```

## Task 4: Storefront Data and Template Components

**Files:**
- Create: `components/site/product-card.tsx`
- Create: `components/site/category-tile.tsx`
- Create: `components/site/product-gallery.tsx`
- Create: `app/store/page.tsx`
- Create: `app/category/[slug]/page.tsx`
- Create: `app/product/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Test: `tests/product-view.test.ts`

- [ ] **Step 1: Write failing product display test**

`tests/product-view.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getPrimaryImage } from "@/lib/products/images";

describe("getPrimaryImage", () => {
  it("returns the primary image when a product has multiple images", () => {
    const image = getPrimaryImage([
      { url: "/uploads/products/a.jpg", alt: "Side", isPrimary: false },
      { url: "/uploads/products/b.jpg", alt: "Front", isPrimary: true }
    ]);

    expect(image).toEqual({ url: "/uploads/products/b.jpg", alt: "Front", isPrimary: true });
  });
});
```

Run: `npm test -- tests/product-view.test.ts`

Expected: FAIL because `getPrimaryImage` does not exist.

- [ ] **Step 2: Implement product image helper**

`lib/products/images.ts`:

```ts
type ProductImageLike = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export function getPrimaryImage(images: ProductImageLike[]) {
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}
```

Run: `npm test -- tests/product-view.test.ts`

Expected: PASS.

- [ ] **Step 3: Build React components from the template**

Convert the template header, navigation, product card, category tiles, product gallery, and footer into typed React components. Use Sunspark copy, logo, KSH display, and categories.

- [ ] **Step 4: Build storefront routes**

Home shows featured categories and featured products. Store lists active products and supports category/search query params. Product page shows image gallery, stock, price, details, related products, add-to-cart, and wishlist buttons.

- [ ] **Step 5: Commit**

Run:

```bash
git add app components lib/products tests/product-view.test.ts
git commit -m "feat: build sunspark storefront pages"
```

## Task 5: Admin Product Management and Uploads

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/edit/page.tsx`
- Create: `lib/products/validation.ts`
- Create: `lib/uploads/product-images.ts`
- Test: `tests/product-validation.test.ts`

- [ ] **Step 1: Write failing product validation test**

`tests/product-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productInputSchema } from "@/lib/products/validation";

describe("productInputSchema", () => {
  it("requires a name, SKU, category, non-negative price, and non-negative stock", () => {
    const result = productInputSchema.safeParse({
      name: "Solar Panel 200W",
      sku: "SOL-200W",
      categoryId: "category_1",
      priceCents: 1250000,
      stockQuantity: 4
    });

    expect(result.success).toBe(true);
  });
});
```

Run: `npm test -- tests/product-validation.test.ts`

Expected: FAIL because validation does not exist.

- [ ] **Step 2: Implement product validation**

`lib/products/validation.ts`:

```ts
import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2),
  categoryId: z.string().min(1),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  priceCents: z.coerce.number().int().min(0),
  compareAtCents: z.coerce.number().int().min(0).optional(),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(3),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  isHotDeal: z.coerce.boolean().default(false)
});
```

Run: `npm test -- tests/product-validation.test.ts`

Expected: PASS.

- [ ] **Step 3: Implement upload helper**

Accept JPEG, PNG, and WebP files up to a configured size. Save development uploads under `public/uploads/products`. Return URLs like `/uploads/products/<safe-file-name>`.

- [ ] **Step 4: Build admin product pages**

Admin can list, create, edit, archive, upload multiple images, mark primary image, change sort order, set stock, and set featured/hot deal flags.

- [ ] **Step 5: Commit**

Run:

```bash
git add app/admin lib/products lib/uploads tests/product-validation.test.ts
git commit -m "feat: add admin product management"
```

## Task 6: Cart, Wishlist, Checkout, Orders, and Invoices

**Files:**
- Create: `lib/cart/cart-service.ts`
- Create: `lib/wishlist/wishlist-service.ts`
- Create: `lib/checkout/whatsapp.ts`
- Create: `lib/orders/order-service.ts`
- Create: `lib/invoices/invoice-service.ts`
- Create: `app/cart/page.tsx`
- Create: `app/wishlist/page.tsx`
- Create: `app/checkout/page.tsx`
- Create: `app/account/orders/page.tsx`
- Create: `app/account/orders/[id]/page.tsx`
- Test: `tests/checkout-whatsapp.test.ts`

- [ ] **Step 1: Write failing WhatsApp checkout test**

`tests/checkout-whatsapp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildWhatsAppCheckoutUrl } from "@/lib/checkout/whatsapp";

describe("buildWhatsAppCheckoutUrl", () => {
  it("builds a prefilled WhatsApp order message", () => {
    const url = buildWhatsAppCheckoutUrl({
      phone: "254703586562",
      orderNumber: "SUN-1001",
      customerName: "Jane Doe",
      totalLabel: "KSH 12,500.00",
      items: [{ name: "Solar Panel", quantity: 1 }]
    });

    expect(url).toContain("https://wa.me/254703586562");
    expect(decodeURIComponent(url)).toContain("SUN-1001");
    expect(decodeURIComponent(url)).toContain("Solar Panel x1");
  });
});
```

Run: `npm test -- tests/checkout-whatsapp.test.ts`

Expected: FAIL because WhatsApp checkout helper does not exist.

- [ ] **Step 2: Implement WhatsApp checkout URL**

`lib/checkout/whatsapp.ts`:

```ts
type WhatsAppCheckoutInput = {
  phone: string;
  orderNumber: string;
  customerName: string;
  totalLabel: string;
  items: Array<{ name: string; quantity: number }>;
};

export function buildWhatsAppCheckoutUrl(input: WhatsAppCheckoutInput) {
  const lines = [
    `Hello Sunspark, I would like to place order ${input.orderNumber}.`,
    `Customer: ${input.customerName}`,
    `Total: ${input.totalLabel}`,
    "Items:",
    ...input.items.map((item) => `- ${item.name} x${item.quantity}`)
  ];

  return `https://wa.me/${input.phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
```

Run: `npm test -- tests/checkout-whatsapp.test.ts`

Expected: PASS.

- [ ] **Step 3: Build cart and wishlist services**

Guest cart stores in browser state/cookie. Logged-in cart and wishlist persist in SQL. Cart quantity changes enforce stock limits.

- [ ] **Step 4: Build checkout and order creation**

Checkout creates an order, captures line item names/prices at purchase time, updates stock movement, creates invoice record, and presents enabled payment options from `CheckoutSettings`.

- [ ] **Step 5: Build invoice view/download**

Generate a simple printable invoice page first. Add PDF generation after the HTML invoice is verified.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/cart app/wishlist app/checkout app/account lib/cart lib/wishlist lib/checkout lib/orders lib/invoices tests/checkout-whatsapp.test.ts
git commit -m "feat: add cart wishlist checkout and invoices"
```

## Task 7: SEO, Tracking Hooks, and Responsive Verification

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `lib/tracking/events.ts`
- Create: `e2e/storefront.spec.ts`
- Modify: `app/globals.css`
- Modify: storefront/admin pages as needed after screenshots.

- [ ] **Step 1: Add sitemap and robots**

Generate static routes plus active category and product URLs. Allow normal crawling and point to `https://sunsparkelectricals.co.ke/sitemap.xml`.

- [ ] **Step 2: Add event tracking helper**

Track internal events for product view, add to cart, wishlist, checkout started, and order placed. Keep implementation local/no-op until analytics ID is configured.

- [ ] **Step 3: Add Playwright storefront checks**

`e2e/storefront.spec.ts` verifies home, store, product, checkout, login, and admin login pages at desktop and mobile widths.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test
npm run build
npm run dev
npm run e2e
```

Expected: unit tests pass, production build succeeds, browser tests pass, and pages do not show major layout overlap or horizontal scrolling.

- [ ] **Step 5: Commit**

Run:

```bash
git add app lib e2e
git commit -m "feat: add seo tracking and responsive verification"
```

## Self-Review

- Spec coverage: The plan covers the modern Next.js stack, Prisma/SQL schema, Sunspark branding, categories, customer auth, admin product management, image uploads, wishlist, cart, checkout settings, WhatsApp checkout, order/invoice basics, SEO, tracking hooks, and mobile verification.
- Gaps intentionally deferred: live M-Pesa Daraja transaction processing, real email provider sending, and WhatsApp Business API attachment sending require production credentials. The plan creates integration points and settings but does not fake live credentials.
- Placeholder scan: No `TBD`, `TODO`, or `implement later` language is used as a task requirement.
- Type consistency: Helpers use stable names: `formatMoney`, `hashPassword`, `verifyPassword`, `getPrimaryImage`, `productInputSchema`, and `buildWhatsAppCheckoutUrl`.

# Sunspark Electrical and Solar E-Commerce Design

Date: 2026-07-10

## Goal

Rebuild the existing static Electro-style e-commerce template into a production-ready Sunspark Electrical and Solar online store using Next.js, React, SQL, and Prisma. The new site keeps the existing template layout and shopping interactions as the visual baseline, but replaces demo content with Sunspark branding, real product data, customer accounts, checkout flows, stock tracking, invoices, and an admin dashboard.

## Brand and Business Details

- Business name: Sunspark Electrical and Solar.
- Domain target: sunspark.co.ke.
- Currency: KSH.
- WhatsApp/phone: 0703586562.
- Admin email: admin@sunspark.co.ke.
- Default admin password for initial setup: Password.
- Facebook: https://www.facebook.com/profile.php?id=61589534876668.
- Location: Nairobi CBD, Duruma Road, Downtown Tower, second floor, shop number 8, Nairobi, Kenya.
- Logo source: root `logo.jpg`, copied/optimized into the app public assets.

The default admin password must be treated as a setup credential only. The admin dashboard should prompt or strongly guide the admin to change it before production launch.

## Technology

- Frontend and backend framework: Next.js with React and TypeScript.
- Database access: Prisma ORM.
- SQL database: PostgreSQL recommended, with MySQL possible if hosting requires it.
- Styling: keep the template's Bootstrap-like e-commerce layout and interactions, then modernize into reusable React components.
- Image storage: product images are uploaded to host storage or a public uploads folder; SQL stores image metadata and file URLs/paths, not binary image blobs.

Images should not be stored directly in the SQL database because file/object storage is faster to serve, easier to cache, cheaper to back up, and better for products with multiple images.

## Site Structure

### Public Storefront

- Home page based on the current template's `index.html`.
- Store/category page based on `store.html`.
- Product detail page based on `product.html`.
- Checkout page based on `checkout.html`.
- Account pages for login, registration, profile, orders, and wishlist.
- SEO-friendly product and category URLs.

The storefront should preserve the familiar layout: top contact bar, main header, search, cart/wishlist controls, navigation, category sections, product cards, product gallery, product tabs, cart summary, checkout form, newsletter/footer area where appropriate.

### Categories

Top-level categories:

- Electricals.
- Electronics.
- Solar.

The admin can create, rename, hide, and reorder categories and subcategories. The database may include initial general categories under these groups, but product seeding is not required unless requested later.

### Product Experience

Products include:

- Name.
- Slug.
- SKU.
- Category/subcategory.
- Short description.
- Full description.
- Price in KSH.
- Compare-at price or discount price where needed.
- Stock quantity.
- Low-stock threshold.
- Active/inactive status.
- Featured/hot deal flags.
- Multiple images.
- SEO title, description, and keywords.

Product detail pages support:

- Clickable gallery thumbnails.
- Main image zoom or lightbox behavior.
- Add to cart.
- Add to wishlist.
- Stock status.
- Related products.
- Product details/specifications.

### Customer Accounts

Customers can register with:

- Name.
- Email.
- Password.

Customers can:

- Sign in/out.
- Edit account details.
- Persist wishlist across devices.
- Place orders.
- View order history.
- Re-download invoices.

Passwords are hashed. Account routes require authentication where appropriate.

### Cart and Checkout

Cart behavior:

- Works for guests during the current session.
- Persists to customer account after login.
- Supports quantity changes and stock checks.

Checkout methods:

- WhatsApp checkout.
- M-Pesa checkout.

The admin can enable or disable each checkout method. WhatsApp checkout can launch a prefilled WhatsApp message to 0703586562 with customer/order details. M-Pesa should be implemented behind a clean payment-provider interface so Daraja credentials can be added safely when available.

### Orders and Invoices

Orders include:

- Customer details.
- Line items.
- Quantities and prices captured at purchase time.
- Order status.
- Payment method.
- Payment status.
- Stock impact.
- Invoice number.

Invoices can be:

- Viewed.
- Downloaded as PDF.
- Prepared for email sending.
- Shared through WhatsApp as a link or attachment where hosting/API support allows.

Real email sending and WhatsApp Business API sending require production credentials. The app should be structured to add those credentials without changing order logic.

## Admin Dashboard

Admin features:

- Secure admin login.
- Dashboard overview: sales, orders, low stock, recent customers.
- Product management: create, edit, delete/archive, upload multiple images, set featured/hot deal flags.
- Category management.
- Stock tracking and low-stock warnings.
- Order management: view orders, update status, track payment status.
- Invoice management: view/download invoices.
- Checkout settings: enable/disable WhatsApp and M-Pesa.
- Basic site settings: phone, email, social links, location/map link, SEO defaults.

Admin actions should be protected from normal customer accounts.

## Database Model

Initial Prisma models:

- User.
- AdminProfile or role-based User.
- CustomerProfile.
- Category.
- Product.
- ProductImage.
- WishlistItem.
- Cart.
- CartItem.
- Order.
- OrderItem.
- Invoice.
- CheckoutSettings.
- SiteSettings.
- StockMovement.

Roles should separate admin and customer access. Product images should have sort order, alt text, and a primary image flag.

## SEO and Tracking

SEO requirements:

- Page titles and meta descriptions.
- Product/category canonical URLs.
- Open Graph metadata.
- Product structured data where practical.
- Sitemap generation.
- Robots.txt.
- Clean slugs.

Tracking requirements:

- Support analytics insertion through environment/config.
- Track key e-commerce events internally where useful: product views, add to cart, wishlist, checkout started, order placed.
- Respect privacy by avoiding unnecessary personal data capture.

## Responsive Design

The current layout remains the base, but must be improved on smaller screens:

- Header stacks cleanly without clipped text.
- Search is easy to use on mobile.
- Navigation menu is touch-friendly.
- Product grid adapts to one or two columns depending on screen width.
- Product gallery fits mobile screens.
- Checkout form is readable and avoids horizontal scrolling.
- Cart/wishlist controls remain accessible.
- Admin dashboard remains usable on tablets and phones.

## Performance

- Use Next.js image optimization for local/public images where possible.
- Use responsive image sizes.
- Avoid loading large product images before needed.
- Cache product/category pages where safe.
- Keep CSS and JavaScript lean.
- Prefer server-rendered product/category pages for SEO and first load speed.

## Security

- Hash passwords.
- Protect admin routes.
- Validate all form input server-side.
- Restrict uploaded files to safe image formats and size limits.
- Do not expose payment credentials in frontend code.
- Use environment variables for database, M-Pesa, email, and any tracking IDs.
- Use CSRF-conscious server actions/API design for sensitive writes.

## Testing

Key tests:

- Auth registration/login validation.
- Product creation with multiple images.
- Wishlist persistence for logged-in customer.
- Cart quantity and stock checks.
- Checkout settings enable/disable behavior.
- WhatsApp checkout message generation.
- Order creation and invoice generation.
- Admin authorization.

Browser verification:

- Home, store, product, checkout, login, account, and admin pages at desktop and mobile sizes.
- Confirm no major overlap, horizontal scrolling, broken images, or clipped controls.

## Implementation Approach

1. Create a Next.js TypeScript app structure while preserving template assets as references.
2. Convert common template areas into reusable React components: header, navigation, footer, product card, category tile, cart summary, product gallery.
3. Add Prisma schema and database access layer.
4. Add authentication and role protection.
5. Build storefront pages with real data.
6. Build admin dashboard and product image upload.
7. Add cart, wishlist, orders, checkout, stock, and invoices.
8. Add SEO, sitemap, tracking hooks, and production settings.
9. Run tests and browser checks across desktop/mobile.

## Open Production Inputs

These are not blockers for local implementation, but are needed before live launch:

- Final SQL provider and production database URL.
- Hosting provider and upload storage path or object storage choice.
- M-Pesa Daraja credentials if M-Pesa checkout should go live.
- Email sending provider credentials if invoice emails should be sent directly.
- Analytics/tracking IDs.

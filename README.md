# Sunspark Electrical and Solar

Modern Next.js e-commerce site for Sunspark Electrical and Solar.

## Stack

- Next.js + React + TypeScript
- Prisma + MySQL/MariaDB
- File uploads for product images
- Admin dashboard for products, categories, customers, orders, checkout settings

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set the real values:

```bash
DATABASE_URL="database url"
SESSION_SECRET="use-a-long-random-secret"
NEXT_PUBLIC_SITE_URL="public url"
```

3. Push schema and seed setup data:

```bash
npm run db:push
npm run seed
```

4. Run locally:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Admin

Admin login route:

```text
/admin/login
```

The public storefront does not link to admin. The setup seed creates:

```text
admin
Password
```

Change this password before launch.

## Product Images

Product images upload to:

```text
public/uploads/products
```

Each uploaded image must be JPEG, PNG, or WebP and below 2MB. SQL stores only image URLs, not binary image data.

On hosting, make sure the uploads directory is writable and backed up. For larger production scale, move uploads to object storage and keep the same URL-based database design.

## HostAfrica Deployment

From the GitHub repo:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run seed
npm run build
npm start
```

Required environment variables on HostAfrica:

```text
DATABASE_URL
SESSION_SECRET
NEXT_PUBLIC_SITE_URL
EMAIL_FROM
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
```

If `npm run db:push` fails with `Access denied`, confirm the MySQL password and allow the hosting/server IP to connect to the MySQL database.

## Verification

```bash
npm test
npm run build
npm run e2e
```

Current verified flows:

- Homepage categories and product rail
- Store page
- Cart
- Checkout
- Hidden admin login route
- Mobile and desktop no horizontal overflow

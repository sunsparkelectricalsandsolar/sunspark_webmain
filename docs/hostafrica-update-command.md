# HostAfrica Backend Update Command

Run this on SSH for `backend.sunsparkelectricals.co.ke`:

```bash
cd ~/sunspark
bash docs/hostafrica-deploy.sh
```

First deploy or dependency changes:

```bash
cd ~/sunspark
INSTALL_DEPS=1 RUN_SEED=1 bash docs/hostafrica-deploy.sh
```

Daily update after pushing code:

```bash
cd ~/sunspark
bash docs/hostafrica-deploy.sh
```

Backend cPanel Node app settings:

```text
Application root: sunspark/apps/api
Startup file: dist/server.js
Node: 20.x
App URL: backend.sunsparkelectricals.co.ke
```

Required backend `.env` in `~/sunspark/apps/api/.env`:

```text
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
PORT=4000
FRONTEND_ORIGIN="https://sunsparkelectricals.co.ke"
SESSION_SECRET="long-random-secret"
ADMIN_EMAIL="admin@sunsparkelectricals.co.ke"
ADMIN_PASSWORD="Password"
REPORT_EMAIL="sunsparkelectricalsandsolar@gmail.com"
SUPPORT_EMAIL="support@sunsparkelectricals.co.ke"
WHATSAPP_PHONE="254703586562"
```

Frontend Vercel env:

```text
NEXT_PUBLIC_API_URL="https://backend.sunsparkelectricals.co.ke"
API_INTERNAL_URL="https://backend.sunsparkelectricals.co.ke"
NEXT_PUBLIC_SITE_URL="https://sunsparkelectricals.co.ke"
SESSION_SECRET="same-long-random-secret"
```

There is no Prisma step. Use `npm run migrate` and `npm run seed` inside `apps/api`.

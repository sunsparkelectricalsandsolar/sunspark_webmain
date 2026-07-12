# HostAfrica Update Command

Run this from the HostAfrica SSH terminal after code has been pushed to GitHub:

```bash
cd ~/sunspark
git fetch origin main
git checkout main
git pull --ff-only origin main

source "$HOME/nodevenv/sunspark/20/bin/activate"
export NODE_ENV=production
export NPM_CONFIG_PRODUCTION=false

rm -rf .next
npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --prefer-offline --maxsockets=1
npx prisma generate
npx prisma db push
npm run seed
npm run build

mkdir -p tmp
touch tmp/restart.txt
```

Admin seed:

```bash
npm run seed
```

This makes sure `admin@sunsparkelectricals.co.ke` exists. It creates the admin with password `Password` only when the admin does not already exist.

Emergency admin password reset:

```bash
RESET_ADMIN_PASSWORD=true npm run seed
```

This deliberately resets `admin@sunsparkelectricals.co.ke` back to password `Password`.

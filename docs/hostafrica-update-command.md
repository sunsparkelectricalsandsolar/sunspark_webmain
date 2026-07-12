# HostAfrica Update Command

Run this from the HostAfrica SSH terminal after code has been pushed to GitHub:

```bash
cd ~/sunspark
bash docs/hostafrica-deploy.sh
```

The normal deploy command skips `npm install` because that is the step HostAfrica/CloudLinux often kills.

Run this only when `package.json` or `package-lock.json` changed:

```bash
cd ~/sunspark
INSTALL_DEPS=1 bash docs/hostafrica-deploy.sh
```

For the current update that added password reset email, run the `INSTALL_DEPS=1` version once. After that, use the normal command unless dependencies change again.

That uses the lowest-memory install command:

```bash
npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --prefer-offline --maxsockets=1
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

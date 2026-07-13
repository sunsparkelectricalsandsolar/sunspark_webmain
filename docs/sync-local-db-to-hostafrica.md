# Sync Local Data To HostAfrica

The backend now uses plain SQL migrations, not Prisma.

To prepare the live database structure:

```bash
cd ~/sunspark/apps/api
npm run migrate
```

To seed admin, default categories, and settings:

```bash
cd ~/sunspark/apps/api
npm run seed
```

If this database already contains the old Prisma tables such as `product`, `category`, `user`, and `productimage`, copy them into the new backend tables:

```bash
cd ~/sunspark/apps/api
npm run import:legacy
```

This import is non-destructive: it does not drop old tables.

To copy local data to live, export the local MySQL database and import it on HostAfrica:

```powershell
mysqldump -u root -p sunspark > sunspark-local-data.sql
scp .\sunspark-local-data.sql <ssh-user>@<ssh-host>:~/sunspark-local-data.sql
```

On HostAfrica:

```bash
mysql -u DB_USER -p DB_NAME < ~/sunspark-local-data.sql
```

Uploaded product/category images are files, not database rows. Copy `public/uploads` to the frontend host or move them to permanent object storage before launch.

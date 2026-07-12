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

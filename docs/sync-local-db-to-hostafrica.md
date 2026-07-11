# Sync Local Data To HostAfrica

`npx prisma db push` makes the live database schema match the code. It does not copy local products, categories, customers, orders, images, or settings.

To copy local data to live, export the local MySQL database, upload the SQL file to the HostAfrica account, then run the deploy script with `IMPORT_SQL`.

On the local machine, export the local database:

```powershell
mysqldump -u root -p --databases sunspark > sunspark-local-data.sql
```

If the local database has a different name, replace `sunspark`. Upload `sunspark-local-data.sql` to the server, for example:

```powershell
scp .\sunspark-local-data.sql <ssh-user>@<ssh-host>:~/sunspark-local-data.sql
```

On HostAfrica SSH, import while deploying:

```bash
IMPORT_SQL="$HOME/sunspark-local-data.sql" bash ~/sunspark/docs/hostafrica-deploy.sh
```

Uploaded product/category images are files, not database rows. Copy `public/uploads` to the server as well when local uploaded images should appear live:

```powershell
scp -r .\public\uploads <ssh-user>@<ssh-host>:~/sunspark/public/
```

Only import local data into live when it is acceptable to overwrite or merge live records. If customers or orders already exist live, take a database backup first from cPanel/phpMyAdmin.

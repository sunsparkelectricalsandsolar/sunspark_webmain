# HostAfrica product import

This imports the private Sunspark product list into the HostAfrica MySQL database.

The product data contains buying prices, so do not commit the data files to GitHub.

## Files to upload privately

Upload these two local files to the server:

- `outputs/sunspark-product-import-prep/products.json`
- `outputs/sunspark-product-import-prep/options.json`

Recommended server folder:

```bash
/home/sunspark/private-imports/sunspark-products/
```

## First run

```bash
cd ~/sunsparkbackend
git pull --ff-only origin main
bash docs/hostafrica-deploy.sh

cd ~/sunsparkbackend/apps/api
source "$HOME/nodevenv/sunsparkbackend/apps/api/20/bin/activate"
npm run import:products -- \
  --products "$HOME/private-imports/sunspark-products/products.json" \
  --options "$HOME/private-imports/sunspark-products/options.json"
```

## Dry run

Use this first if you want to check counts without saving:

```bash
cd ~/sunsparkbackend/apps/api
source "$HOME/nodevenv/sunsparkbackend/apps/api/20/bin/activate"
npm run import:products -- \
  --products "$HOME/private-imports/sunspark-products/products.json" \
  --options "$HOME/private-imports/sunspark-products/options.json" \
  --dry-run
```

## Important behavior

- New imported products are inactive by default because images will be added slowly.
- Existing active products stay active unless you pass `--force-inactive`.
- Existing stock is not overwritten unless you pass `--update-stock`.
- Prices and buying costs are updated from the import file.
- Products are matched by slug, so the script can be run again without creating duplicates.
- Options are matched by product, option label, and selling unit.
- Stock multiplier starts as `1` for every option. Set roll/metre multipliers from the admin product edit screen after confirming the real stock unit.

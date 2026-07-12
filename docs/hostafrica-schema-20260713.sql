ALTER TABLE `Order`
  ADD COLUMN `deliveryLocation` VARCHAR(191) NULL,
  ADD COLUMN `deliveryMapUrl` VARCHAR(191) NULL,
  ADD COLUMN `deliveryLatitude` VARCHAR(191) NULL,
  ADD COLUMN `deliveryLongitude` VARCHAR(191) NULL;

ALTER TABLE `DraftInvoice`
  ADD COLUMN `kind` ENUM('INVOICE', 'QUOTATION') NOT NULL DEFAULT 'INVOICE';

CREATE INDEX `DraftInvoice_kind_status_idx` ON `DraftInvoice` (`kind`, `status`);

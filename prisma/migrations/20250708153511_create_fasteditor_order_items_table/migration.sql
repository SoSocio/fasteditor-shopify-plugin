-- CreateTable
CREATE TABLE "FastEditorOrderItems" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "projectKey" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageFee" REAL NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "billedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "FastEditorOrderItems_shop_idx" ON "FastEditorOrderItems"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "FastEditorOrderItems_shop_orderId_lineItemId_key" ON "FastEditorOrderItems"("shop", "orderId", "lineItemId");

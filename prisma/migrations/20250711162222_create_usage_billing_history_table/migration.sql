-- CreateTable
CREATE TABLE "UsageBillingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "UsageBillingHistory_shop_idx" ON "UsageBillingHistory"("shop");

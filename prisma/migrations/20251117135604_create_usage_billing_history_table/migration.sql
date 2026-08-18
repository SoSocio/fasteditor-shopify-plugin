-- CreateTable
CREATE TABLE "UsageBillingHistory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageBillingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageBillingHistory_shop_idx" ON "UsageBillingHistory"("shop");

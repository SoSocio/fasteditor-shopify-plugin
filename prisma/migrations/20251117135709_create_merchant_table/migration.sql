-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Merchant_shop_idx" ON "Merchant"("shop");

-- CreateIndex
CREATE INDEX "Merchant_userId_idx" ON "Merchant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_userId_shop_key" ON "Merchant"("userId", "shop");

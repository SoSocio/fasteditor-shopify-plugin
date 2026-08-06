-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifySubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "fastEditorApiKey" TEXT,
    "fastEditorDomain" TEXT,
    "language" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

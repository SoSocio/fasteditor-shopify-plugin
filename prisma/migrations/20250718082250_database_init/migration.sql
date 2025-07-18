-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifySubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "fastEditorApiKey" TEXT,
    "fastEditorDomain" TEXT,
    "language" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FastEditorOrderItems" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "projectKey" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageFee" DOUBLE PRECISION NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "billedAt" TIMESTAMP(3),

    CONSTRAINT "FastEditorOrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageBillingHistory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageBillingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "base" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyRates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "FastEditorOrderItems_shop_idx" ON "FastEditorOrderItems"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "FastEditorOrderItems_shop_orderId_lineItemId_key" ON "FastEditorOrderItems"("shop", "orderId", "lineItemId");

-- CreateIndex
CREATE INDEX "UsageBillingHistory_shop_idx" ON "UsageBillingHistory"("shop");

-- CreateIndex
CREATE INDEX "CurrencyRates_code_idx" ON "CurrencyRates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRates_code_key" ON "CurrencyRates"("code");

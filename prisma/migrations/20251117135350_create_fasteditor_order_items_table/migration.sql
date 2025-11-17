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

-- CreateIndex
CREATE INDEX "FastEditorOrderItems_shop_idx" ON "FastEditorOrderItems"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "FastEditorOrderItems_shop_orderId_lineItemId_key" ON "FastEditorOrderItems"("shop", "orderId", "lineItemId");

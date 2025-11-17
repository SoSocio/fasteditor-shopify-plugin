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
CREATE INDEX "CurrencyRates_code_idx" ON "CurrencyRates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRates_code_key" ON "CurrencyRates"("code");

-- CreateTable
CREATE TABLE "CurrencyRates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "base" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CurrencyRates_code_idx" ON "CurrencyRates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRates_code_key" ON "CurrencyRates"("code");

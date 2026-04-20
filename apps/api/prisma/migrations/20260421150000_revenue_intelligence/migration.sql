-- Revenue Intelligence module: weather forecasts, revenue actuals,
-- pricing config, AI insights, correlation snapshots.

CREATE TYPE "WeatherCategory" AS ENUM ('EXCELENTE', 'BOM', 'REGULAR', 'RUIM', 'PESSIMO');
CREATE TYPE "DayType" AS ENUM ('FIM_DE_SEMANA', 'FERIADO', 'DIA_UTIL', 'EVENTO_ESPECIAL');
CREATE TYPE "RainIntensity" AS ENUM ('NENHUMA', 'LEVE', 'MODERADA', 'FORTE');
CREATE TYPE "PricingProduct" AS ENUM ('INGRESSO_AVULSO', 'PASSAPORTE_DIA', 'PASSAPORTE_MENSAL', 'PASSAPORTE_ANUAL', 'GRUPO_ESCOLAR', 'GRUPO_CORPORATIVO');
CREATE TYPE "InsightType" AS ENUM ('OPORTUNIDADE', 'RISCO', 'ACAO', 'SAZONALIDADE');
CREATE TYPE "InsightPriority" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE "InsightActionTaken" AS ENUM ('PENDENTE', 'ACEITOU', 'IGNOROU');

CREATE TABLE "WeatherForecast" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "forecastDate" DATE NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tempMax" DOUBLE PRECISION NOT NULL,
  "tempMin" DOUBLE PRECISION NOT NULL,
  "precipProbability" INTEGER NOT NULL,
  "precipSum" DOUBLE PRECISION NOT NULL,
  "windspeedMax" DOUBLE PRECISION NOT NULL,
  "uvIndexMax" DOUBLE PRECISION NOT NULL,
  "weathercode" INTEGER NOT NULL,
  "weatherScore" INTEGER NOT NULL,
  "weatherCategory" "WeatherCategory" NOT NULL,
  CONSTRAINT "WeatherForecast_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeatherForecast_tenantId_forecastDate_idx" ON "WeatherForecast"("tenantId", "forecastDate");
CREATE INDEX "WeatherForecast_tenantId_fetchedAt_idx" ON "WeatherForecast"("tenantId", "fetchedAt");

ALTER TABLE "WeatherForecast"
  ADD CONSTRAINT "WeatherForecast_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

CREATE TABLE "RevenueActual" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "date" DATE NOT NULL,
  "grossRevenueCents" INTEGER NOT NULL,
  "visitorCount" INTEGER,
  "ticketAvgCents" INTEGER,
  "capacityPct" DOUBLE PRECISION,
  "capacityTotal" INTEGER,
  "tempMaxActual" DOUBLE PRECISION,
  "weatherScoreActual" INTEGER,
  "hadRain" BOOLEAN NOT NULL DEFAULT false,
  "rainIntensity" "RainIntensity" NOT NULL DEFAULT 'NENHUMA',
  "dayType" "DayType" NOT NULL,
  "promotionsActive" JSONB NOT NULL DEFAULT '[]',
  "groupsCount" INTEGER,
  "groupsRevenueCents" INTEGER,
  "avulsoRevenueCents" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RevenueActual_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevenueActual_tenantId_date_key" ON "RevenueActual"("tenantId", "date");
CREATE INDEX "RevenueActual_tenantId_date_idx" ON "RevenueActual"("tenantId", "date");
CREATE INDEX "RevenueActual_tenantId_dayType_idx" ON "RevenueActual"("tenantId", "dayType");

ALTER TABLE "RevenueActual"
  ADD CONSTRAINT "RevenueActual_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

CREATE TABLE "PricingConfig" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "product" "PricingProduct" NOT NULL,
  "basePriceCents" INTEGER NOT NULL,
  "minPriceCents" INTEGER,
  "maxPriceCents" INTEGER,
  "multExcelente" DOUBLE PRECISION NOT NULL DEFAULT 1.20,
  "multBom" DOUBLE PRECISION NOT NULL DEFAULT 1.00,
  "multRegular" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
  "multRuim" DOUBLE PRECISION NOT NULL DEFAULT 0.78,
  "multPessimo" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingConfig_tenantId_product_key" ON "PricingConfig"("tenantId", "product");

ALTER TABLE "PricingConfig"
  ADD CONSTRAINT "PricingConfig_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

CREATE TABLE "RevenueInsight" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "targetDate" DATE,
  "insightType" "InsightType" NOT NULL,
  "priority" "InsightPriority" NOT NULL DEFAULT 'MEDIA',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "impactEstimateCents" INTEGER,
  "actionSuggested" TEXT,
  "whatsappMessage" TEXT,
  "actionTaken" "InsightActionTaken" NOT NULL DEFAULT 'PENDENTE',
  "actualOutcomeCents" INTEGER,
  "modelVersion" TEXT,
  "contextJson" JSONB,
  CONSTRAINT "RevenueInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RevenueInsight_tenantId_generatedAt_idx" ON "RevenueInsight"("tenantId", "generatedAt");
CREATE INDEX "RevenueInsight_tenantId_targetDate_idx" ON "RevenueInsight"("tenantId", "targetDate");

ALTER TABLE "RevenueInsight"
  ADD CONSTRAINT "RevenueInsight_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

CREATE TABLE "WeatherRevenueCorrelation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "periodDays" INTEGER NOT NULL,
  "sampleCount" INTEGER NOT NULL,
  "pearsonR" DOUBLE PRECISION,
  "rSquared" DOUBLE PRECISION,
  "slope" DOUBLE PRECISION,
  "intercept" DOUBLE PRECISION,
  "avgRevExcelente" DOUBLE PRECISION,
  "avgRevBom" DOUBLE PRECISION,
  "avgRevRegular" DOUBLE PRECISION,
  "avgRevRuim" DOUBLE PRECISION,
  "avgRevPessimo" DOUBLE PRECISION,
  "avgRevWeekend" DOUBLE PRECISION,
  "avgRevHoliday" DOUBLE PRECISION,
  "avgRevWeekday" DOUBLE PRECISION,
  CONSTRAINT "WeatherRevenueCorrelation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeatherRevenueCorrelation_tenantId_calculatedAt_idx" ON "WeatherRevenueCorrelation"("tenantId", "calculatedAt");

ALTER TABLE "WeatherRevenueCorrelation"
  ADD CONSTRAINT "WeatherRevenueCorrelation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

-- Add Report table linked to existing User model (patient reports)
-- Created manually because prisma migrate dev --create-only reported drift in existing migration history.

CREATE TABLE "Report" (
  "id" SERIAL NOT NULL,
  "patientId" INTEGER NOT NULL,
  "reportData" JSONB NOT NULL,
  "summary" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_patientId_idx" ON "Report"("patientId");
CREATE INDEX "Report_generatedAt_idx" ON "Report"("generatedAt");

ALTER TABLE "Report"
ADD CONSTRAINT "Report_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

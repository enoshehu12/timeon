-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "breakMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "holidayDate" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_holidayDate_key" ON "Holiday"("holidayDate");

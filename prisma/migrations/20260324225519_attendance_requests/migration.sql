/*
  Warnings:

  - You are about to drop the column `reason` on the `AttendanceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `AttendanceRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceRequest" DROP COLUMN "reason",
DROP COLUMN "reviewedAt";

-- AddForeignKey
ALTER TABLE "AttendanceRequest" ADD CONSTRAINT "AttendanceRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - The values [visible,hidden,reported] on the enum `CommentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [video,pdf,exam] on the enum `LessonType` will be removed. If these variants are still used in the database, this will fail.
  - The values [viewed,in_progress] on the enum `ProgressStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,canceled,expired] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `departmentId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `professor` on the `Course` table. All the data in the column will be lost.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,lessonId]` on the table `Progress` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `kind` on the `LessonAsset` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `provider` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `semester` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('PDF', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('BANKILY', 'MASRIVI', 'SEDAD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('VIDEOS_ONLY', 'DOCUMENTS_ONLY', 'FULL_ACCESS');

-- AlterEnum
BEGIN;
CREATE TYPE "CommentStatus_new" AS ENUM ('VISIBLE', 'HIDDEN', 'REPORTED');
ALTER TABLE "Comment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Comment" ALTER COLUMN "status" TYPE "CommentStatus_new" USING ("status"::text::"CommentStatus_new");
ALTER TYPE "CommentStatus" RENAME TO "CommentStatus_old";
ALTER TYPE "CommentStatus_new" RENAME TO "CommentStatus";
DROP TYPE "CommentStatus_old";
ALTER TABLE "Comment" ALTER COLUMN "status" SET DEFAULT 'VISIBLE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LessonType_new" AS ENUM ('VIDEO', 'PDF', 'EXAM');
ALTER TABLE "Lesson" ALTER COLUMN "type" TYPE "LessonType_new" USING ("type"::text::"LessonType_new");
ALTER TYPE "LessonType" RENAME TO "LessonType_old";
ALTER TYPE "LessonType_new" RENAME TO "LessonType";
DROP TYPE "LessonType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProgressStatus_new" AS ENUM ('VIEWED', 'IN_PROGRESS');
ALTER TABLE "Progress" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Progress" ALTER COLUMN "status" TYPE "ProgressStatus_new" USING ("status"::text::"ProgressStatus_new");
ALTER TYPE "ProgressStatus" RENAME TO "ProgressStatus_old";
ALTER TYPE "ProgressStatus_new" RENAME TO "ProgressStatus";
DROP TYPE "ProgressStatus_old";
ALTER TABLE "Progress" ALTER COLUMN "status" SET DEFAULT 'VIEWED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departmentId_fkey";

-- DropIndex
DROP INDEX "comments_lesson_created_idx";

-- DropIndex
DROP INDEX "Payment_providerRef_key";

-- DropIndex
DROP INDEX "subscriptions_user_status_idx";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "status" SET DEFAULT 'VISIBLE';

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "departmentId",
DROP COLUMN "professor",
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "requiresDocumentSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresVideoSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ADD COLUMN     "videoSize" INTEGER,
ADD COLUMN     "videoType" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LessonAsset" DROP COLUMN "kind",
ADD COLUMN     "kind" "AssetKind" NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "provider",
ADD COLUMN     "provider" "PaymentProvider" NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'MRU',
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Progress" ALTER COLUMN "status" SET DEFAULT 'VIEWED';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "startAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "SubscriptionType" NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'MRU';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
DROP COLUMN "departmentId",
DROP COLUMN "lastLoginAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "semester" SET NOT NULL,
ALTER COLUMN "semester" SET DATA TYPE TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT';

-- DropTable
DROP TABLE "Department";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "maxRedemptions" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" INTEGER NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

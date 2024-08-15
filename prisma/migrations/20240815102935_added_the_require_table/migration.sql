/*
  Warnings:

  - You are about to drop the column `companyCompany_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attendance_status` to the `attendance_health_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_driver` to the `attendance_health_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shift` to the `attendance_health_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_duration_plan` to the `attendance_health_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birth_date` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_company_id_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_department_id_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_employment_status_id_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_job_position_id_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_role_id_fkey";

-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_question_id_fkey";

-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyCompany_id_fkey";

-- AlterTable
ALTER TABLE "attendance_health_results" ADD COLUMN     "attendance_status" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_driver" BOOLEAN NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "shift" BOOLEAN NOT NULL,
ADD COLUMN     "vehicle_hull_number" TEXT,
ADD COLUMN     "work_duration_plan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employment_statuses" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "job_positions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "question" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "companyCompany_id",
ADD COLUMN     "birth_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "company_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "get_notification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "admins";

-- DropTable
DROP TABLE "answers";

-- CreateTable
CREATE TABLE "question_answer" (
    "question_answer_id" SERIAL NOT NULL,
    "question_answer" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_answer_pkey" PRIMARY KEY ("question_answer_id")
);

-- CreateTable
CREATE TABLE "response_user" (
    "response_user_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_answer_id" INTEGER NOT NULL,
    "attendance_health_result_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_user_pkey" PRIMARY KEY ("response_user_id")
);

-- CreateTable
CREATE TABLE "attendance_health_file_attachment" (
    "attendance_health_file_attachment_id" SERIAL NOT NULL,
    "attendance_health_result_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_health_file_attachment_pkey" PRIMARY KEY ("attendance_health_file_attachment_id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answer" ADD CONSTRAINT "question_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_user" ADD CONSTRAINT "response_user_attendance_health_result_id_fkey" FOREIGN KEY ("attendance_health_result_id") REFERENCES "attendance_health_results"("attendance_health_result_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_user" ADD CONSTRAINT "response_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_user" ADD CONSTRAINT "response_user_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_user" ADD CONSTRAINT "response_user_question_answer_id_fkey" FOREIGN KEY ("question_answer_id") REFERENCES "question_answer"("question_answer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_health_file_attachment" ADD CONSTRAINT "attendance_health_file_attachment_attendance_health_result_fkey" FOREIGN KEY ("attendance_health_result_id") REFERENCES "attendance_health_results"("attendance_health_result_id") ON DELETE RESTRICT ON UPDATE CASCADE;

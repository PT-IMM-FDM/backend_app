-- CreateEnum
CREATE TYPE "Result" AS ENUM ('FIT', 'FIT_FOLLOW_UP', 'UNFIT');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "password" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "company_id" INTEGER NOT NULL,
    "job_position_id" INTEGER NOT NULL,
    "employment_status_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "get_notification" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "company_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "job_position_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("job_position_id")
);

-- CreateTable
CREATE TABLE "employment_statuses" (
    "employment_status_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employment_statuses_pkey" PRIMARY KEY ("employment_status_id")
);

-- CreateTable
CREATE TABLE "departments" (
    "department_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "question" (
    "question_id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

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
CREATE TABLE "attendance_health_results" (
    "attendance_health_result_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "attendance_status" TEXT NOT NULL,
    "work_duration_plan" TEXT NOT NULL,
    "shift" BOOLEAN NOT NULL,
    "is_driver" BOOLEAN NOT NULL,
    "vehicle_hull_number" TEXT,
    "result" "Result" NOT NULL,
    "note" TEXT,
    "recomendation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_health_results_pkey" PRIMARY KEY ("attendance_health_result_id")
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

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_job_position_id_idx" ON "users"("job_position_id");

-- CreateIndex
CREATE INDEX "users_employment_status_id_idx" ON "users"("employment_status_id");

-- CreateIndex
CREATE INDEX "response_user_created_at_idx" ON "response_user"("created_at");

-- CreateIndex
CREATE INDEX "response_user_user_id_idx" ON "response_user"("user_id");

-- CreateIndex
CREATE INDEX "response_user_question_id_idx" ON "response_user"("question_id");

-- CreateIndex
CREATE INDEX "response_user_question_answer_id_idx" ON "response_user"("question_answer_id");

-- CreateIndex
CREATE INDEX "response_user_attendance_health_result_id_idx" ON "response_user"("attendance_health_result_id");

-- CreateIndex
CREATE INDEX "attendance_health_results_created_at_idx" ON "attendance_health_results"("created_at");

-- CreateIndex
CREATE INDEX "attendance_health_results_user_id_idx" ON "attendance_health_results"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("job_position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employment_status_id_fkey" FOREIGN KEY ("employment_status_id") REFERENCES "employment_statuses"("employment_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "attendance_health_results" ADD CONSTRAINT "attendance_health_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_health_file_attachment" ADD CONSTRAINT "attendance_health_file_attachment_attendance_health_result_fkey" FOREIGN KEY ("attendance_health_result_id") REFERENCES "attendance_health_results"("attendance_health_result_id") ON DELETE RESTRICT ON UPDATE CASCADE;


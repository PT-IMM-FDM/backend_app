-- CreateIndex
CREATE INDEX "attendance_health_results_created_at_idx" ON "attendance_health_results"("created_at");

-- CreateIndex
CREATE INDEX "attendance_health_results_user_id_idx" ON "attendance_health_results"("user_id");

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
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_job_position_id_idx" ON "users"("job_position_id");

-- CreateIndex
CREATE INDEX "users_employment_status_id_idx" ON "users"("employment_status_id");


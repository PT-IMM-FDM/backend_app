import { User } from "@prisma/client";

export type CreateUserRequest = Omit<
  User,
  "user_id" | "created_at" | "deleted_at"
>;

export type CreateUserResponse = User;

export type GetUserRequest = {
  company_name?: string;
  job_position?: string;
  employment_status?: string;
  department?: string;
  name?: string;
};

export type GetUserResponse = User[];
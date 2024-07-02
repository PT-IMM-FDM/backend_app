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

export type UpdateUserRequest = {
  user_id: string;
  full_name?: string;
  phone_number?: string;
  company_id?: number;
  job_position_id?: number;
  employment_status_id?: number;
  department_id?: number;
}

export type UpdateUserResponse = User;

export type DeleteUserRequest = {
  user_id: string[];
}


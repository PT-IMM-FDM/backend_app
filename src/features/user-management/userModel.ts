import { User } from "@prisma/client";

export type CreateUserRequest = Omit<
  User,
  "user_id"| "password" | "created_at" | "deleted_at"
>;

export type CreateUserResponse = GetUserResponse;

export type GetUserRequest = {
  company_name?: string;
  job_position?: string;
  employment_status?: string;
  department?: string;
  name?: string;
};

export type GetUserResponse = {
  user_id: string;
  full_name: string;
  phone_number: string;
  birth_date: Date;
  company: {
    name: string;
  };
  job_position: {
    name: string;
  };
  employment_status: {
    name: string;
  };
  department: {
    name: string;
  };
};

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


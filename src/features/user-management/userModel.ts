import { User } from "@prisma/client";

export type CreateUserRequest = Omit<
  User,
  "user_id" | "password" | "created_at" | "deleted_at" | "email" | "is_active"
>;

export type CreateUserResponse = GetUserResponse;

export type GetUserRequest = {
  adminUserId: string;
  company_name?: string[];
  job_position?: string[];
  employment_status?: string[];
  department?: string[];
  user_id?: string;
  name?: string;
  is_active?: boolean;
};

export type GetUserResponse = {
  user_id: string;
  full_name: string;
  phone_number: string;
  birth_date: Date;
  company: {
    company_id: number;
    name: string;
  };
  job_position: {
    job_position_id: number;
    name: string;
  };
  employment_status: {
    employment_status_id: number;
    name: string;
  };
  department: {
    department_id: number;
    name: string;
  };
  role: {
    role_id: number;
    name: string;
  };
};

export type UpdateUserRequest = {
  user_id: string;
  full_name?: string;
  phone_number?: string;
  company_id?: number;
  email?: string;
  birth_date?: Date;
  job_position_id?: number;
  employment_status_id?: number;
  department_id?: number;
  role_id?: number;
  is_active?: boolean;
};

export type UpdateUserResponse = GetUserResponse;

export type DeleteUserRequest = {
  user_id: string[];
};

export type UpdatePassword = {
  user_id: string;
  old_password: string;
  new_password: string;
}

export type ResetPassword = {
  user_id: string;
}
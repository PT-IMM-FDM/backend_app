import { User } from "@prisma/client";

export type LoginAdminRequest = {
  email: string;
  password: string;
}

export type LoginAdminResponse = {
  token: string;
}

export type LoginUserRequest = {
  number_phone: string;
  password: string;
}

export type LoginUserResponse = {
  token: string;
}

export type CurrentLoggedInAdminResponse = {
  admin_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  company: {
    name: string;
  },
  department: {
    department_id: number;
    name: string;
  };
  employment_status: {
    employment_status_id: number;
    name: string;
  };
  job_position: {
    job_position_id: number;
    name: string;
  };
  role: {
    role_id: number;
    name: string;
  };
};

export type CurrentLoggedInUserResponse = User & {
  job_position: {
    job_position_id: number;
    name: string;
  };
  employment_status: {
    employment_status_id: number;
    name: string;
  };
};
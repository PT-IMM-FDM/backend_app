import { Department } from "@prisma/client";

export type CreateDepartmentRequest = {
  name: string;
};

export type CreateDepartmentResponse = Department;

export type GetDepartmentResponse = Department[];

export type UpdateDepartmentRequest = {
  department_id: number;
  name: string;
};

export type UpdateDepartmentResponse = Department;

export type DeleteDepartmentRequest = {
  department_id: number;
};

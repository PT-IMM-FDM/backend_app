import { EmploymentStatus } from "@prisma/client";

export type CreateEmploymentStatusRequest = {
  name: string;
};

export type CreateEmploymentStatusResponse = EmploymentStatus;

export type GetEmploymentStatusResponse = EmploymentStatus[];

export type UpdateEmploymentStatusRequest = {
  employment_status_id: number;
  new_name: string;
};

export type UpdateEmploymentStatusResponse = EmploymentStatus;

export type DeleteEmploymentStatusRequest = {
  employment_status_id: number;
};

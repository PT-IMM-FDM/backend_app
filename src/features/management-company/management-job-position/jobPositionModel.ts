import { JobPosition } from "@prisma/client";

export type CreateJobPositionRequest = {
  name: string;
};

export type CreateJobPositionResponse = JobPosition

export type GetJobPositionResponse = JobPosition[]

export type UpdateJobPositionRequest = {
  job_position_id: number;
  new_name: string;
};

export type UpdateCompanyResponse = JobPosition

export type DeleteJobPositionRequest = {
  job_position_id: number;
};

import { Attendance_health_result, Result } from "@prisma/client";

export type GetFDMRequest = {
  startDate?: Date;
  endDate?: Date;
  user_id?: string;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
  result?: string;
  attendance_health_result_id?: number;
};

export type GetFDMResponse = Attendance_health_result[];

export type ResultKey = Result;
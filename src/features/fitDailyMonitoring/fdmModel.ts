import { AttendanceHealthResult, Result } from "@prisma/client";

export type GetFDMRequest = {
  adminUserId: string;
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

export type GetFDMResponse = AttendanceHealthResult[];

export type GetMyFDMRequest = {
  startDate?: Date;
  endDate?: Date;
  user_id: string;
};

export type GetMyFDMResponse = AttendanceHealthResult[];

export type ResultKey = Result;

export type GetFDMCountResultRequest = {
  user_id?: string;
  startDate?: Date;
  endDate?: Date;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
};

export type GetFDMCountFilledTodayRequest = {
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
}

export type WhoFilledTodayRequest = {
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
}
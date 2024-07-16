import { Attendance_health_result, Result } from "@prisma/client";

type DateFilter = "7" | "30" | "90" | "365" | "custom";

export type GetFDMRequest = {
  dateFilter?: DateFilter;
  customDateFrom?: Date;
  customDateTo?: Date;
  user_id?: string;
  job_position_id?: number;
  employment_status_id?: number;
  department_id?: number;
  company_id?: number;
  result?: string;
};

export type GetFDMResponse = Attendance_health_result[];

export type ResultKey = Result;
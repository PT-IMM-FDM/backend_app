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
  admin_user_id: string;
  user_id?: string;
  startDate?: Date;
  endDate?: Date;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
};

export type GetFDMCountFilledTodayRequest = {
  admin_user_id: string;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
}

export type WhoNotFilledTodayRequest = {
  admin_user_id: string;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
}

export type addAttachmentFileRequest = {
  attendance_health_result_id: number;
  file: Express.Multer.File;
};

export type deleteAttachmentFileRequest = {
  attendance_health_result_id: number;
  attendance_health_file_attachment_id: number;
};

export type addNoteRequest = {
  attendance_health_result_id: number;
  note: string;
};

export type MostQuestionAnswered = {
  admin_user_id: string;
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company_id?: number[];
};
import { Result } from '@prisma/client';

export type ExportFileListUsersRequest = {
  job_position_id?: number[];
  employment_status_id?: number[];
  department_id?: number[];
  company?: string[];
  date_from?: Date;
  date_to?: Date;
};

export type ImportFileListUsersRequest = {
  file_of_users: Express.Multer.File;
};

export type ExportDataFdmRequest = {
  result?: string;
  customDateFrom?: Date;
  customDateTo?: Date;
  user_id?: string;
  job_position_name?: string[];
  department_name?: string[];
  company_name?: string[];
  employment_status_name?: string[];
};

export type ResultKey = Result;

export type GenerateExcelFdmRequest = {
  created_at: Date;
  result: string;
  user: {
    full_name: string;
    phone_number: string;
    birth_date: Date;
    job_position: {
      name: string;
    };
    department: {
      name: string;
    };
    company: {
      name: string;
    };
    employment_status: {
      name: string;
    };
    ResponseUser: {
      question: {
        question: string;
      };
      question_answer: {
        question_answer: string;
      };
    }[];
  };
}[];
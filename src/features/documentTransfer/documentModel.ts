export type ExportFileListUsersRequest = {
  job_position?: string;
  employment_status?: string;
  department?: string;
  company?: string;
  date_from?: Date;
  date_to?: Date;
};

export type ImportFileListUsersRequest = {
  file_of_users: Express.Multer.File;
};

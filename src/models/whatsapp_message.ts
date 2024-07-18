export type dataFdmTodayReport = {
  total_employee : number;
  total_user : number;
  total_user_not_fill : number;
  total_fit : number;
  total_fit_follow_up : number;
  total_unfit : number;
}

export type dataFdmUnfit = {
  full_name : string;
  phone_number : string;
  department : string;
  description : string;
}
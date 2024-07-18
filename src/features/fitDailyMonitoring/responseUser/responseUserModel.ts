export type CreateResponseUserRequest = {
  user_id: string;
  question_id: number[];
  question_answer_id: number[];
  attendance_status: string
  work_duration_plan: string;
  shift: boolean
  is_driver: boolean;
  vehicle_hull_number?: string;
};

import z, { ZodType } from "zod";

export class ResponseUserValidation {
  static readonly CREATE_RESPONSE_USER: ZodType = z.object({
    user_id: z.string(),
    question_id: z.number().array(),
    question_answer_id: z.number().array(),
    attendance_status: z.string(),
    work_duration_plan: z.string(),
    shift: z.boolean(),
    is_driver: z.boolean(),
    vehicle_hull_number: z.string().optional(),
  });
}

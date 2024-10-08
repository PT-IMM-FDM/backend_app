import { Request, Response, NextFunction } from "express";
import { ResponseUserService } from "./responseUserService";

export class ResponseUserController {
  static async createResponseUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        user_id,
        question_id,
        question_answer_id,
        attendance_status,
        work_duration_plan,
        shift,
        is_driver,
        vehicle_hull_number,
      } = req.body;

      const createResponseUser = await ResponseUserService.createResponseUser({
        user_id,
        question_id,
        question_answer_id,
        attendance_status,
        work_duration_plan,
        shift: shift === "true" ? true : false,
        is_driver: is_driver === "true" ? true : false,
        vehicle_hull_number,
      });
      return res.status(200).json({
        success: true,
        data: createResponseUser,
        message: "Response User created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getResponseUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { user_id, attandance_health_result_id } = req.params;
      const getResponseUserById = await ResponseUserService.getResponseUserById(
        {
          user_id,
          attandance_health_result_id: parseInt(attandance_health_result_id),
        }
      );
      return res.status(200).json({
        success: true,
        data: getResponseUserById,
        message: "Response User fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

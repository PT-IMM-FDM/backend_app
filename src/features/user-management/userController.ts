import { Request, Response, NextFunction } from "express";
import { UserService } from "./userService";

export class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        full_name,
        phone_number,
        company_id,
        job_position_id,
        employment_status_id,
        department_id,
      } = req.body;
      const createUser = await UserService.createUser({
        full_name,
        phone_number,
        company_id,
        job_position_id,
        employment_status_id,
        department_id,
      });
      return res.status(200).json({
        success: true,
        data: createUser,
        message: "User created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        company_name,
        job_position,
        employment_status,
        department,
        name,
      } = req.query;
      const getUsers = await UserService.getUsers({
        company_name: company_name as string,
        job_position: job_position as string,
        employment_status: employment_status as string,
        department: department as string,
        name: name as string,
      });
      return res.status(200).json({
        success: true,
        data: getUsers,
        message: "Users fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

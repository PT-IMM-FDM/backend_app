import { Request, Response, NextFunction } from "express";
import { UserService } from "./userService";

export class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        full_name,
        phone_number,
        company_id,
        birth_date,
        job_position_id,
        employment_status_id,
        department_id,
        role_id,
      } = req.body;
      const createUser = await UserService.createUser({
        full_name,
        phone_number,
        company_id,
        birth_date,
        job_position_id,
        employment_status_id,
        department_id,
        role_id,
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
        is_active,
      } = req.query;
      let is_active_to_boolean

      if(is_active !== undefined){
        is_active_to_boolean = is_active === "true" ? true : false
      }
      const getUsers = await UserService.getUsers({
        company_name: company_name as string,
        job_position: job_position as string,
        employment_status: employment_status as string,
        department: department as string,
        name: name as string,
        is_active: is_active_to_boolean,
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

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        user_id,
        full_name,
        phone_number,
        company_id,
        job_position_id,
        employment_status_id,
        department_id,
        role_id,
        is_active,
      } = req.body;
      const updateUser = await UserService.updateUser({
        user_id,
        full_name,
        phone_number,
        company_id,
        job_position_id,
        employment_status_id,
        department_id,
        role_id,
        is_active,
      });
      return res.status(200).json({
        success: true,
        data: updateUser,
        message: "User updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = req.body;
      await UserService.deleteUser({ user_id });
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

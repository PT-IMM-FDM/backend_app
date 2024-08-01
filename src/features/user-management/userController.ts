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
        user_id,
      } = req.body;
      let is_active_to_boolean;

      if (is_active !== undefined) {
        is_active_to_boolean = is_active === "true" ? true : false;
      }
      const getUsers = await UserService.getUsers({
        adminUserId: res.locals.user.user_id,
        company_name,
        job_position,
        employment_status,
        department,
        name,
        is_active: is_active_to_boolean,
        user_id,
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
        email,
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
        email,
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

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = res.locals.user.user_id;
      const {
        full_name,
        phone_number,
        email,
      } = req.body;
      const updateUser = await UserService.updateUser({
        user_id,
        full_name,
        phone_number,
        email,
      });

      return res.status(200).json({
        success: true,
        data: updateUser,
        message: "My profile updated successfully",
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

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = res.locals.user.user_id;
      const { old_password, new_password } = req.body;
      await UserService.updatePassword({ user_id, old_password, new_password });
      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = req.params.user_id;
      await UserService.resetPassword({ user_id });
      return res.status(200).json({
        success: true,  
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

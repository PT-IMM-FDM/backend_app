import { Request, Response, NextFunction } from "express";
import { DepartmentService } from "./departmentService";

export class DepartmentController {
  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const department = await DepartmentService.createDepartment({ name });
      res.status(200).json({
        success: true,
        data: department,
        message: `Department ${department.name} has been created`,
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async getDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.getDepartment();
      res.status(200).json({
        success: true,
        data: department,
        message: `Department has been fetched`,
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { department_id, new_name } = req.body;
      const department = await DepartmentService.updateDepartment({ department_id, new_name });
      res.status(200).json({
        success: true,
        data: department,
        message: `Department ${department.name} has been updated`,
      });
    }
    catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { department_id } = req.body;
      const department = await DepartmentService.deleteDepartment({ department_id });
      res.status(200).json({
        success: true,
        data: department,
        message: `Department has been deleted`,
      });
    }
    catch (error) {
      next(error);
    }
  }
}
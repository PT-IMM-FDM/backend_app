import { Request, Response, NextFunction } from "express";
import { EmploymentStatusService } from "./employmentStatusService";

export class EmploymentStatusController {
  static async createEmploymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name } = req.body;
      const employmentStatus =
        await EmploymentStatusService.createEmploymentStatus({ name });
      res.status(200).json({
        success: true,
        data: employmentStatus,
        message: `Employment Status ${employmentStatus.name} has been created`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmploymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const employmentStatus =
        await EmploymentStatusService.getEmploymentStatus();
      res.status(200).json({
        success: true,
        data: employmentStatus,
        message: `Employment Status has been fetched`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEmploymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employment_status_id, name } = req.body;
      const employmentStatus =
        await EmploymentStatusService.updateEmploymentStatus({
          employment_status_id,
          name,
        });
      res.status(200).json({
        success: true,
        data: employmentStatus,
        message: `Employment Status ${employmentStatus.name} has been updated`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEmploymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employment_status_id } = req.body;
      const employmentStatus =
        await EmploymentStatusService.deleteEmploymentStatus({
          employment_status_id,
        });
      res.status(200).json({
        success: true,
        data: employmentStatus,
        message: `Employment Status has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
}

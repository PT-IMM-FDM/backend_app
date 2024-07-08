import { Request, Response, NextFunction } from "express";
import { JobPositionService } from "./jobPositionService";

export class JobPositionController {
  static async createJobPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const jobPosition = await JobPositionService.createJobPosition({ name });
      res.status(200).json({
        success: true,
        data: jobPosition,
        message: `Job Position ${jobPosition.name} has been created`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getJobPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const jobPosition = await JobPositionService.getJobPosition();
      res.status(200).json({
        success: true,
        data: jobPosition,
        message: `Job Position has been fetched`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateJobPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { job_position_id, new_name } = req.body;
      const jobPosition = await JobPositionService.updateJobPosition({ job_position_id, new_name });
      res.status(200).json({
        success: true,
        data: jobPosition,
        message: `Job Position ${jobPosition.name} has been updated`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteJobPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { job_position_id } = req.body;
      const jobPosition = await JobPositionService.deleteJobPosition({ job_position_id });
      res.status(200).json({
        success: true,
        data: jobPosition,
        message: `Job Position has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
}

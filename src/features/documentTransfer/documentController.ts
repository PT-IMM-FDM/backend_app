import { Request, Response, NextFunction } from "express";
import { DocumentService } from "./documentService";
import { ErrorResponse } from "../../models";

export class DocumentController {
  static async exportFileListUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { job_position, employment_status, department, company } = req.body;
      const file = await DocumentService.exportFileListUsers({
        job_position,
        employment_status,
        department,
        company,
      });
      res.status(200).json({
        success: true,
        data: file,
        message: "Document list users",
      });
    } catch (error) {
      next(error);
    }
  }

  static async importFileListUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const file_of_users = req.file as Express.Multer.File;
      const file = await DocumentService.importFileListUsers({
        file_of_users,
      });
      res.status(200).json({
        success: true,
        data: file,
        message: "Import file list users",
      });
    } catch (error) {
      next(error);
    }
  }

  static async templateFileListUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const file = await DocumentService.templateFileListUsers();
      res.status(200).json({
        success: true,
        data: file,
        message: "Template file list users",
      })
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from "express";
import { DocumentService } from "./documentService";

export class DocumentController {
  static async getDocumentListUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { job_position, employment_status, department, company } = req.body;
      const result = await DocumentService.getDocumentListUsers({
        job_position,
        employment_status,
        department,
        company,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: "Document list users",
      });
    } catch (error) {
      next(error);
    }
  }
}

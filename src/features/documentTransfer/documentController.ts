import { Request, Response, NextFunction } from "express";
import { DocumentService } from "./documentService";
import { ErrorResponse } from "../../models";
import { parseArrayParam } from "../../utils";
import path from "path";

export class DocumentController {
  static async exportFileListUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      /* 
      jpid = job_position_id
      esid = employment_status_id
      did = department_id
      cid = company_id
      */
      const { jpid, esid, did, company } = req.query;
      const file = await DocumentService.exportFileListUsers({
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        department_id: parseArrayParam(did),
        company: company as string[],
      });
      
      res.status(200).json({
        success: true,
        data: file,
        message: "Export file list users",
});
;
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
      });


    } catch (error) {
      next(error);
    }
  }

  static async exportDataFdm(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        result,
        startDate,
        endDate,
        user_id,
        job_position_name,
        department_name,
        company_name,
        employment_status_name,
      } = req.body;

      let startDateUtc;
      let endDateUtc;
      
      if (startDate && endDate) {
        let startDateFormat = new Date(Date.parse(startDate.toString()));
        startDateFormat.setHours(0, 0, 0, 0);
        let endDateFormat = new Date(Date.parse(endDate.toString()));
        endDateFormat.setHours(23, 59, 59, 999);
        const utcOffset = 8 * 60 * 60 * 1000; // -8 hours in milliseconds

        startDateUtc = new Date(startDateFormat.getTime() - utcOffset);
        endDateUtc = new Date(endDateFormat.getTime() - utcOffset);
      }

      const file = await DocumentService.exportDataFdm({
        result,
        customDateFrom: startDateUtc,
        customDateTo: endDateUtc,
        user_id,
        job_position_name,
        department_name,
        company_name,
        employment_status_name,
      });

      res.status(200).json({
        success: true,
        data: file,
        message: "Export data FDM",
      });

    } catch (error) {
      next(error);
    }
  }
}

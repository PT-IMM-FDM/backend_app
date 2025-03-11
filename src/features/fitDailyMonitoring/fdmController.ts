import { Request, Response, NextFunction } from "express";
import { FdmService } from "./fdmService";
import { ErrorResponse } from "../../models";
import { parseArrayParam } from "../../utils";

export class FdmController {
  static async getFDM(req: Request, res: Response, next: NextFunction) {
    try {
      /*
      jpid = job_position_id
      esid = employment_status_id
      cid = company_id
      did = department_id
      uid = user_id 
      ahrid = attendance_health_result_id
      */
      const { startDate, endDate, uid, jpid, esid, cid, did, result, ahrid, page } =
        req.query;

      const adminUserId = res.locals.user.user_id;
      let formattedStartDate;
      let formattedEndDate;

      if (startDate && endDate) {
        formattedStartDate = new Date(Date.parse(startDate.toString()));
        formattedStartDate.setHours(formattedStartDate.getHours() - 8);

        formattedEndDate = new Date(Date.parse(endDate.toString()));
        formattedEndDate.setHours(formattedEndDate.getHours() + 16);
      }

      const getFDM = await FdmService.getFDM({
        adminUserId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        user_id: uid as string,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        company_id: parseArrayParam(cid),
        department_id: parseArrayParam(did),
        result: result as string,
        attendance_health_result_id: Number(ahrid),
        page: Number(page),
      });

      return res.status(200).json({
        success: true,
        data: getFDM,
        message: "FDM fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyFDM(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const user_id = res.locals.user.user_id;
      let formattedStartDate;
      let formattedEndDate;

      if (startDate && endDate) {
        formattedStartDate = new Date(Date.parse(startDate.toString()));
        formattedStartDate.setHours(formattedStartDate.getHours());

        formattedEndDate = new Date(Date.parse(endDate.toString()));
        formattedEndDate.setHours(formattedEndDate.getHours() + 24);
      }

      const getMyFDM = await FdmService.getMyFDM({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        user_id,
      });

      return res.status(200).json({
        success: true,
        data: getMyFDM,
        message: "FDM fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async countResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, uid, jpid, esid, cid, did } = req.query;
      const adminUserId = res.locals.user.user_id;

      let formattedStartDate;
      let formattedEndDate;

      if (startDate && endDate) {
        formattedStartDate = new Date(Date.parse(startDate.toString()));
        formattedStartDate.setHours(formattedStartDate.getHours());

        formattedEndDate = new Date(Date.parse(endDate.toString()));
        formattedEndDate.setHours(formattedEndDate.getHours() + 24);
      }

      const countResult = await FdmService.countResult({
        admin_user_id: adminUserId,
        user_id: uid as string,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        company_id: parseArrayParam(cid),
        department_id: parseArrayParam(did),
      });

      return res.status(200).json({
        success: true,
        data: countResult,
        message: "FDM count result fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async countFilledToday(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { jpid, esid, did, cid } = req.query;
      const adminUserId = res.locals.user.user_id;

      const countFilledToday = await FdmService.countFilledToday({
        admin_user_id: adminUserId,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        department_id: parseArrayParam(did),
        company_id: parseArrayParam(cid),
      });

      return res.status(200).json({
        success: true,
        data: countFilledToday,
        message: "FDM count filled today fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsersNotFilledToday(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { jpid, esid, did, cid } = req.query;
      const adminUserId = res.locals.user.user_id;

      const whoFilledToday = await FdmService.getUsersNotFilledToday({
        admin_user_id: adminUserId,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        department_id: parseArrayParam(did),
        company_id: parseArrayParam(cid),
      });

      return res.status(200).json({
        success: true,
        data: whoFilledToday,
        message: "FDM who filled today fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async addAttachmentFile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const attendance_health_result_id = parseInt(
        req.params.attendance_health_result_id
      );
      const fdm_attachment_file = req.file as Express.Multer.File;

      if (!fdm_attachment_file) {
        throw new ErrorResponse(
          "File not found",
          400,
          ["file"],
          "FILE_NOT_FOUND"
        );
      }

      await FdmService.addAttachmentFile({
        attendance_health_result_id,
        file: fdm_attachment_file,
      });

      return res.status(200).json({
        success: true,
        message: "Attachment file added successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachmentFile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const attendance_health_result_id = parseInt(
        req.params.attendance_health_result_id
      );
      const attendance_health_file_attachment_id = parseInt(
        req.params.attendance_health_file_attachment_id
      );

      await FdmService.deleteAttachmentFile({
        attendance_health_result_id,
        attendance_health_file_attachment_id,
      });

      return res.status(200).json({
        success: true,
        message: "Attachment file deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance_health_result_id = parseInt(
        req.params.attendance_health_result_id
      );
      const { note } = req.body;

      await FdmService.addNote({
        attendance_health_result_id,
        note,
      });

      return res.status(200).json({
        success: true,
        message: "Note added successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async mostQuestionAnswered(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { jpid, esid, did, cid } = req.query;
      const admin_user_id = res.locals.user.user_id;

      const mostQuestionAnswered = await FdmService.mostQuestionAnswered({
        admin_user_id,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        department_id: parseArrayParam(did),
        company_id: parseArrayParam(cid),
      });

      return res.status(200).json({
        success: true,
        data: mostQuestionAnswered,
        message: "Most question answered fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

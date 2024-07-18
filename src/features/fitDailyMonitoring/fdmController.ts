import { Request, Response, NextFunction } from "express";
import { FdmService } from "./fdmService";
import { ErrorResponse } from "../../models";

export class FdmController {
  static async getFDM(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        dateFilter,
        customDateFrom,
        customDateTo,
        user_id,
        job_position_id,
        employment_status_id,
        company_id,
        result,
      } = req.query;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      let startDate;
      let endDate = new Date(today);

      switch (dateFilter) {
        case "7":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "365":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 365);
          break;
        case "custom":
          if (!customDateFrom || !customDateTo) {
            throw new ErrorResponse(
              "Custom date range is required",
              400,
              ["Custom date range is required"],
              "CUSTOM_DATE_REQUIRED"
            );
          }
          startDate = new Date(Date.parse(customDateFrom.toString()));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(Date.parse(customDateTo.toString()));
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          throw new ErrorResponse(
            "Invalid date filter",
            400,
            ["Invalid date filter"],
            "INVALID_DATE_FILTER"
          );
      }

      const getFDM = await FdmService.getFDM({
        dateFilter: dateFilter,
        customDateFrom: startDate,
        customDateTo: endDate,
        user_id: user_id as string,
        job_position_id: Number(job_position_id),
        employment_status_id: Number(employment_status_id),
        company_id: Number(company_id),
        result: result as string,
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
}

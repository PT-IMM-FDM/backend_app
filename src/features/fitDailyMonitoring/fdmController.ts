import { Request, Response, NextFunction } from "express";
import { FdmService } from "./fdmService";
import { ErrorResponse } from "../../models";

const parseArrayParam = (param: any): number[] | undefined => {
  if (!param) return undefined;

  if (Array.isArray(param)) {
    // Jika param adalah array, konversikan setiap elemen menjadi angka
    return param.map((item) => {
      const num = parseInt(item);
      if (isNaN(num)) {
        console.warn(`Warning: "${item}" cannot be converted to a number`);
      }
      return num;
    }).filter((num) => !isNaN(num));
  } else if (typeof param === 'string') {
    // Jika param adalah string, ubah menjadi array angka
    return param.split(',').map((item) => {
      const num = parseInt(item.trim());
      if (isNaN(num)) {
        console.warn(`Warning: "${item}" cannot be converted to a number`);
      }
      return num;
    }).filter((num) => !isNaN(num));
  }

  // Jika param bukan string atau array, langsung konversikan menjadi angka tunggal
  const num = parseInt(param);
  if (isNaN(num)) {
    console.warn(`Warning: "${param}" cannot be converted to a number`);
    return undefined;
  }
  return [num];
};

export class FdmController {
  static async getFDM(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        startDate,
        endDate,
        user_id,
        job_position_id,
        employment_status_id,
        company_id,
        department_id,
        result,
        attendance_health_result_id,
      } = req.query;

      let formattedStartDate;
      let formattedEndDate;

      if (startDate && endDate) {
        formattedStartDate = new Date(Date.parse(startDate.toString()));
        formattedStartDate.setHours(0, 0, 0, 0);

        formattedEndDate = new Date(Date.parse(endDate.toString()));
        formattedEndDate.setHours(23, 59, 59, 999);
      }

      const getFDM = await FdmService.getFDM({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        user_id: user_id as string,
        job_position_id: parseArrayParam(job_position_id),
        employment_status_id: parseArrayParam(employment_status_id),
        company_id: parseArrayParam(company_id),
        department_id: parseArrayParam(department_id),
        result: result as string,
        attendance_health_result_id: Number(attendance_health_result_id),
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

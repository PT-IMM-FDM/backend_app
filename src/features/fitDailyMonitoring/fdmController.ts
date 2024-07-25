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
      /*
      jpid = job_position_id
      esid = employment_status_id
      cid = company_id
      did = department_id
      uid = user_id 
      ahrid = attendance_health_result_id
      */
      const {
        startDate,
        endDate,
        uid,
        jpid,
        esid,
        cid,
        did,
        result,
        ahrid,
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
        user_id: uid as string,
        job_position_id: parseArrayParam(jpid),
        employment_status_id: parseArrayParam(esid),
        company_id: parseArrayParam(cid),
        department_id: parseArrayParam(did),
        result: result as string,
        attendance_health_result_id: Number(ahrid),
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

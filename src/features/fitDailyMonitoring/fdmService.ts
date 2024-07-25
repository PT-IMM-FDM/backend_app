import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { FDMValidation } from "./fdmValidation";
import { GetFDMRequest, GetFDMResponse, ResultKey } from "./fdmModel";

type ResultEnum = ResultKey;

const resultEnumMapping: { [key in ResultEnum]: ResultEnum } = {
  FIT: "FIT",
  FIT_FOLLOW_UP: "FIT_FOLLOW_UP",
  UNFIT: "UNFIT",
};

export class FdmService {
  static async getFDM(data: GetFDMRequest): Promise<GetFDMResponse> {
    let resultValue;
    if (data.result) {
      resultValue = resultEnumMapping[data.result as ResultKey];
    }
    const validateData = Validation.validate(FDMValidation.GET_FDM, data);
    const fdm = await prisma.attendance_health_result.findMany({
      where: {
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        result: resultValue,
        user: {
          user_id: validateData.user_id,
          job_position_id: {in: validateData.job_position_id},
          department_id: {in: validateData.department_id},
          company_id: { in: validateData.company_id },
          employment_status_id: {in: validateData.employment_status_id},
          deleted_at: null,
        },
        attendance_health_result_id: validateData.attendance_health_result_id,
      },
      include: {
        user: {
          select: {
            full_name: true,
            job_position: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
            company: {
              select: {
                name: true,
              },
            },
            employment_status: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return fdm;
  }
}

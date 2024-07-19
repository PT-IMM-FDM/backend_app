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
          gte: validateData.customDateFrom,
          lte: validateData.customDateTo,
        },
        result: resultValue,
        user: {
          user_id: validateData.user_id,
          job_position_id: validateData.job_position_id,
          department_id: validateData.department_id,
          company_id: validateData.company_id,
          employment_status_id: validateData.employment_status_id,
        },
      },
    });
    return fdm;
  }
}

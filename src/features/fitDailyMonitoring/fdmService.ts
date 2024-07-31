import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { FDMValidation } from "./fdmValidation";
import {
  GetFDMCountFilledTodayRequest,
  GetFDMCountResultRequest,
  GetFDMRequest,
  GetFDMResponse,
  GetMyFDMRequest,
  GetMyFDMResponse,
  ResultKey,
  WhoFilledTodayRequest,
} from "./fdmModel";

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

    const adminRole = await prisma.user.findUnique({
      where: {
        user_id: validateData.adminUserId,
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        department_id: true,
        company_id: true,
      },
    });

    let fdm;

    if (
      adminRole &&
      adminRole.role.name !== "Admin" &&
      adminRole.role.name !== "Full Viewer"
    ) {
      fdm = await prisma.attendance_health_result.findMany({
        where: {
          created_at: {
            gte: validateData.startDate,
            lte: validateData.endDate,
          },
          result: resultValue,
          user: {
            user_id: validateData.user_id,
            job_position_id: { in: validateData.job_position_id },
            department_id: adminRole.department_id,
            company_id: adminRole.company_id,
            employment_status_id: { in: validateData.employment_status_id },
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
    } else if (
      (adminRole && adminRole.role.name === "Full Viewer") ||
      (adminRole && adminRole.role.name === "Admin")
    ) {
      fdm = await prisma.attendance_health_result.findMany({
        where: {
          created_at: {
            gte: validateData.startDate,
            lte: validateData.endDate,
          },
          result: resultValue,
          user: {
            user_id: validateData.user_id,
            job_position_id: { in: validateData.job_position_id },
            department_id: { in: validateData.department_id },
            company_id: { in: validateData.company_id },
            employment_status_id: { in: validateData.employment_status_id },
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
    }
    fdm = await prisma.attendance_health_result.findMany({
      where: {
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        result: resultValue,
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
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

  static async getMyFDM(data: GetMyFDMRequest): Promise<GetMyFDMResponse> {
    const validateData = Validation.validate(FDMValidation.MY_FDM, data);
    const myFdm = await prisma.attendance_health_result.findMany({
      where: {
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          deleted_at: null,
        },
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
    return myFdm;
  }

  static async countResult(data: GetFDMCountResultRequest) {
    const validateData = Validation.validate(FDMValidation.COUNT_RESULT, data);
    const resultFit = await prisma.attendance_health_result.count({
      where: {
        result: "FIT",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
      },
    });

    const resultFitFollowUp = await prisma.attendance_health_result.count({
      where: {
        result: "FIT_FOLLOW_UP",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
      },
    });

    const resultUnfit = await prisma.attendance_health_result.count({
      where: {
        result: "UNFIT",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
      },
    });
    return {
      resultFit,
      resultFitFollowUp,
      resultUnfit,
    };
  }

  static async countFilledToday(data: GetFDMCountFilledTodayRequest) {
    const validateData = Validation.validate(
      FDMValidation.COUNT_FILLED_TODAY,
      data
    );

    const countFilledToday = await prisma.attendance_health_result.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        user: {
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
      },
    });
    return countFilledToday;
  }

  static async getUsersNotFilledToday(data: WhoFilledTodayRequest) {
    const validateData = Validation.validate(
      FDMValidation.WHO_FILLED_TODAY,
      data
    );

    const usersFilledToday = await prisma.attendance_health_result.findMany({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        user: {
          job_position_id: { in: validateData.job_position_id },
          department_id: { in: validateData.department_id },
          company_id: { in: validateData.company_id },
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
      },
      select: {
        user_id: true,
      },
    });

    const userIdsFilledToday = usersFilledToday.map((user) => user.user_id);

    const usersNotFilledToday = await prisma.user.findMany({
      where: {
        user_id: {
          notIn: userIdsFilledToday,
        },
        job_position_id: { in: validateData.job_position_id },
        department_id: { in: validateData.department_id },
        company_id: { in: validateData.company_id },
        employment_status_id: { in: validateData.employment_status_id },
        deleted_at: null,
      },
      select: {
        user_id: true,
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
    });

    return usersNotFilledToday;
  }
}

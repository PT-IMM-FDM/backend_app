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
  WhoNotFilledTodayRequest,
  addAttachmentFileRequest,
} from "./fdmModel";

type ResultEnum = ResultKey;

const resultEnumMapping: { [key in ResultEnum]: ResultEnum } = {
  FIT: "FIT",
  FIT_FOLLOW_UP: "FIT_FOLLOW_UP",
  UNFIT: "UNFIT",
};

export class FdmService {
  static async getFDM(data: GetFDMRequest): Promise<GetFDMResponse> {
    const resultValue = data.result
      ? resultEnumMapping[data.result as ResultKey]
      : undefined;

    const validateData = Validation.validate(FDMValidation.GET_FDM, data);

    const adminRole = await prisma.user.findUnique({
      where: { user_id: validateData.adminUserId },
      select: {
        role: { select: { name: true } },
        department_id: true,
        company_id: true,
      },
    });

    const isViewer =
      adminRole &&
      adminRole.role.name !== "Admin" &&
      adminRole.role.name !== "Full Viewer";

    const whereClause = {
      created_at: {
        gte: validateData.startDate,
        lte: validateData.endDate,
      },
      result: resultValue,
      user: {
        user_id: validateData.user_id,
        job_position_id: { in: validateData.job_position_id },
        department_id: isViewer
          ? adminRole.department_id
          : { in: validateData.department_id },
        company_id: isViewer
          ? adminRole.company_id
          : { in: validateData.company_id },
        employment_status_id: { in: validateData.employment_status_id },
        deleted_at: null,
      },
      attendance_health_result_id: validateData.attendance_health_result_id,
    };

    const fdm = await prisma.attendanceHealthResult.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            full_name: true,
            job_position: { select: { name: true } },
            department: { select: { name: true } },
            company: { select: { name: true } },
            employment_status: { select: { name: true } },
          },
        },
      },
    });

    return fdm;
  }

  static async getMyFDM(data: GetMyFDMRequest): Promise<GetMyFDMResponse> {
    const validateData = Validation.validate(FDMValidation.MY_FDM, data);
    const myFdm = await prisma.attendanceHealthResult.findMany({
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
      select: {
        attendance_health_result_id: true,
        attendance_status: true,
        work_duration_plan: true,
        shift: true,
        is_driver: true,
        vehicle_hull_number: true,
        result: true,
        note: true,
        recomendation: true,
        created_at: true,
        user_id: true,
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

    const admin = await prisma.user.findUnique({
      where: {
        user_id: validateData.admin_user_id,
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            department_id: true,
          },
        },
      },
    });

    const jobPositionIds = validateData.job_position_id;
    const companyIds = validateData.company_id;
    const employmentStatusIds = validateData.employment_status_id;
    const departmentIds =
      admin?.role.name === "Viewer"
        ? [admin.department.department_id]
        : validateData.department_id;

    const resultFit = await prisma.attendanceHealthResult.count({
      where: {
        result: "FIT",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
          deleted_at: null,
        },
      },
    });

    const resultFitFollowUp = await prisma.attendanceHealthResult.count({
      where: {
        result: "FIT_FOLLOW_UP",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
          deleted_at: null,
        },
      },
    });

    const resultUnfit = await prisma.attendanceHealthResult.count({
      where: {
        result: "UNFIT",
        created_at: {
          gte: validateData.startDate,
          lte: validateData.endDate,
        },
        user: {
          user_id: validateData.user_id,
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
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

    const admin = await prisma.user.findUnique({
      where: {
        user_id: validateData.admin_user_id,
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            department_id: true,
          },
        },
      },
    });

    const jobPositionIds = validateData.job_position_id;
    const companyIds = validateData.company_id;
    const employmentStatusIds = validateData.employment_status_id;
    const departmentIds =
      admin?.role.name === "Viewer"
        ? [admin.department.department_id]
        : validateData.department_id;

    const countFilledToday = await prisma.attendanceHealthResult.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        user: {
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
          deleted_at: null,
        },
      },
    });
    return countFilledToday;
  }

  static async getUsersNotFilledToday(data: WhoNotFilledTodayRequest) {
    const validateData = Validation.validate(
      FDMValidation.WHO_FILLED_TODAY,
      data
    );

    const admin = await prisma.user.findUnique({
      where: {
        user_id: validateData.admin_user_id,
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            department_id: true,
          },
        },
        company: {
          select: {
            company_id: true,
          },
        },
      },
    });

    const jobPositionIds = validateData.job_position_id;
    const companyIds = validateData.company_id;
    const employmentStatusIds = validateData.employment_status_id;
    const departmentIds =
      admin?.role.name === "Viewer"
        ? [admin.department.department_id]
        : validateData.department_id;

    const usersFilledToday = await prisma.attendanceHealthResult.findMany({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        user: {
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
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
        job_position_id: { in: jobPositionIds },
        department_id: { in: departmentIds },
        company_id: { in: companyIds },
        employment_status_id: { in: employmentStatusIds },
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

  static async addAttachmentFile(data: addAttachmentFileRequest) {
    const validateData = Validation.validate(
      FDMValidation.ADD_ATTACHMENT_FILE,
      data
    );

    await prisma.attendanceHealthFileAttachment.create({
      data: {
        attendance_health_result_id: validateData.attendance_health_result_id,
        file_name: data.file.filename,
        file_size: data.file.size,
        file_type: data.file.mimetype,
        file_url: data.file.path,
      },
    });
  }
}

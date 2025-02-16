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
  MostQuestionAnswered,
  ResultKey,
  WhoNotFilledTodayRequest,
  addAttachmentFileRequest,
  addNoteRequest,
  deleteAttachmentFileRequest,
} from "./fdmModel";
import { pathToFileUrl } from "../../utils";
import { deleteFile } from "../../utils/delete_file";

type ResultEnum = ResultKey;

const resultEnumMapping: { [key in ResultEnum]: ResultEnum } = {
  FIT: "FIT",
  FIT_FOLLOW_UP: "FIT_FOLLOW_UP",
  UNFIT: "UNFIT",
};
let adminDefault: { user_id: string } | null;

const today = new Date();
const startOfDay = new Date(today.setHours(0, 0, 0, 0));
const endOfDay = new Date(today.setHours(23, 59, 59, 999));

startOfDay.setHours(startOfDay.getHours());
endOfDay.setHours(endOfDay.getHours());

export class FdmService {
  static async getFDM(data: GetFDMRequest): Promise<GetFDMResponse> {
    let adminDefault = await prisma.user.findFirst({
      where: {
        phone_number: "00000",
      },
      select: {
        user_id: true,
      },
    });

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
        user_id: { notIn: [adminDefault?.user_id ?? ""] },
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

    const page = data.page || 1;
    const pageSize = 100;

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
        attachment_health_file: true,
      },
      orderBy: { 
        created_at: "desc" 
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
      orderBy: {
        created_at: "desc",
      },
      take: 7,
    });
    return myFdm;
  }

  static async countResult(data: GetFDMCountResultRequest) {
    const validateData = Validation.validate(FDMValidation.COUNT_RESULT, data);

    adminDefault = await prisma.user.findFirst({
      where: {
        phone_number: "00000",
      },
      select: {
        user_id: true,
      },
    });

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

    const user_where_clause = {
      user_id: { notIn: [adminDefault?.user_id ?? ""] },
      job_position_id: { in: jobPositionIds },
      department_id: { in: departmentIds },
      company_id: { in: companyIds },
      employment_status_id: { in: employmentStatusIds },
      deleted_at: null,
    };

    const time_where_clause = {
        gte: validateData.startDate,
        lte: validateData.endDate,
    };
  

    const resultFit = await prisma.attendanceHealthResult.count({
      where: {
        result: "FIT",
        created_at: time_where_clause,
        user: user_where_clause,
      },
    });

    const resultFitFollowUp = await prisma.attendanceHealthResult.count({
      where: {
        result: "FIT_FOLLOW_UP",
        created_at: time_where_clause,
        user: user_where_clause,
      },
    });

    const resultUnfit = await prisma.attendanceHealthResult.count({
      where: {
        result: "UNFIT",
        created_at: time_where_clause,
        user: user_where_clause,
      },
    });

    const resultTotal = resultFit + resultFitFollowUp + resultUnfit;

    return {
      resultFit,
      resultFitFollowUp,
      resultUnfit,
      totalRespondent: resultTotal,
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
          gte: startOfDay,
          lte: endOfDay,
        },
        user: {
          user_id: { notIn: [adminDefault?.user_id ?? ""] },
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
    const adminDefault = await prisma.user.findFirst({
      where: {
        phone_number: "00000",
      },
      select: {
        user_id: true,
      },
    });

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
          gte: startOfDay,
          lte: endOfDay,
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
          not: adminDefault?.user_id,
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

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (byte)
    const MAX_PDF_COUNT = 3;

    if (data.file.size > MAX_FILE_SIZE) {
      throw new ErrorResponse(
        "File size exceeds the maximum limit of 5MB.",
        400,
        ["file"],
        "FILE_SIZE_TOO_LARGE"
      );
    }

    const existingPdfCount = await prisma.attendanceHealthFileAttachment.count({
      where: {
        attendance_health_result_id: validateData.attendance_health_result_id,
      },
    });

    if (existingPdfCount >= MAX_PDF_COUNT) {
      throw new ErrorResponse(
        "Maximum number of PDF files (3)",
        400,
        ["file"],
        "MAX_PDF_COUNT_EXCEEDED"
      );
    }

    const attachment = await prisma.attendanceHealthFileAttachment.create({
      data: {
        attendance_health_result_id: validateData.attendance_health_result_id,
        file_name: data.file.filename,
        file_size: data.file.size,
        file_type: data.file.mimetype,
        file_url: pathToFileUrl(
          data.file.path,
          process.env.API_URL || "localhost:3030"
        ),
      },
    });

    return attachment;
  }

  static async deleteAttachmentFile(data: deleteAttachmentFileRequest) {
    const validateData = Validation.validate(
      FDMValidation.DELETE_ATTACHMENT_FILE,
      data
    );

    const findAttachment =
      await prisma.attendanceHealthFileAttachment.findUnique({
        where: {
          attendance_health_result_id: validateData.attendance_health_result_id,
          attendance_health_file_attachment_id:
            validateData.attendance_health_file_attachment_id,
        },
      });

    if (!findAttachment) {
      throw new ErrorResponse(
        "File not found",
        404,
        ["file"],
        "FILE_NOT_FOUND"
      );
    }

    await deleteFile(findAttachment.file_url);

    const attachment = await prisma.attendanceHealthFileAttachment.delete({
      where: {
        attendance_health_file_attachment_id:
          validateData.attendance_health_file_attachment_id,
      },
    });

    return attachment;
  }

  static async addNote(data: addNoteRequest) {
    const validateData = Validation.validate(FDMValidation.ADD_NOTE, data);
    const note = await prisma.attendanceHealthResult.update({
      where: {
        attendance_health_result_id: validateData.attendance_health_result_id,
      },
      data: {
        note: validateData.note,
      },
    });
    return note;
  }

  static async mostQuestionAnswered(data: MostQuestionAnswered) {
    const validateData = Validation.validate(
      FDMValidation.MOST_QUESTION_ANSWERED,
      data
    );
    const startDate = new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = new Date(new Date().setHours(23, 59, 59, 999));
    const jobPositionIds = validateData.job_position_id;
    const companyIds = validateData.company_id;
    const employmentStatusIds = validateData.employment_status_id;
    const departmentIds = validateData.department_id;

    // Step 1: Fetch responses for today
    const responsesToday = await prisma.responseUser.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        user: {
          user_id: { notIn: [adminDefault?.user_id ?? ""] },
          job_position_id: { in: jobPositionIds },
          department_id: { in: departmentIds },
          company_id: { in: companyIds },
          employment_status_id: { in: employmentStatusIds },
          deleted_at: null,
        },
      },
      select: {
        question_id: true,
        question_answer_id: true,
        user: {
          select: {
            department_id: true,
          },
        },
      },
    });

    // Count the number of answers per question and answer
    const questionCounts = responsesToday.reduce((acc, response) => {
      const questionId = response.question_id;
      const questionAnswerId = response.question_answer_id;
      const departmentId = response.user.department_id;

      if (!acc[questionId]) {
        acc[questionId] = { total: 0, answers: {} };
      }

      acc[questionId].total += 1;

      if (!acc[questionId].answers[questionAnswerId]) {
        acc[questionId].answers[questionAnswerId] = {
          count: 0,
          byDepartment: {},
        };
      }

      acc[questionId].answers[questionAnswerId].count += 1;

      if (
        !acc[questionId].answers[questionAnswerId].byDepartment[departmentId]
      ) {
        acc[questionId].answers[questionAnswerId].byDepartment[
          departmentId
        ] = 0;
      }

      acc[questionId].answers[questionAnswerId].byDepartment[departmentId] += 1;

      return acc;
    }, {} as { [questionId: string]: { total: number; answers: { [questionAnswerId: string]: { count: number; byDepartment: { [departmentId: number]: number } } } } });

    // Format the results
    const formattedResults = Object.entries(questionCounts).map(
      ([questionId, data]) => ({
        question_id: parseInt(questionId, 10),
        total: data.total,
        question_answer: Object.entries(data.answers).map(
          ([questionAnswerId, answerData]) => ({
            question_answer_id: parseInt(questionAnswerId, 10),
            count: answerData.count,
            department: Object.entries(answerData.byDepartment).map(
              ([departmentId, count]) => ({
                department_id: parseInt(departmentId, 10),
                count,
              })
            ),
          })
        ),
      })
    );

    return formattedResults;
  }
}
